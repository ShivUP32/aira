'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { toast } from 'sonner';
import { MessageList } from './MessageList';
import { InputBox } from './InputBox';
import { ModeSwitcher } from './ModeSwitcher';
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

export function ChatInterface({
  conversationId,
  initialMessages = [],
  initialMode,
}: ChatInterfaceProps) {
  const searchParams = useSearchParams();
  const modeFromUrl = (searchParams.get('mode') as Mode) || initialMode || 'doubt';
  const [mode, setMode] = useState<Mode>(modeFromUrl);
  const [convId, setConvId] = useState<string | undefined>(conversationId);

  const {
    messages,
    input,
    setInput,
    append,
    isLoading,
    error,
  } = useChat({
    api: '/api/chat',
    id: convId,
    initialMessages: initialMessages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
    })),
    body: {
      mode,
      conversationId: convId,
    },
    onResponse(response) {
      const newConvId = response.headers.get('x-conversation-id');
      if (newConvId && !convId) {
        setConvId(newConvId);
        window.history.replaceState(null, '', `/chat/${newConvId}`);
      }
    },
    onError(err) {
      if (err.message.includes('429')) {
        toast.error('Rate limit reached. You can send 30 messages per hour.');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    },
  });

  // Merge citations from initial messages with streaming messages
  const messagesWithCitations: ExtendedUIMessage[] = messages.map((m) => {
    const initial = initialMessages.find((im) => im.id === m.id);
    return {
      ...m,
      citations: initial?.citations,
    };
  });

  function handleSubmit() {
    if (!input.trim() || isLoading) return;

    append({
      role: 'user',
      content: input,
    });
    setInput('');
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-zinc-700">
            {convId ? 'Conversation' : 'New Chat'}
          </h2>
        </div>
        <ModeSwitcher
          currentMode={mode}
          onModeChange={setMode}
          conversationId={convId}
        />
      </div>

      {/* Messages */}
      <MessageList
        messages={messagesWithCitations}
        isLoading={isLoading}
      />

      {/* Input */}
      <InputBox
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        placeholder={getPlaceholder(mode)}
      />
    </div>
  );
}

function getPlaceholder(mode: Mode): string {
  const placeholders: Record<Mode, string> = {
    doubt: 'Ask your doubt… e.g., "Why does current flow from + to −?"',
    learning: 'What would you like to learn? e.g., "Explain electromagnetic induction"',
    practice: 'Ask for practice questions… e.g., "Give me 5-mark questions on thermodynamics"',
    revision: 'What to revise? e.g., "Quick revision notes for organic chemistry chapter 12"',
  };
  return placeholders[mode];
}
