import { cleanLimit, cleanString, jsonError, jsonOk, readBody, requireApiUser } from "@/lib/aira/api";
import { hasRagEnv, isProduction } from "@/lib/aira/env";
import { citationFromDocument, retrieve } from "@/lib/rag/retrieve";

export async function POST(request: Request) {
  const auth = await requireApiUser(request, { rateLimit: true, route: "rag:retrieve" });
  if (!auth.ok && (!auth.localFallback || !auth.authConfigMissing)) return auth.response;

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
        return jsonOk({
          results: results.map((doc, index) => ({
            ...doc,
            metadata: {
              ...doc.metadata,
              citation: citationFromDocument(doc, query, subject, index),
            },
          })),
          source: "supabase",
        });
      }
      return jsonOk({ results: [], source: "supabase" });
    } catch (error) {
      console.error("RAG retrieve failed", error);
      return jsonError("Retrieval is unavailable.", 503);
    }
  } else if (isProduction()) {
    return jsonError("Retrieval is not configured.", 503);
  }

  return jsonOk({ results: [], source: "empty" });
}
