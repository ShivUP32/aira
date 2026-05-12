import { createClient } from "@supabase/supabase-js";
import { cleanLimit, cleanString, jsonError, jsonOk, requireApiUser } from "@/lib/aira/api";
import { hasSupabaseServiceEnv } from "@/lib/aira/env";
import { citationFromDocument, type RetrievedDocument } from "@/lib/rag/retrieve";

export async function GET(request: Request) {
  const auth = await requireApiUser(request, { rateLimit: true, route: "practice:question" });
  if (!auth.ok && (!auth.localFallback || !auth.authConfigMissing)) return auth.response;

  const url = new URL(request.url);
  const subject = cleanString(url.searchParams.get("subject")) || undefined;
  const chapter = cleanString(url.searchParams.get("chapter")) || undefined;
  const language = cleanString(url.searchParams.get("language")) || "en";
  const marks = cleanString(url.searchParams.get("marks")) || undefined;
  const limit = cleanLimit(url.searchParams.get("limit"), 20, 50);

  const supabase = auth.ok
    ? auth.supabase
    : hasSupabaseServiceEnv()
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      : null;
  if (!supabase) return jsonError("Stored questions are not configured.", 503);

  let query = supabase.from("documents").select("id,content,metadata").limit(limit);
  const filter: Record<string, unknown> = {};
  if (subject) filter.subject = subject;
  if (language) filter.language = language;
  if (chapter) filter.chapter = chapter;
  if (marks) filter.marks = Number(marks);
  if (Object.keys(filter).length) query = query.contains("metadata", filter);

  const { data, error } = await query;
  if (error) {
    console.error("Practice question fetch failed", error);
    return jsonError("Stored questions could not be loaded.", 503);
  }

  const docs = ((data || []) as RetrievedDocument[]).filter((doc) => {
    const metadata = doc.metadata || {};
    return Boolean(metadata.question || metadata.prompt || metadata.question_text || doc.content);
  });
  if (!docs.length) return jsonOk({ citation: null, documentId: null, source: "empty" });

  const doc = docs[Math.floor(Math.random() * docs.length)];
  const citation = citationFromDocument({ ...doc, similarity: 1 });
  return jsonOk({ citation, documentId: Number(doc.id), source: "supabase" });
}
