'use client';

import { useEffect, useRef } from 'react';
import { Message } from './Message';
import type { Citation } from './CitationChip';
import type { UIMessage } from 'ai';

interface ExtendedMessage extends UIMessage {
  citations?: Citation[];
}

interface MessageListProps {
  messages: ExtendedMessage[];
  isLoading?: boolean;
  streamingMessageId?: string;
}

export function MessageList({ messages, isLoading = false, streamingMessageId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const visibleMessages = messages.filter((m) => m.role !== 'system');

  if (visibleMessages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12">
        <div className="w-16 h-16 rounded-2xl bg-[#EEEDFB] flex items-center justify-center mb-4">
          <span className="text-3xl">🎓</span>
        </div>
        <h3 className="text-lg font-semibold text-zinc-800 mb-2">Ask Aira anything!</h3>
        <p className="text-sm text-zinc-500 max-w-sm">
          I can help you solve doubts, learn concepts, practice questions, or revise topics from your CBSE curriculum.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2 max-w-sm w-full">
          {[
            'Explain Newton\'s laws of motion',
            'Solve this integral: ∫x²dx',
            'What is photosynthesis?',
            'Give me practice questions on electrochemistry',
          ].map((suggestion) => (
            <button
              key={suggestion}
              className="text-left px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-600 hover:border-[#534AB7] hover:text-[#534AB7] hover:bg-[#EEEDFB] transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {visibleMessages.map((message) => (
          <Message
            key={message.id}
            role={message.role as 'user' | 'assistant'}
            content={message.content}
            citations={message.citations}
            isStreaming={streamingMessageId === message.id}
          />
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#534AB7] flex items-center justify-center shadow-sm flex-shrink-0">
              <span className="text-white text-xs font-bold">A</span>
            </div>
            <div className="bg-white border border-zinc-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#534AB7] animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-[#534AB7] animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-[#534AB7] animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
