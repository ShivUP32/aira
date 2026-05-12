import { createClient } from '@supabase/supabase-js';
import { emptyCitation, type AiraCitation } from '@/lib/aira/citations';
import { hasRagEnv } from '@/lib/aira/env';
import { embedQuery } from './embed';

export interface RetrievedDocument {
  id: number;
  content: string;
  metadata: {
    subject?: string;
    chapter?: string;
    language?: string;
    set?: string;
    set_label?: string;
    q_no?: number | string;
    question_number?: number | string;
    marks?: number;
    year?: number | string;
    type?: string;
    [key: string]: unknown;
  };
  similarity: number;
}

export interface RetrieveOptions {
  query: string;
  filter?: Record<string, unknown>;
  limit?: number;
}

export async function retrieve(options: RetrieveOptions): Promise<RetrievedDocument[]> {
  const { query, filter = {}, limit = 5 } = options;
  if (!query.trim() || !hasRagEnv()) return [];

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const embedding = await embedQuery(query);

  const { data, error } = await supabaseAdmin.rpc('match_documents', {
    query_embedding: embedding,
    match_count: limit,
    filter,
  });

  if (error) {
    console.error('Supabase RPC error:', error);
    throw new Error(`Failed to retrieve documents: ${error.message}`);
  }

  return (data as RetrievedDocument[]) || [];
}

export function formatContextBlock(docs: RetrievedDocument[]): string {
  if (!docs.length) return '';

  return docs
    .map((doc, i) => {
      const meta = doc.metadata;
      const source = [
        meta.year && `CBSE ${meta.year}`,
        meta.subject && meta.subject.charAt(0).toUpperCase() + meta.subject.slice(1),
        meta.set && `Set-${meta.set}`,
        (meta.q_no || meta.question_number) && `Q${meta.q_no || meta.question_number}`,
        meta.marks && `(${meta.marks} marks)`,
      ]
        .filter(Boolean)
        .join(' ');

      return `[${i + 1}] ${source ? `Source: ${source}\n` : ''}${doc.content}`;
    })
    .join('\n\n---\n\n');
}

export function citationFromDocument(
  doc: RetrievedDocument,
  _query = "",
  subject?: string,
  index = 0
): AiraCitation & { similarity?: number } {
  void _query;
  const citation = doc.metadata.citation;
  if (isCitation(citation)) {
    return { ...citation, id: String(citation.id || doc.id), similarity: doc.similarity };
  }

  const metadata = doc.metadata;
  const question = metadataText(metadata.question, metadata.prompt, metadata.question_text, metadata.q_text);
  const answer = metadataText(metadata.answer, metadata.solution, metadata.solution_text, metadata.explanation);
  const scheme = schemeFromMetadata(metadata.scheme || metadata.marking_scheme || metadata.marks_scheme);
  const label = metadataText(metadata.label, metadata.source) || sourceLabel(metadata, doc.id);

  return {
    ...emptyCitation,
    id: String(doc.id),
    label,
    subject: String(metadata.subject || subject || "unknown"),
    year: numericMeta(metadata.year, new Date().getFullYear()),
    set: String(metadata.set || metadata.paper_set || "Source"),
    set_label: String(metadata.set_label || metadata.setLabel || metadata.set || "Source"),
    section: String(metadata.section || "A"),
    q_no: (metadata.q_no || metadata.question_number || metadata.qNo || "") as number | string,
    marks: numericMeta(metadata.marks, Math.max(1, scheme.length || 3)),
    chapter: String(metadata.chapter || "Retrieved source"),
    topic: String(metadata.topic || metadata.chapter || "Retrieved source"),
    language: metadata.language === "hi" ? "hi" : "en",
    solution_source: metadata.solution_source === "marking-scheme" ? "marking-scheme" : "llm-generated",
    question: question || excerpt(doc.content),
    answer: answer || excerpt(doc.content),
    scheme: scheme.length ? scheme : [{ title: "Retrieved source", detail: answer || excerpt(doc.content), marks: "1m" }],
    similarity: doc.similarity || 0.8 - index * 0.05,
  };
}

function isCitation(value: unknown): value is AiraCitation {
  return Boolean(
    value &&
      typeof value === "object" &&
      "question" in value &&
      "answer" in value &&
      "scheme" in value
  );
}

function metadataText(...values: unknown[]) {
  const value = values.find((item) => typeof item === "string" && item.trim());
  return typeof value === "string" ? value.trim() : "";
}

function numericMeta(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function schemeFromMetadata(value: unknown): AiraCitation["scheme"] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (typeof item === "string") return { title: `Point ${index + 1}`, detail: item, marks: "1m" };
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const detail = metadataText(row.detail, row.text, row.point, row.answer);
      if (!detail) return null;
      return {
        title: metadataText(row.title, row.label) || `Point ${index + 1}`,
        detail,
        marks: metadataText(row.marks, row.mark) || "1m",
      };
    })
    .filter((item): item is AiraCitation["scheme"][number] => Boolean(item));
}

function sourceLabel(metadata: RetrievedDocument["metadata"], id: number) {
  return [
    metadata.year && `CBSE ${metadata.year}`,
    metadata.subject,
    metadata.set_label || metadata.set,
    (metadata.q_no || metadata.question_number) && `Q${metadata.q_no || metadata.question_number}`,
    metadata.marks && `${metadata.marks}m`,
  ].filter(Boolean).join(" · ") || `Document ${id}`;
}

function excerpt(content: string) {
  return content.length > 360 ? `${content.slice(0, 357)}...` : content;
}
