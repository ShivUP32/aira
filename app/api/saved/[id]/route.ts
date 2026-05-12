import { canUseLocalFallback, getAuthedSupabase, isUuid, jsonError, jsonOk, productionAuthError } from "@/lib/aira/api";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let source = "local";

  if (isUuid(id)) {
    try {
      const { supabase, user } = await getAuthedSupabase();
      if (supabase && user) {
        await supabase.from("bookmarks").delete().eq("id", id).eq("user_id", user.id);
        source = "supabase";
      }
    } catch (error) {
      console.error("Saved delete failed", error);
      if (!canUseLocalFallback()) return jsonError("Saved delete failed.", 503);
    }
  }

  if (!canUseLocalFallback() && source !== "supabase") {
    return isUuid(id)
      ? productionAuthError("Authentication is not configured.")
      : jsonError("Invalid saved item id.", 400);
  }

  return jsonOk({ success: true, source });
}
