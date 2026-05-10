'use client';

import { useState, useRef, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { toast } from 'sonner';
import { BookOpen, Loader2, RefreshCw } from 'lucide-react';
import { Message } from '@/components/chat/Message';
import { InputBox } from '@/components/chat/InputBox';

const SUBJECTS = [
  { value: 'physics', label: 'Physics', color: '#4C44B8' },
  { value: 'chemistry', label: 'Chemistry', color: '#B23A48' },
  { value: 'mathematics', label: 'Mathematics', color: '#DC8B3F' },
  { value: 'cs', label: 'Computer Science', color: '#4F7A6E' },
  { value: 'english', label: 'English', color: '#6B6680' },
];

const CHAPTERS: Record<string, string[]> = {
  physics: [
    'Electric Charges and Fields', 'Electrostatic Potential', 'Current Electricity',
    'Moving Charges and Magnetism', 'Magnetism and Matter', 'Electromagnetic Induction',
    'Alternating Current', 'Electromagnetic Waves', 'Ray Optics', 'Wave Optics',
    'Dual Nature of Radiation', 'Atoms', 'Nuclei', 'Semiconductor Electronics',
  ],
  chemistry: [
    'Solutions', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry',
    'The p-Block Elements', 'The d and f Block Elements', 'Coordination Compounds',
    'Haloalkanes and Haloarenes', 'Alcohols, Phenols and Ethers', 'Aldehydes, Ketones',
    'Carboxylic Acids', 'Amines', 'Biomolecules', 'Polymers', 'Chemistry in Everyday Life',
  ],
  mathematics: [
    'Relations and Functions', 'Inverse Trigonometric Functions', 'Matrices', 'Determinants',
    'Continuity and Differentiability', 'Application of Derivatives', 'Integrals',
    'Application of Integrals', 'Differential Equations', 'Vector Algebra',
    'Three Dimensional Geometry', 'Linear Programming', 'Probability',
  ],
  cs: [
    'Networking', 'Database Management', 'Python - Functions', 'Python - File Handling',
    'Python - Data Structures', 'Boolean Algebra', 'Computer Architecture',
  ],
  english: [
    'Flamingo - Prose', 'Flamingo - Poetry', 'Vistas', 'Writing Skills', 'Grammar',
  ],
};

const QUICK_REVISIONS = [
  'Revise all important formulas for this chapter',
  'Give me 5 most likely board exam questions',
  'What are the common mistakes students make?',
];

export default function RevisionPage() {
  const [subject, setSubject] = useState('physics');
  const [chapter, setChapter] = useState('');
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState('');

  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/chat', body: { mode: 'revision' } }),
    []
  );

  const { messages, sendMessage, status } = useChat({
    transport,
    onError() {
      toast.error('Something went wrong. Please try again.');
    },
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  async function startRevision() {
    if (!chapter) { toast.error('Please select a chapter first.'); return; }
    setStarted(true);
    await sendMessage({
      text: `Give me a complete revision pack for ${subject} — Chapter: ${chapter}. Include key concepts, important formulas, common exam tips, and 5 quick-fire quiz questions.`,
    });
  }

  function handleSubmit() {
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput('');
    sendMessage({ text });
  }

  const visibleMessages = messages.filter((m) => m.role !== 'system');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--aira-canvas)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', borderBottom: '1px solid var(--aira-line)',
        background: 'var(--aira-paper)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'var(--aira-saffron-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen style={{ width: 16, height: 16, color: 'var(--aira-saffron-deep)' }} />
          </div>
          <div>
            <div style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 17, fontWeight: 500, color: 'var(--aira-ink)' }}>
              Revision Mode
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--aira-ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Concepts · Formulas · Quick Quiz
            </div>
          </div>
        </div>
        {started && (
          <button
            onClick={() => { setStarted(false); setChapter(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, border: '1px solid var(--aira-line)',
              background: 'transparent', cursor: 'pointer', fontSize: 13,
              color: 'var(--aira-ink-3)', fontFamily: 'inherit',
            }}
          >
            <RefreshCw style={{ width: 13, height: 13 }} /> New session
          </button>
        )}
      </div>

      {!started ? (
        /* Setup panel */
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{
            background: 'var(--aira-paper)', border: '1px solid var(--aira-line)',
            borderRadius: 20, padding: 32, maxWidth: 540, width: '100%',
            boxShadow: '0 1px 0 rgba(46,40,128,0.04), 0 4px 16px rgba(26,24,39,0.06)',
          }}>
            <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 26, fontWeight: 400, color: 'var(--aira-ink)', marginBottom: 6 }}>
              What are you revising?
            </h2>
            <p style={{ fontSize: 14, color: 'var(--aira-ink-3)', marginBottom: 24, lineHeight: 1.6 }}>
              Pick a subject and chapter. Aira will generate a tailored revision pack from real 2025 board papers.
            </p>

            {/* Subject select */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aira-ink-3)', marginBottom: 8 }}>Subject</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {SUBJECTS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { setSubject(s.value); setChapter(''); }}
                    style={{
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                      border: subject === s.value ? `1.5px solid ${s.color}` : '1px solid var(--aira-line)',
                      background: subject === s.value ? `${s.color}12` : 'var(--aira-paper)',
                      color: subject === s.value ? s.color : 'var(--aira-ink-2)',
                      fontSize: 13, fontWeight: subject === s.value ? 500 : 400,
                      fontFamily: 'inherit',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chapter select */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aira-ink-3)', marginBottom: 8 }}>Chapter</div>
              <select
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: '1px solid var(--aira-line-strong)', background: 'var(--aira-paper)',
                  color: chapter ? 'var(--aira-ink)' : 'var(--aira-ink-4)',
                  fontSize: 14, fontFamily: 'inherit', appearance: 'none', outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="">Select a chapter…</option>
                {(CHAPTERS[subject] || []).map((ch) => (
                  <option key={ch} value={ch}>{ch}</option>
                ))}
              </select>
            </div>

            <button
              onClick={startRevision}
              disabled={!chapter}
              style={{
                width: '100%', padding: '12px 20px', borderRadius: 12,
                border: 'none', background: chapter ? 'var(--aira-indigo)' : 'var(--aira-line)',
                color: chapter ? '#fff' : 'var(--aira-ink-4)',
                fontSize: 15, fontWeight: 500, cursor: chapter ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
              }}
            >
              Generate Revision Pack
            </button>
          </div>
        </div>
      ) : (
        /* Revision chat */
        <>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              {visibleMessages.map((m) => {
                const text = m.parts
                  .filter((p) => p.type === 'text')
                  .map((p) => (p as { type: 'text'; text: string }).text)
                  .join('');
                return (
                  <Message key={m.id} role={m.role as 'user' | 'assistant'} content={text} isStreaming={false} />
                );
              })}
              {isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--aira-ink-3)' }}>
                  <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite', color: 'var(--aira-saffron)' }} />
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Generating revision pack…
                  </span>
                </div>
              )}
              {!isLoading && visibleMessages.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 8 }}>
                  {QUICK_REVISIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      style={{
                        padding: '6px 12px', borderRadius: 999, border: '1px solid var(--aira-line)',
                        background: 'var(--aira-paper)', fontSize: 12, color: 'var(--aira-ink-2)',
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <InputBox value={input} onChange={setInput} onSubmit={handleSubmit} isLoading={isLoading} placeholder="Ask a follow-up question about this chapter…" />
        </>
      )}
    </div>
  );
}
