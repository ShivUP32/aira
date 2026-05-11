import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { cleanString, getAuthedSupabase, isUuid, jsonOk, readBody } from "@/lib/aira/api";
import { demoAnswer, detectLang, retrieveSeedDocs } from "@/lib/aira/demo-data";
import { hasOpenRouterEnv, hasRagEnv } from "@/lib/aira/env";
import { getSystemPrompt, type Mode } from "@/lib/llm/prompts";
import { formatContextBlock, retrieve } from "@/lib/rag/retrieve";

type IncomingMessage = {
  role: "user" | "assistant" | "system";
  content?: string;
  text?: string | string[];
  parts?: { type?: string; text?: string }[];
};

const modes = new Set(["doubt", "learning", "practice", "revision"]);
const openRouterModels = [
  process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free",
  process.env.OPENROUTER_FALLBACK_MODEL || "google/gemini-2.0-flash-exp:free",
].filter((model, index, models) => model && models.indexOf(model) === index);

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
  const body = await readBody(request);
  const messages = (Array.isArray(body.messages) ? body.messages : []) as IncomingMessage[];
  const mode = modes.has(String(body.mode)) ? (String(body.mode) as Mode) : "doubt";
  const subject = cleanString(body.subject) || undefined;
  const query = cleanString(body.query || lastUserMessage(messages));
  const language = cleanString(body.language) || detectLang(query);
  const conversationId = isUuid(body.conversationId) ? String(body.conversationId) : undefined;

  let contextBlock = "";
  let citations = retrieveSeedDocs(query, subject, 3);

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
        citations = docs.map((doc, index) => {
          const citation = doc.metadata.citation as (typeof citations)[number] | undefined;
          return citation || {
            ...retrieveSeedDocs(query, subject, 1)[0],
            id: String(doc.id),
            label: [
              doc.metadata.year && `CBSE ${doc.metadata.year}`,
              doc.metadata.subject,
              doc.metadata.set_label || doc.metadata.set,
              doc.metadata.q_no && `Q${doc.metadata.q_no}`,
              doc.metadata.marks && `${doc.metadata.marks}m`,
            ].filter(Boolean).join(" · "),
            question: doc.content,
            answer: doc.content,
            similarity: doc.similarity || 0.8 - index * 0.05,
          };
        });
      }
    } catch (error) {
      console.error("Context retrieval failed, using seed docs", error);
    }
  }

  if (!contextBlock) {
    contextBlock = citations
      .map((doc, index) => `[${index + 1}] Source: ${doc.label}\nQuestion: ${doc.question}\nSolution: ${doc.answer}`)
      .join("\n\n---\n\n");
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

  if (hasOpenRouterEnv()) {
    try {
      const openrouter = createOpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY!,
        headers: {
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          "X-Title": "Aira",
        },
      });

      let result: Awaited<ReturnType<typeof generateText>> | null = null;
      let modelUsed = "";
      for (const model of openRouterModels) {
        try {
          result = await generateText({
            model: openrouter(model),
            system: getSystemPrompt(mode, contextBlock),
            messages: modelMessages,
          });
          modelUsed = model;
          break;
        } catch (error) {
          console.error(`OpenRouter model failed (${model})`, error);
        }
      }

      if (!result) throw new Error("All OpenRouter models failed");

      await persistConversationMessages(conversationId, query, result.text, citations, modelUsed, result.usage?.totalTokens);

      return jsonOk({
        answer: result.text,
        citations,
        source: "openrouter",
        model: modelUsed,
        usage: result.usage,
        mode,
      });
    } catch (error) {
      console.error("OpenRouter failed, using local answer", error);
    }
  }

  const answer = demoAnswer(query, mode, citations);
  await persistConversationMessages(conversationId, query, answer, citations, "seed", undefined);

  return jsonOk({
    answer,
    citations,
    source: "seed",
    mode,
  });
}

async function persistConversationMessages(
  conversationId: string | undefined,
  query: string,
  answer: string,
  citations: unknown[],
  model: string,
  tokens: number | undefined
) {
  if (!conversationId || !query || !answer) return;

  try {
    const { supabase, user } = await getAuthedSupabase();
    if (!supabase || !user) return;

    const { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!conversation) return;

    await supabase.from("messages").insert([
      { conversation_id: conversationId, role: "user", content: query },
      {
        conversation_id: conversationId,
        role: "assistant",
        content: answer,
        citations,
        model_used: model,
        tokens_used: tokens,
      },
    ]);
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
  } catch (error) {
    console.error("Conversation message persistence failed", error);
  }
}
