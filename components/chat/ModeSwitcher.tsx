'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { MODES } from '@/lib/llm/prompts';
import type { Mode } from '@/lib/llm/prompts';

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
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      background: 'var(--aira-paper-2)',
      borderRadius: 999,
      padding: 4,
      border: '1px solid var(--aira-line)',
    }}>
      {MODES.map((m) => {
        const isActive = currentMode === m.value;
        return (
          <button
            key={m.value}
            onClick={() => handleModeChange(m.value)}
            title={m.description}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 999,
              border: 'none',
              background: isActive ? 'var(--aira-ink)' : 'transparent',
              color: isActive ? '#fff' : 'var(--aira-ink-2)',
              fontSize: 13,
              fontWeight: isActive ? 500 : 400,
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1 }}>{m.icon}</span>
            <span style={{ display: 'none' }} className="sm:!inline">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
