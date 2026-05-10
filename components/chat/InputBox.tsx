'use client';

import { useRef, KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export function InputBox({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  placeholder = 'Ask Aira anything… (Enter to send, Shift+Enter for newline)',
  maxLength = 4000,
}: InputBoxProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSubmit();
      }
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const textarea = e.target;
    onChange(textarea.value);

    // Auto-resize
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  }

  const charCount = value.length;
  const isNearLimit = charCount > maxLength * 0.8;
  const isAtLimit = charCount >= maxLength;

  return (
    <div className="border-t border-zinc-200 bg-white p-4">
      <div className="max-w-3xl mx-auto">
        <div className="relative flex items-end gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus-within:border-[#534AB7] focus-within:ring-2 focus-within:ring-[#534AB7]/20 transition-all">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            maxLength={maxLength}
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-zinc-800 placeholder:text-zinc-400 disabled:opacity-50 min-h-[24px] max-h-[200px] overflow-y-auto"
            style={{ height: '24px' }}
          />

          <button
            onClick={onSubmit}
            disabled={isLoading || !value.trim()}
            className={cn(
              'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all',
              value.trim() && !isLoading
                ? 'bg-[#534AB7] text-white hover:bg-[#4239A0] active:scale-95 shadow-sm'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        {isNearLimit && (
          <div className="flex justify-end mt-1">
            <span className={cn('text-xs', isAtLimit ? 'text-red-500' : 'text-zinc-400')}>
              {charCount}/{maxLength}
            </span>
          </div>
        )}

        <p className="text-xs text-zinc-400 text-center mt-2">
          Aira can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
