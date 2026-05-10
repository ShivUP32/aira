'use client';

import { useEffect, useRef } from 'react';
import { Message } from './Message';
import { AiraLogo } from '@/components/brand/AiraLogo';
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

const STARTER_SUGGESTIONS = [
  "Explain Newton's laws of motion",
  'Solve this integral: ∫x²dx',
  'Practice: 5-mark electrochemistry Q',
  'Revise organic chemistry chapter 12',
];

export function MessageList({ messages, isLoading = false, streamingMessageId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const visibleMessages = messages.filter((m) => m.role !== 'system');

  if (visibleMessages.length === 0 && !isLoading) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: 'var(--aira-indigo-tint)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          border: '1px solid var(--aira-indigo-soft)',
        }}>
          <AiraLogo size={34} />
        </div>
        <h3 style={{
          fontFamily: 'Newsreader, Georgia, serif',
          fontSize: 24,
          fontWeight: 400,
          color: 'var(--aira-ink)',
          marginBottom: 8,
        }}>
          Ask Aira anything
        </h3>
        <p style={{ fontSize: 14, color: 'var(--aira-ink-3)', maxWidth: 380, lineHeight: 1.6, marginBottom: 28 }}>
          I cite every answer from real CBSE board papers — so you know exactly what earns marks.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 440, width: '100%' }}>
          {STARTER_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              style={{
                textAlign: 'left',
                padding: '10px 14px',
                background: 'var(--aira-paper)',
                border: '1px solid var(--aira-line)',
                borderRadius: 12,
                fontSize: 13,
                color: 'var(--aira-ink-2)',
                cursor: 'pointer',
                lineHeight: 1.4,
                transition: 'border-color 0.1s, color 0.1s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--aira-indigo)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--aira-indigo)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--aira-line)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--aira-ink-2)';
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {visibleMessages.map((message) => {
          const text = message.parts
            .filter((p) => p.type === 'text')
            .map((p) => (p as { type: 'text'; text: string }).text)
            .join('');
          return (
            <Message
              key={message.id}
              role={message.role as 'user' | 'assistant'}
              content={text}
              citations={message.citations}
              isStreaming={streamingMessageId === message.id}
            />
          );
        })}

        {isLoading && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'var(--aira-indigo-tint)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid var(--aira-indigo-soft)',
            }}>
              <AiraLogo size={20} />
            </div>
            <div style={{ paddingTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="aira-loading-dot" style={{ animationDelay: '0ms' }} />
                <span className="aira-loading-dot" style={{ animationDelay: '200ms', opacity: 0.7 }} />
                <span className="aira-loading-dot" style={{ animationDelay: '400ms', opacity: 0.4 }} />
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--aira-ink-4)',
                  marginLeft: 4,
                }}>
                  Searching past papers…
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
