import type { AiraCitation } from "@/lib/aira/demo-data";
import { getAuthedSupabase, jsonOk, numericDocumentId } from "@/lib/aira/api";

type PracticeBody = {
  answer?: string;
  citation?: AiraCitation;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as PracticeBody;
  const answer = body.answer || "";
  const citation = body.citation;
  const scheme = citation?.scheme || [];
  const maxMarks = citation?.marks || Math.max(3, scheme.length);
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
  const documentId = numericDocumentId(citation?.id);
  if (documentId) {
    try {
      const { supabase, user } = await getAuthedSupabase();
      if (supabase && user) {
        const { error } = await supabase.from("practice_attempts").insert({
          user_id: user.id,
          document_id: documentId,
          user_answer: answer,
          is_correct: score >= maxMarks,
          feedback: JSON.stringify({ score, maxMarks, matched: matched.map((item) => item.title), missing }),
        });
        if (!error) source = "supabase";
      }
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
