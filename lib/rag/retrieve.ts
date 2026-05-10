import { createClient } from '@supabase/supabase-js';
import { embedQuery } from './embed';

export interface RetrievedDocument {
  id: number;
  content: string;
  metadata: {
    subject?: string;
    chapter?: string;
    language?: string;
    set?: string;
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

// Use service role for RAG to bypass RLS on documents
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function retrieve(options: RetrieveOptions): Promise<RetrievedDocument[]> {
  const { query, filter = {}, limit = 5 } = options;

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
        meta.question_number && `Q${meta.question_number}`,
        meta.marks && `(${meta.marks} marks)`,
      ]
        .filter(Boolean)
        .join(' ');

      return `[${i + 1}] ${source ? `Source: ${source}\n` : ''}${doc.content}`;
    })
    .join('\n\n---\n\n');
}
