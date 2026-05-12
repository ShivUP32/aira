import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { UIMessage } from "ai";
import { cleanString, isUuid, jsonError, jsonOk, readBody, requireApiUser } from "@/lib/aira/api";
import { detectLang } from "@/lib/aira/language";
import { hasGroqEnv, hasRagEnv, isProduction } from "@/lib/aira/env";
import { generateWithFallback, streamWithFallback } from "@/lib/llm/groq";
import { getSystemPrompt, type Mode } from "@/lib/llm/prompts";
import { citationFromDocument, formatContextBlock, retrieve } from "@/lib/rag/retrieve";

type IncomingMessage = {
  role: "user" | "assistant" | "system";
  content?: string;
  text?: string | string[];
  parts?: { type?: string; text?: string }[];
};

const modes = new Set(["doubt", "learning", "practice", "revision"]);

function messageText(message: IncomingMessage) {
  if (typeof message.content === "string") return message.content;
  if (typeof message.text === "string") return message.text;
  if (Array.isArray(message.text)) return message.text.join("\n");
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((part) => part.type === "text" || part.text)
      .map((part) => part.text || "")
      .join("\n");
  }
  return "";
}

function lastUserMessage(messages: IncomingMessage[]) {
  const last = [...messages].reverse().find((message) => message.role === "user");
  return last ? messageText(last) : "";
}

export async function POST(request: Request) {
  const auth = await requireApiUser(request, { rateLimit: true, route: "chat" });
  if (!auth.ok && (!auth.localFallback || !auth.authConfigMissing)) return auth.response;

  const body = await readBody(request);
  const messages = (Array.isArray(body.messages) ? body.messages : []) as IncomingMessage[];
  const mode = modes.has(String(body.mode)) ? (String(body.mode) as Mode) : "doubt";
  const subject = cleanString(body.subject) || undefined;
  const query = cleanString(body.query || lastUserMessage(messages));
  const language = cleanString(body.language) || detectLang(query);
  const conversationId = isUuid(body.conversationId) ? String(body.conversationId) : undefined;
  const wantsUiStream = Boolean(cleanString(body.id));

  let contextBlock = "";
  let citations: ReturnType<typeof citationFromDocument>[] = [];

  if (query && hasRagEnv()) {
    try {
      const docs = await retrieve({
        query,
        filter: {
          ...(subject ? { subject } : {}),
          ...(language && language !== "both" ? { language } : {}),
        },
        limit: 5,
      });
      if (docs.length) {
        contextBlock = formatContextBlock(docs);
        citations = docs.map((doc, index) => ({
          ...citationFromDocument(doc, query, subject, index),
          similarity: doc.similarity || 0.8 - index * 0.05,
        }));
      }
    } catch (error) {
      console.error("Context retrieval failed", error);
      if (isProduction()) return jsonError("Retrieval is unavailable.", 503);
    }
  }

  const modelMessages = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: messageText(message),
    }))
    .filter((message) => message.content.trim());
  if (!modelMessages.length && query) {
    modelMessages.push({ role: "user", content: query });
  }

  if (hasGroqEnv()) {
    try {
      if (wantsUiStream) {
        const serverConversationId = auth.ok
          ? await ensureConversation(auth.supabase, auth.user, conversationId, mode, subject, query)
          : conversationId;
        const { result, modelId } = await streamWithFallback({
          system: getSystemPrompt(mode, contextBlock),
          messages: modelMessages,
          onFinish: auth.ok
            ? async ({ text, usage }) => {
                await persistConversationMessages(
                  auth.supabase,
                  auth.user,
                  serverConversationId,
                  mode,
                  subject,
                  query,
                  text,
                  citations,
                  modelId,
                  usage?.totalTokens
                );
              }
            : undefined,
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
          messageMetadata: ({ part }) => {
            if (part.type !== "finish") return undefined;
            return {
              conversationId: serverConversationId,
              citations,
              source: "groq",
              model: modelId,
              mode,
            };
          },
          headers: {
            "Cache-Control": "no-store, no-transform",
            "X-Accel-Buffering": "no",
          },
        });
      }

      const { result, modelId } = await generateWithFallback({
        system: getSystemPrompt(mode, contextBlock),
        messages: modelMessages,
      });

      const persistedConversationId = auth.ok
        ? await persistConversationMessages(auth.supabase, auth.user, conversationId, mode, subject, query, result.text, citations, modelId, result.usage?.totalTokens)
        : undefined;

      return jsonOk({
        answer: result.text,
        citations,
        source: "groq",
        model: modelId,
        usage: result.usage,
        mode,
        conversationId: persistedConversationId || conversationId,
      });
    } catch (error) {
      console.error("Groq failed", error);
      if (isProduction()) return jsonError("Chat model is unavailable.", 503);
    }
  } else if (isProduction() || wantsUiStream) {
    return jsonError("Chat model is not configured.", 503);
  }

  return jsonError("Chat model is not configured.", 503);
}

async function ensureConversation(
  supabase: SupabaseClient,
  user: User,
  conversationId: string | undefined,
  mode: Mode,
  subject: string | undefined,
  query: string
) {
  return persistConversationMessages(supabase, user, conversationId, mode, subject, query, "", [], "pending", undefined);
}

async function persistConversationMessages(
  supabase: SupabaseClient,
  user: User,
  conversationId: string | undefined,
  mode: Mode,
  subject: string | undefined,
  query: string,
  answer: string,
  citations: unknown[],
  model: string,
  tokens: number | undefined
) {
  if (!query) return conversationId;

  try {
    let serverConversationId = conversationId;
    if (serverConversationId) {
      const { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", serverConversationId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!conversation) serverConversationId = undefined;
    }

    if (!serverConversationId) {
      const { data, error } = await supabase
        .from("conversations")
        .insert({
          user_id: user.id,
          title: query.slice(0, 120) || "New conversation",
          subject,
          mode,
        })
        .select("id")
        .single();
      if (error || !data) throw error || new Error("Conversation create returned no row");
      serverConversationId = data.id;
    }

    if (answer) {
      await supabase.from("messages").insert([
        { conversation_id: serverConversationId, role: "user", content: query },
        {
          conversation_id: serverConversationId,
          role: "assistant",
          content: answer,
          citations,
          model_used: model,
          tokens_used: tokens,
        },
      ]);
    }
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", serverConversationId);
    return serverConversationId;
  } catch (error) {
    console.error("Conversation message persistence failed", error);
    if (isProduction()) throw error;
    return conversationId;
  }
}
