import { cleanLimit, cleanString, jsonOk, readBody } from "@/lib/aira/api";
import { retrieveSeedDocs } from "@/lib/aira/demo-data";
import { hasRagEnv } from "@/lib/aira/env";
import { retrieve } from "@/lib/rag/retrieve";

export async function POST(request: Request) {
  const body = await readBody(request);
  const query = cleanString(body.query);
  const subject = cleanString(body.subject) || undefined;
  const language = cleanString(body.language) || undefined;
  const limit = cleanLimit(body.limit, 5, 10);

  if (!query.trim()) {
    return jsonOk({ results: [], source: "empty" });
  }

  if (hasRagEnv()) {
    try {
      const filter: Record<string, unknown> = {};
      if (subject) filter.subject = subject;
      if (language && language !== "both") filter.language = language;
      const results = await retrieve({ query, filter, limit });
      if (results.length) {
        return jsonOk({ results, source: "supabase" });
      }
    } catch (error) {
      console.error("RAG retrieve failed, falling back to seed docs", error);
    }
  }

  return jsonOk({
    results: retrieveSeedDocs(query, subject, limit).map((doc) => ({
      id: doc.id,
      content: `Question: ${doc.question}\n\nSolution: ${doc.answer}`,
      metadata: {
        subject: doc.subject,
        year: doc.year,
        set: doc.set,
        set_label: doc.set_label,
        section: doc.section,
        q_no: doc.q_no,
        marks: doc.marks,
        chapter: doc.chapter,
        topic: doc.topic,
        language: doc.language,
        solution_source: doc.solution_source,
        citation: doc,
      },
      similarity: doc.similarity,
    })),
    source: "seed",
  });
}
