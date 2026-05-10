import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { retrieve } from '@/lib/rag/retrieve';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { query, filter = {}, limit = 5 } = body;

  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  try {
    const results = await retrieve({ query, filter, limit });
    return NextResponse.json({ results });
  } catch (error) {
    console.error('RAG retrieve error:', error);
    return NextResponse.json({ error: 'Failed to retrieve documents' }, { status: 500 });
  }
}
