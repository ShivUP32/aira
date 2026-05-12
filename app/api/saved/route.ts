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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const since = url.searchParams.get("since");

  try {
    const { supabase, user } = await getAuthedSupabase();
    if (supabase && user) {
      let query = supabase
        .from("bookmarks")
        .select("id,document_id,message_id,note,created_at,documents(content,metadata)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (since && !Number.isNaN(Number(since))) {
        query = query.gt("created_at", new Date(Number(since)).toISOString());
      }
      const { data, error } = await query;
      if (!error) {
        return jsonOk({
          items: (data || []).map((item) => ({
            id: item.id,
            serverId: item.id,
            subject: savedSubject(item),
            title: savedTitle(item),
            time: "Synced",
            answer: savedAnswer(item),
            source: savedSource(item),
            citationId: item.document_id ? String(item.document_id) : undefined,
            synced: true,
            ts: new Date(item.created_at).getTime(),
          })),
          deletedIds: [],
          source: "supabase",
        });
      }
    }
  } catch (error) {
    console.error("Saved sync fetch failed", error);
  }

  if (!canUseLocalFallback()) return productionAuthError("Authentication is not configured.");
  return jsonOk({ items: [], deletedIds: [], source: "local" });
}

function savedDocument(item: { documents?: unknown }) {
  const docs = item.documents;
  if (Array.isArray(docs)) return docs[0] as { content?: string; metadata?: Record<string, unknown> } | undefined;
  return docs as { content?: string; metadata?: Record<string, unknown> } | undefined;
}

function savedTitle(item: { document_id?: number | null; documents?: unknown }) {
  const doc = savedDocument(item);
  const metadata = doc?.metadata || {};
  return String(metadata.question || metadata.topic || metadata.chapter || `Saved source ${item.document_id || ""}`).trim();
}

function savedAnswer(item: { documents?: unknown }) {
  const doc = savedDocument(item);
  return String(doc?.metadata?.answer || doc?.content || "");
}

function savedSubject(item: { documents?: unknown }) {
  const doc = savedDocument(item);
  return String(doc?.metadata?.subject || "Physics");
}

function savedSource(item: { document_id?: number | null; documents?: unknown }) {
  const doc = savedDocument(item);
  const metadata = doc?.metadata || {};
  return [
    metadata.year && `CBSE ${metadata.year}`,
    metadata.subject,
    metadata.set_label || metadata.set,
    metadata.q_no && `Q${metadata.q_no}`,
    metadata.marks && `${metadata.marks}m`,
  ].filter(Boolean).join(" · ") || (item.document_id ? `Document ${item.document_id}` : undefined);
}

export async function POST(request: Request) {
  const body = await readBody(request);
  const documentId = numericDocumentId(body.document_id);
  const messageId = isUuid(body.message_id) ? String(body.message_id) : null;
  const note = cleanString(body.note) || null;
  const localId = cleanString(body.id) || `local-${Date.now()}`;
  const fallback = {
    id: localId,
    ...body,
    synced: false,
    ts: Date.now(),
  };

  if (documentId || messageId) {
    try {
      const { supabase, user } = await getAuthedSupabase();
      if (supabase && user) {
        const { data, error } = await supabase
          .from("bookmarks")
          .insert({ user_id: user.id, document_id: documentId, message_id: messageId, note })
          .select("id,document_id,message_id,note,created_at")
          .single();
        if (!error && data) {
          return jsonOk({
            item: {
              id: localId,
              serverId: data.id,
              subject: cleanString(body.subject, "Physics"),
              title: cleanString(body.title, `Saved source ${documentId || ""}`),
              time: "Synced",
              answer: cleanString(body.answer),
              formula: cleanString(body.formula) || undefined,
              source: cleanString(body.source, savedSource({ document_id: documentId }) || ""),
              citationId: data.document_id ? String(data.document_id) : cleanString(body.citationId) || undefined,
              synced: true,
              ts: new Date(data.created_at).getTime(),
            },
            source: "supabase",
          }, { status: 201 });
        }
      }
    } catch (error) {
      console.error("Saved sync create failed", error);
    }
  }

  if (!canUseLocalFallback()) return productionAuthError("Saved item persistence is not configured.");
  return jsonOk({ item: fallback, source: "local" }, { status: 201 });
}
