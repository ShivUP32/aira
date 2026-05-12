import { canUseLocalFallback, cleanString, getAuthedSupabase, jsonOk, productionAuthError, readBody } from "@/lib/aira/api";
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
        .select("id,title,subject,mode,created_at,updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });
      if (!error) return jsonOk({ conversations: data || [], source: "supabase" });
    }
  } catch (error) {
    console.error("Conversation fetch failed", error);
  }

  if (!canUseLocalFallback()) return productionAuthError("Authentication is not configured.");
  return jsonOk({ conversations: [], source: "local" });
}

export async function POST(request: Request) {
  const body = await readBody(request);
  const now = new Date().toISOString();
  const fallback = {
    id: cleanString(body.id) || `local-${Date.now()}`,
    title: cleanString(body.title, "New conversation").slice(0, 120),
    mode: cleanMode(body.mode),
    subject: cleanString(body.subject) || null,
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
          .select("id,title,subject,mode,created_at,updated_at")
          .eq("id", existingId)
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) return jsonOk({ conversation: data, source: "supabase" });
      }

      const recentTitle = fallback.title;
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const recentQuery = supabase
        .from("conversations")
        .select("id,title,subject,mode,created_at,updated_at")
        .eq("user_id", user.id)
        .eq("title", recentTitle)
        .eq("mode", fallback.mode)
        .gte("updated_at", fiveMinutesAgo)
        .order("updated_at", { ascending: false })
        .limit(1);
      const { data: recent } = await (fallback.subject
        ? recentQuery.eq("subject", fallback.subject)
        : recentQuery.is("subject", null))
        .maybeSingle();
      if (recent) return jsonOk({ conversation: recent, source: "supabase" });

      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title: fallback.title, subject: fallback.subject, mode: fallback.mode })
        .select("id,title,subject,mode,created_at,updated_at")
        .single();
      if (!error && data) {
        return jsonOk({ conversation: data, source: "supabase" }, { status: 201 });
      }
    }
  } catch (error) {
    console.error("Conversation create failed", error);
  }

  if (!canUseLocalFallback()) return productionAuthError("Conversation persistence is not configured.");
  return jsonOk({ conversation: fallback, source: "local" }, { status: 201 });
}
