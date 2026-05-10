'use client';

import { useRef, KeyboardEvent } from 'react';
import { ArrowUp, Loader2, Image as ImageIcon, Mic } from 'lucide-react';

interface InputBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  placeholder?: string;
  maxLength?: number;
}

const SUGGESTION_CHIPS = [
  'Explain Gauss\'s Law',
  'Practice: Electrochemistry 5m Q',
  'Revise Organic Chemistry',
  'Carbon and its compounds',
];

export function InputBox({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  placeholder = 'Ask Aira anything…',
  maxLength = 4000,
}: InputBoxProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!isLoading && value.trim()) onSubmit();
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) onSubmit();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const textarea = e.target;
    onChange(textarea.value);
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  }

  const canSend = value.trim().length > 0 && !isLoading;

  return (
    <div style={{
      borderTop: '1px solid var(--aira-line)',
      background: 'var(--aira-canvas)',
      padding: '12px 16px 16px',
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Suggestion chips */}
        {value.length === 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => onChange(chip)}
                style={{
                  padding: '4px 12px',
                  border: '1px solid var(--aira-line)',
                  borderRadius: 999,
                  background: 'var(--aira-paper)',
                  fontSize: 12,
                  color: 'var(--aira-ink-3)',
                  cursor: 'pointer',
                  transition: 'border-color 0.1s, color 0.1s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--aira-indigo)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--aira-indigo)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--aira-line)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--aira-ink-3)';
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Input container */}
        <div style={{
          background: 'var(--aira-paper)',
          border: '1px solid var(--aira-line-strong)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 1px 0 rgba(46,40,128,0.04), 0 1px 2px rgba(26,24,39,0.04)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onFocusCapture={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--aira-indigo)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 3px rgba(76,68,184,0.1)';
        }}
        onBlurCapture={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--aira-line-strong)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 0 rgba(46,40,128,0.04), 0 1px 2px rgba(26,24,39,0.04)';
        }}
        >
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            maxLength={maxLength}
            rows={1}
            style={{
              width: '100%',
              padding: '14px 16px 4px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: 14.5,
              color: 'var(--aira-ink)',
              fontFamily: 'inherit',
              lineHeight: 1.55,
              minHeight: 28,
              maxHeight: 200,
              overflowY: 'auto',
              display: 'block',
            }}
          />

          {/* Footer bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px 10px 8px',
            gap: 6,
          }}>
            {/* Icon buttons */}
            <button
              style={{
                padding: 6,
                borderRadius: 7,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--aira-ink-4)',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Attach image"
            >
              <ImageIcon style={{ width: 15, height: 15 }} />
            </button>
            <button
              style={{
                padding: 6,
                borderRadius: 7,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--aira-ink-4)',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Voice input"
            >
              <Mic style={{ width: 15, height: 15 }} />
            </button>

            {/* Hint */}
            <span style={{
              flex: 1,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              color: 'var(--aira-ink-4)',
              textAlign: 'center',
            }}>
              ⌘↩ to send · / for commands
            </span>

            {/* Language toggle */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'var(--aira-paper-2)',
              borderRadius: 999,
              padding: '2px 3px',
              marginRight: 4,
            }}>
              <button style={{
                padding: '2px 8px',
                borderRadius: 999,
                border: 'none',
                background: 'var(--aira-ink)',
                color: 'var(--aira-paper)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                cursor: 'pointer',
              }}>
                EN
              </button>
            </div>

            {/* Send button */}
            <button
              onClick={onSubmit}
              disabled={!canSend}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: 'none',
                background: canSend ? 'var(--aira-indigo)' : 'var(--aira-paper-3)',
                color: canSend ? '#fff' : 'var(--aira-ink-4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: canSend ? 'pointer' : 'not-allowed',
                transition: 'background 0.15s',
                flexShrink: 0,
              }}
              title="Send (Enter)"
            >
              {isLoading ? (
                <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} />
              ) : (
                <ArrowUp style={{ width: 15, height: 15 }} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
