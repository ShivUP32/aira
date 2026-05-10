import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { streamText } from 'ai';
import { openrouter, MODELS } from '@/lib/llm/openrouter';
import { getSystemPrompt } from '@/lib/llm/prompts';
import { retrieve, formatContextBlock } from '@/lib/rag/retrieve';
import { checkRateLimit } from '@/lib/ratelimit';
import type { Mode } from '@/lib/llm/prompts';
import type { CoreMessage } from 'ai';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const { success, remaining, reset } = await checkRateLimit(user.id);
    if (!success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. You can send 30 messages per hour.',
          reset: new Date(reset).toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(reset),
          },
        }
      );
    }

    const body = await request.json();
    const { messages, mode = 'doubt', conversationId } = body as {
      messages: CoreMessage[];
      mode: Mode;
      conversationId?: string;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    // Get the last user message for RAG
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const userQuery = typeof lastUserMessage?.content === 'string'
      ? lastUserMessage.content
      : '';

    // Retrieve context for doubt and practice modes
    let contextBlock = '';
    let retrievedDocs: Awaited<ReturnType<typeof retrieve>> = [];

    if (['doubt', 'practice', 'revision'].includes(mode) && userQuery) {
      try {
        retrievedDocs = await retrieve({
          query: userQuery,
          limit: 5,
        });
        contextBlock = formatContextBlock(retrievedDocs);
      } catch (e) {
        console.error('RAG retrieval error:', e);
        // Continue without context
      }
    }

    // Build system prompt
    const systemPrompt = getSystemPrompt(mode, contextBlock);

    // Get or create conversation
    let activeConvId = conversationId;

    if (!activeConvId) {
      // Create new conversation
      const title = userQuery.slice(0, 60) || 'New conversation';
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({ user_id: user.id, title, mode })
        .select('id')
        .single();

      if (convError || !newConv) {
        console.error('Failed to create conversation:', convError);
      } else {
        activeConvId = newConv.id;
      }
    }

    // Save user message to DB
    if (activeConvId && userQuery) {
      await supabase.from('messages').insert({
        conversation_id: activeConvId,
        role: 'user',
        content: userQuery,
      });

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeConvId);
    }

    const citations = retrievedDocs.map((doc) => ({
      id: doc.id,
      content: doc.content,
      metadata: doc.metadata,
      similarity: doc.similarity,
    }));

    // Stream response
    const result = streamText({
      model: openrouter(MODELS.primary),
      system: systemPrompt,
      messages,
      maxTokens: 2048,
      temperature: 0.7,
      onFinish: async ({ text, usage }) => {
        if (activeConvId) {
          await supabase.from('messages').insert({
            conversation_id: activeConvId,
            role: 'assistant',
            content: text,
            citations: citations,
            tokens_used: (usage?.promptTokens || 0) + (usage?.completionTokens || 0),
            model_used: MODELS.primary,
          });
        }
      },
    });

    const response = result.toDataStreamResponse();

    if (activeConvId) {
      const headers = new Headers(response.headers);
      headers.set('x-conversation-id', activeConvId);
      headers.set('x-rate-limit-remaining', String(remaining));

      return new Response(response.body, {
        status: response.status,
        headers,
      });
    }

    return response;
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
