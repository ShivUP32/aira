import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

export async function GET() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: bookmarks, error } = await supabase
    .from('bookmarks')
    .select(`
      id, created_at,
      message_id,
      messages(id, content, role, citations, conversation_id,
        conversations(id, title, mode))
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookmarks: bookmarks || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { messageId, documentId } = body;

  if (!messageId && !documentId) {
    return NextResponse.json({ error: 'messageId or documentId required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('bookmarks')
    .insert({
      user_id: user.id,
      message_id: messageId || null,
      document_id: documentId || null,
    })
    .select('id, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already bookmarked' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ bookmark: data }, { status: 201 });
}
