'use client';

import { X, CheckCircle2 } from 'lucide-react';
import type { Citation } from './CitationChip';

interface ContextPanelProps {
  pinnedCitation: Citation | null;
  onClose: () => void;
}

const SUBJECT_COLORS: Record<string, string> = {
  physics: '#4C44B8',
  chemistry: '#B23A48',
  mathematics: '#DC8B3F',
  'computer science': '#4F7A6E',
  english: '#6B6680',
};

export function ContextPanel({ pinnedCitation, onClose }: ContextPanelProps) {
  const isEmpty = !pinnedCitation;

  return (
    <div style={{
      width: 320,
      flexShrink: 0,
      borderLeft: '1px solid var(--aira-line)',
      background: 'var(--aira-paper-2)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}
    className="hidden lg:flex"
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid var(--aira-line)',
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--aira-ink-4)',
        }}>
          Pinned Source
        </span>
        {!isEmpty && (
          <button
            onClick={onClose}
            style={{
              padding: 4,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--aira-ink-4)',
              borderRadius: 4,
              display: 'flex',
            }}
          >
            <X style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>

      {isEmpty ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'var(--aira-paper-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            fontSize: 20,
          }}>
            📄
          </div>
          <p style={{ fontSize: 13, color: 'var(--aira-ink-4)', lineHeight: 1.5 }}>
            Click a citation chip to pin the source here
          </p>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SourceCard citation={pinnedCitation} />
          <RelatedSection />
        </div>
      )}
    </div>
  );
}

function SourceCard({ citation }: { citation: Citation }) {
  const meta = citation.metadata;
  const subjectKey = (meta.subject || '').toLowerCase();
  const dotColor = SUBJECT_COLORS[subjectKey] || 'var(--aira-indigo)';

  const paperCode = [
    meta.year && `CBSE ${meta.year}`,
    meta.subject && meta.subject.charAt(0).toUpperCase() + meta.subject.slice(1),
    meta.set && `Set-${meta.set}`,
  ].filter(Boolean).join(' · ');

  // Parse marks breakdown for marking scheme display
  const marksBreakdown = meta.marks
    ? Array.from({ length: Math.min(Number(meta.marks), 5) }, (_, i) => `${i + 1}m`)
    : [];

  return (
    <div style={{
      background: 'var(--aira-paper)',
      border: '1px solid var(--aira-line)',
      borderRadius: 14,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0, marginTop: 1 }} />
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            color: 'var(--aira-ink-3)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}>
            {paperCode}
          </span>
        </div>
        {meta.type === 'marking_scheme' && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            background: 'var(--aira-sage-soft)',
            border: '1px solid var(--aira-sage)',
            borderRadius: 999,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9,
            color: 'var(--aira-sage)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            flexShrink: 0,
          }}>
            <CheckCircle2 style={{ width: 9, height: 9 }} />
            Official
          </div>
        )}
        {meta.marks && (
          <span style={{
            padding: '2px 8px',
            background: 'var(--aira-saffron-soft)',
            border: '1px solid rgba(220,139,63,0.4)',
            borderRadius: 999,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9,
            color: 'var(--aira-saffron-deep)',
            flexShrink: 0,
          }}>
            {meta.marks}m
          </span>
        )}
      </div>

      {/* Question */}
      {meta.question_number && (
        <div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--aira-ink-4)',
            marginBottom: 6,
          }}>
            Q{meta.question_number}
          </div>
          <p style={{
            fontFamily: 'Newsreader, Georgia, serif',
            fontSize: 14,
            color: 'var(--aira-ink)',
            lineHeight: 1.6,
            margin: 0,
          }}>
            {citation.content}
          </p>
        </div>
      )}

      {/* Marking scheme */}
      {meta.answer && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--aira-sage)',
            marginBottom: 8,
          }}>
            <CheckCircle2 style={{ width: 10, height: 10 }} />
            Marking Scheme
          </div>
          <div style={{
            background: 'var(--aira-paper-2)',
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 12.5,
            color: 'var(--aira-ink-2)',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
          }}>
            {String(meta.answer)}
          </div>
          {marksBreakdown.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
              {marksBreakdown.map((m, i) => (
                <span key={i} style={{
                  padding: '2px 8px',
                  background: 'var(--aira-saffron-soft)',
                  border: '1px solid rgba(220,139,63,0.3)',
                  borderRadius: 999,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 9,
                  color: 'var(--aira-saffron-deep)',
                }}>
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RelatedSection() {
  const related = [
    { year: 2024, set: '1', q: 11, marks: 5, subject: 'Physics' },
    { year: 2023, set: '2', q: 9, marks: 3, subject: 'Physics' },
    { year: 2022, set: '1', q: 14, marks: 5, subject: 'Physics' },
  ];

  return (
    <div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--aira-ink-4)',
        marginBottom: 10,
      }}>
        Related from past papers
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {related.map((r) => (
          <button
            key={`${r.year}-${r.q}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: 'var(--aira-paper)',
              border: '1px solid var(--aira-line)',
              borderRadius: 10,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.1s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--aira-saffron)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--aira-line)'; }}
          >
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              color: 'var(--aira-ink-3)',
            }}>
              CBSE {r.year} {r.subject} · Set-{r.set} · Q{r.q}
            </span>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 9,
              padding: '1px 6px',
              background: 'var(--aira-saffron-soft)',
              borderRadius: 999,
              color: 'var(--aira-saffron-deep)',
            }}>
              {r.marks}m
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
