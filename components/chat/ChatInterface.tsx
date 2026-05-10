'use client';

import { useState, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { toast } from 'sonner';
import { MessageList } from './MessageList';
import { InputBox } from './InputBox';
import { ModeSwitcher } from './ModeSwitcher';
import { ContextPanel } from './ContextPanel';
import type { Mode } from '@/lib/llm/prompts';
import type { Citation } from './CitationChip';
import type { UIMessage } from 'ai';

interface InitialMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
}

interface ChatInterfaceProps {
  conversationId?: string;
  initialMessages?: InitialMessage[];
  initialMode?: Mode;
}

interface ExtendedUIMessage extends UIMessage {
  citations?: Citation[];
}

const modeLabels: Record<Mode, string> = {
  doubt: 'Doubt Solver',
  learning: 'Learning',
  practice: 'Practice',
  revision: 'Revision',
};

function getPlaceholder(mode: Mode): string {
  const placeholders: Record<Mode, string> = {
    doubt: 'Ask your doubt… e.g., "Why does current flow from + to −?"',
    learning: 'What would you like to learn? e.g., "Explain electromagnetic induction"',
    practice: 'Ask for practice questions… e.g., "Give me 5-mark questions on thermodynamics"',
    revision: 'What to revise? e.g., "Quick revision notes for organic chemistry chapter 12"',
  };
  return placeholders[mode];
}

export function ChatInterface({
  conversationId,
  initialMessages = [],
  initialMode,
}: ChatInterfaceProps) {
  const searchParams = useSearchParams();
  const modeFromUrl = (searchParams.get('mode') as Mode) || initialMode || 'doubt';
  const [mode, setMode] = useState<Mode>(modeFromUrl);
  const [convId, setConvId] = useState<string | undefined>(conversationId);
  const [pinnedCitation, setPinnedCitation] = useState<Citation | null>(null);
  const [input, setInput] = useState('');

  const modeRef = useRef(mode);
  const convIdRef = useRef(convId);
  modeRef.current = mode;
  convIdRef.current = convId;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        prepareSendMessagesRequest: ({ id, messages, body }) => ({
          body: {
            ...body,
            id,
            messages,
            mode: modeRef.current,
            conversationId: convIdRef.current,
          },
        }),
      }),
    []
  );

  const { messages, sendMessage, status } = useChat({
    id: convId ?? 'new',
    messages: initialMessages.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant' | 'system',
      parts: [{ type: 'text' as const, text: m.content }],
    })),
    transport,
    onError(err) {
      if (err.message.includes('429')) {
        toast.error('Rate limit reached. You can send 30 messages per hour.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    },
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const messagesWithCitations: ExtendedUIMessage[] = messages.map((m) => {
    const initial = initialMessages.find((im) => im.id === m.id);
    return { ...m, citations: initial?.citations };
  });

  function handleSubmit() {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput('');
    sendMessage({ text });
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Center: chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', background: 'var(--aira-canvas)' }}>
        {/* Top bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          borderBottom: '1px solid var(--aira-line)',
          background: 'var(--aira-paper)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{
              fontFamily: 'Newsreader, Georgia, serif',
              fontSize: 16,
              fontWeight: 500,
              color: 'var(--aira-ink)',
              margin: 0,
            }}>
              {convId ? 'Conversation' : 'New conversation'}
            </h2>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--aira-indigo)',
              background: 'var(--aira-indigo-tint)',
              padding: '2px 8px',
              borderRadius: 999,
              border: '1px solid var(--aira-indigo-soft)',
            }}>
              {modeLabels[mode]}
            </span>
          </div>
          <ModeSwitcher currentMode={mode} onModeChange={setMode} conversationId={convId} />
        </div>

        {/* Messages */}
        <MessageList messages={messagesWithCitations} isLoading={isLoading} />

        {/* Input */}
        <InputBox
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          placeholder={getPlaceholder(mode)}
        />
      </div>

      {/* Right context panel (desktop only) */}
      <ContextPanel pinnedCitation={pinnedCitation} onClose={() => setPinnedCitation(null)} />
    </div>
  );
}
