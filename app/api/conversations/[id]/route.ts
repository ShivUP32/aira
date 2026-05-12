import { canUseLocalFallback, getAuthedSupabase, isUuid, jsonError, jsonOk, productionAuthError } from "@/lib/aira/api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isUuid(id)) {
    try {
      const { supabase, user } = await getAuthedSupabase();
      if (supabase && user) {
        const { data: conversation } = await supabase
          .from("conversations")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (conversation) {
          const { data: messages } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", id)
            .order("created_at", { ascending: true });
          return jsonOk({ conversation, messages: messages || [], source: "supabase" });
        }
      }
    } catch (error) {
      console.error("Conversation detail failed", error);
    }
  }
  if (!canUseLocalFallback()) {
    return isUuid(id)
      ? productionAuthError("Authentication is not configured.")
      : jsonError("Invalid conversation id.", 400);
  }
  return jsonOk({ conversation: { id, title: "Local conversation", mode: "doubt" }, messages: [], source: "local" });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let source = "local";
  if (isUuid(id)) {
    try {
      const { supabase, user } = await getAuthedSupabase();
      if (supabase && user) {
        await supabase.from("conversations").delete().eq("id", id).eq("user_id", user.id);
        source = "supabase";
      }
    } catch (error) {
      console.error("Conversation delete failed", error);
      if (!canUseLocalFallback()) return jsonError("Conversation delete failed.", 503);
    }
  }
  if (!canUseLocalFallback() && source !== "supabase") {
    return isUuid(id)
      ? productionAuthError("Authentication is not configured.")
      : jsonError("Invalid conversation id.", 400);
  }
  return jsonOk({ success: true, source });
}
