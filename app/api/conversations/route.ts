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

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      id, title, mode, created_at, updated_at,
      messages(content, role, created_at)
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Add last message preview
  const withPreview = (conversations || []).map((conv) => {
    const msgs = (conv.messages as { content: string; role: string; created_at: string }[]) || [];
    const lastMsg = msgs.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    return {
      id: conv.id,
      title: conv.title,
      mode: conv.mode,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      lastMessage: lastMsg ? {
        role: lastMsg.role,
        content: lastMsg.content.slice(0, 100),
      } : null,
    };
  });

  return NextResponse.json({ conversations: withPreview });
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, mode = 'doubt' } = body;

  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: user.id, title: title || 'New conversation', mode })
    .select('id, title, mode, created_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversation: data }, { status: 201 });
}
