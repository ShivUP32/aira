import { hasRagEnv, hasSupabaseServiceEnv } from "@/lib/aira/env";
import { jsonOk } from "@/lib/aira/api";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const configured = hasRagEnv();
  let documents = 0;
  let countSource = "unavailable";
  let errorMessage = "";

  if (hasSupabaseServiceEnv()) {
    try {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { count, error } = await supabaseAdmin
        .from("documents")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      documents = count || 0;
      countSource = "supabase";
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Supabase document count failed";
      countSource = "error";
      console.error("RAG health document count failed", error);
    }
  }

  const ready = configured && documents > 0;
  const fallbackReason = !configured
    ? "RAG environment is incomplete."
    : documents === 0
      ? "RAG is configured, but no Supabase documents are available."
      : "";

  return jsonOk({
    status: ready ? "ready" : "unavailable",
    supabase: hasSupabaseServiceEnv(),
    embeddings: Boolean(process.env.HF_API_TOKEN),
    documents,
    documentCountSource: countSource,
    retrievalSource: ready ? "supabase" : "none",
    fallback: false,
    fallbackReason,
    source: ready ? "supabase" : "none",
    message: ready
      ? `RAG is configured with ${documents} Supabase document${documents === 1 ? "" : "s"}; retrieval will use Supabase pgvector.`
      : `${fallbackReason} Retrieval is unavailable until production RAG is configured.`,
    ...(errorMessage ? { error: errorMessage } : {}),
  });
}
