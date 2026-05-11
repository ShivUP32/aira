import { hasRagEnv, hasSupabaseServiceEnv } from "@/lib/aira/env";
import { jsonOk } from "@/lib/aira/api";

export async function GET() {
  const ready = hasRagEnv();
  return jsonOk({
    status: ready ? "ready" : "fallback",
    supabase: hasSupabaseServiceEnv(),
    embeddings: Boolean(process.env.HF_API_TOKEN),
    documents: 0,
    source: ready ? "supabase" : "seed",
    message: ready
      ? "RAG environment is configured; retrieval will use Supabase pgvector."
      : "RAG environment is incomplete; retrieval will fall back to seeded local docs.",
  });
}
