import { getAuthedSupabase, isUuid, jsonOk } from "@/lib/aira/api";

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
      console.error("Bookmark delete failed", error);
    }
  }
  return jsonOk({ success: true, source });
}
