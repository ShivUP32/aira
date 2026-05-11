import { cleanString, getAuthedSupabase, jsonOk, readBody } from "@/lib/aira/api";
import type { Mode } from "@/lib/llm/prompts";

const modes = new Set(["doubt", "learning", "practice", "revision"]);

function cleanMode(value: unknown): Mode {
  return modes.has(String(value)) ? (String(value) as Mode) : "doubt";
}

export async function GET() {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (supabase && user) {
      const { data, error } = await supabase
        .from("conversations")
        .select("id,title,mode,created_at,updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (!error) return jsonOk({ conversations: data || [], source: "supabase" });
    }
  } catch (error) {
    console.error("Conversation fetch failed", error);
  }

  return jsonOk({ conversations: [], source: "local" });
}

export async function POST(request: Request) {
  const body = await readBody(request);
  const now = new Date().toISOString();
  const fallback = {
    id: cleanString(body.id) || `local-${Date.now()}`,
    title: cleanString(body.title, "New conversation").slice(0, 120),
    mode: cleanMode(body.mode),
    created_at: now,
    updated_at: now,
  };

  try {
    const { supabase, user } = await getAuthedSupabase();
    if (supabase && user) {
      const existingId = cleanString(body.id);
      if (existingId) {
        const { data } = await supabase
          .from("conversations")
          .select("id,title,mode,created_at,updated_at")
          .eq("id", existingId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) return jsonOk({ conversation: data, source: "supabase" });
      }

      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title: fallback.title, mode: fallback.mode })
        .select("id,title,mode,created_at,updated_at")
        .single();
      if (!error && data) {
        const messages = Array.isArray(body.messages) ? body.messages : [];
        if (messages.length) {
          await supabase.from("messages").insert(
            messages.slice(-20).map((message) => ({
              conversation_id: data.id,
              role:
                typeof message === "object" &&
                message &&
                "role" in message &&
                message.role === "assistant"
                  ? "assistant"
                  : "user",
              content:
                typeof message === "object" && message && "content" in message
                  ? String(message.content || "")
                  : "",
            })).filter((message) => message.content.trim())
          );
        }
        return jsonOk({ conversation: data, source: "supabase" }, { status: 201 });
      }
    }
  } catch (error) {
    console.error("Conversation create failed", error);
  }

  return jsonOk({ conversation: fallback, source: "local" }, { status: 201 });
}
