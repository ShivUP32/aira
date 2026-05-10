'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { MODES } from '@/lib/llm/prompts';
import type { Mode } from '@/lib/llm/prompts';
import { cn } from '@/lib/utils';

interface ModeSwitcherProps {
  currentMode: Mode;
  onModeChange?: (mode: Mode) => void;
  conversationId?: string;
}

export function ModeSwitcher({ currentMode, onModeChange }: ModeSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleModeChange(mode: Mode) {
    onModeChange?.(mode);

    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', mode);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg">
      {MODES.map((m) => (
        <button
          key={m.value}
          onClick={() => handleModeChange(m.value)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            currentMode === m.value
              ? 'bg-white text-[#534AB7] shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
          )}
          title={m.description}
        >
          <span className="text-base leading-none">{m.icon}</span>
          <span className="hidden sm:inline">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
