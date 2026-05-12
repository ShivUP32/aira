import { createClient } from "@supabase/supabase-js";
import { jsonError, jsonOk, numericDocumentId, requireApiUser } from "@/lib/aira/api";
import { hasSupabaseServiceEnv } from "@/lib/aira/env";
import { citationFromDocument, type RetrievedDocument } from "@/lib/rag/retrieve";

type PracticeBody = {
  answer?: string;
  documentId?: number | string;
};

export async function POST(request: Request) {
  const auth = await requireApiUser(request, { rateLimit: true, route: "practice" });
  if (!auth.ok && (!auth.localFallback || !auth.authConfigMissing)) return auth.response;

  const body = (await request.json().catch(() => ({}))) as PracticeBody;
  const answer = body.answer || "";
  const documentId = numericDocumentId(body.documentId);
  if (!documentId) return jsonError("A valid stored question is required.", 400);

  const supabase = auth.ok
    ? auth.supabase
    : hasSupabaseServiceEnv()
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      : null;
  if (!supabase) return jsonError("Stored questions are not configured.", 503);

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("id,content,metadata")
    .eq("id", documentId)
    .maybeSingle();
  if (docError) {
    console.error("Practice document fetch failed", docError);
    return jsonError("Stored question could not be loaded.", 503);
  }
  if (!doc) return jsonError("Stored question was not found.", 404);

  const citation = citationFromDocument({ ...(doc as RetrievedDocument), similarity: 1 });
  const scheme = citation.scheme || [];
  const maxMarks = citation.marks || Math.max(3, scheme.length);
  const answerText = answer.toLowerCase();
  const matched = scheme.filter((item) => {
    const titleHit = item.title
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3)
      .some((word) => answerText.includes(word));
    const detailHit = item.detail
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 5)
      .slice(0, 4)
      .some((word) => answerText.includes(word));
    return titleHit || detailHit;
  });
  const score = Math.min(maxMarks, Math.max(answer.trim() ? 1 : 0, Math.round((matched.length / Math.max(1, scheme.length)) * maxMarks)));
  const missing = scheme
    .filter((item) => !matched.includes(item))
    .slice(0, 2)
    .map((item) => item.title);

  let source = "local";
  if (auth.ok) {
    try {
      const { error } = await auth.supabase.from("practice_attempts").insert({
        user_id: auth.user.id,
        document_id: documentId,
        user_answer: answer,
        is_correct: score >= maxMarks,
        marks_awarded: score,
        marks_total: maxMarks,
        feedback: JSON.stringify({ score, maxMarks, matched: matched.map((item) => item.title), missing }),
      });
      if (!error) source = "supabase";
    } catch (error) {
      console.error("Practice attempt sync failed", error);
    }
  }

  return jsonOk({
    score,
    maxMarks,
    feedback: missing.length
      ? `Good start. Add these marking points for a higher score: ${missing.join(", ")}.`
      : "Strong answer. You covered the key marking points.",
    source,
  });
}
