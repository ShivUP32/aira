import {
  canUseLocalFallback,
  cleanString,
  getAuthedSupabase,
  isUuid,
  jsonOk,
  numericDocumentId,
  productionAuthError,
  readBody,
} from "@/lib/aira/api";

export async function GET() {
  try {
    const { supabase, user } = await getAuthedSupabase();
    if (supabase && user) {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("id,document_id,message_id,note,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!error) return jsonOk({ bookmarks: data || [], source: "supabase" });
    }
  } catch (error) {
    console.error("Bookmark fetch failed", error);
  }

  if (!canUseLocalFallback()) return productionAuthError("Authentication is not configured.");
  return jsonOk({ bookmarks: [], source: "local" });
}

export async function POST(request: Request) {
  const body = await readBody(request);
  const documentId = numericDocumentId(body.document_id);
  const messageId = isUuid(body.message_id) ? String(body.message_id) : null;
  const note = cleanString(body.note) || null;
  const fallback = {
    id: cleanString(body.id) || `local-${Date.now()}`,
    ...body,
    synced: false,
    created_at: new Date().toISOString(),
  };

  if (documentId || messageId) {
    try {
      const { supabase, user } = await getAuthedSupabase();
      if (supabase && user) {
        const { data, error } = await supabase
          .from("bookmarks")
          .insert({
            user_id: user.id,
            document_id: documentId,
            message_id: messageId,
            note,
          })
          .select()
          .single();
        if (!error && data) return jsonOk({ bookmark: data, source: "supabase" }, { status: 201 });
      }
    } catch (error) {
      console.error("Bookmark create failed", error);
    }
  }

  if (!canUseLocalFallback()) return productionAuthError("Bookmark persistence is not configured.");
  return jsonOk({ bookmark: fallback, source: "local" }, { status: 201 });
}
