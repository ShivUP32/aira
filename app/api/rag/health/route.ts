import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

export async function GET() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Total count
    const { count: total } = await supabaseAdmin
      .from('documents')
      .select('*', { count: 'exact', head: true });

    // Group by subject
    const { data: bySubject } = await supabaseAdmin
      .from('documents')
      .select('metadata->>subject as subject')
      .not('metadata->>subject', 'is', null);

    // Group by language
    const { data: byLanguage } = await supabaseAdmin
      .from('documents')
      .select('metadata->>language as language')
      .not('metadata->>language', 'is', null);

    const subjectCounts = (bySubject || []).reduce<Record<string, number>>((acc, row) => {
      const s = (row as unknown as { subject: string }).subject;
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    const languageCounts = (byLanguage || []).reduce<Record<string, number>>((acc, row) => {
      const l = (row as unknown as { language: string }).language;
      acc[l] = (acc[l] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      status: 'ok',
      total: total || 0,
      bySubject: subjectCounts,
      byLanguage: languageCounts,
    });
  } catch (error) {
    console.error('RAG health error:', error);
    return NextResponse.json({ status: 'error', error: String(error) }, { status: 500 });
  }
}
