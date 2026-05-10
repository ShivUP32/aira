import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ChatInterface } from '@/components/chat/ChatInterface';
import type { Mode } from '@/lib/llm/prompts';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: conv } = await supabase
    .from('conversations')
    .select('title, mode')
    .eq('id', id)
    .single();

  return {
    title: conv?.title || 'Chat',
  };
}

export default async function ChatConversationPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, title, mode')
    .eq('id', id)
    .single();

  if (!conversation) {
    notFound();
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('id, role, content, citations, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  const initialMessages = (messages || []).map((m) => ({
    id: m.id,
    role: m.role as 'user' | 'assistant' | 'system',
    content: m.content,
    citations: m.citations || [],
  }));

  return (
    <ChatInterface
      conversationId={id}
      initialMessages={initialMessages}
      initialMode={conversation.mode as Mode}
    />
  );
}
