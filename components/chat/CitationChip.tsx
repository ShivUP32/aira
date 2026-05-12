'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CheckCircle2 } from 'lucide-react';

export interface Citation {
  id: number;
  content: string;
  metadata: {
    subject?: string;
    chapter?: string;
    language?: string;
    set?: string;
    question_number?: number | string;
    marks?: number;
    year?: number | string;
    type?: string;
    answer?: string;
    [key: string]: unknown;
  };
  similarity?: number;
}

interface CitationChipProps {
  citation: Citation;
  index: number;
  isMarkingScheme?: boolean;
}

export function CitationChip({ citation, index, isMarkingScheme = false }: CitationChipProps) {
  const [open, setOpen] = useState(false);
  const meta = citation.metadata;

  const subjectLabel = meta.subject
    ? meta.subject.charAt(0).toUpperCase() + meta.subject.slice(1)
    : '';

  const label = [
    meta.year && `CBSE ${meta.year}`,
    subjectLabel,
    meta.set && `Set-${meta.set}`,
    meta.question_number && `Q${meta.question_number}`,
    meta.marks && `${meta.marks}m`,
  ]
    .filter(Boolean)
    .join(' · ') || `Source ${index + 1}`;

  if (isMarkingScheme) {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 10px',
            border: '1px solid var(--aira-sage)',
            borderRadius: 999,
            background: 'var(--aira-sage-soft)',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: 'var(--aira-sage)',
            cursor: 'pointer',
          }}
        >
          <CheckCircle2 style={{ width: 11, height: 11 }} />
          {label}
        </button>
        <CitationDialog open={open} onOpenChange={setOpen} citation={citation} label={label} />
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 10px',
          border: '1px solid var(--aira-line)',
          borderRadius: 999,
          background: 'var(--aira-paper)',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          color: 'var(--aira-ink-2)',
          cursor: 'pointer',
          transition: 'border-color 0.1s, background 0.1s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--aira-saffron)';
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--aira-saffron-soft)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--aira-line)';
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--aira-paper)';
        }}
        title="View source"
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--aira-saffron)', flexShrink: 0 }} />
        {label}
      </button>
      <CitationDialog open={open} onOpenChange={setOpen} citation={citation} label={label} />
    </>
  );
}

function CitationDialog({
  open,
  onOpenChange,
  citation,
  label,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  citation: Citation;
  label: string;
}) {
  const meta = citation.metadata;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxWidth: 520, maxHeight: '80vh', overflowY: 'auto', background: 'var(--aira-paper)', border: '1px solid var(--aira-line)', borderRadius: 16 }}>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 18, color: 'var(--aira-ink)', fontWeight: 500 }}>
            {label}
          </DialogTitle>
          {meta.chapter && (
            <DialogDescription style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--aira-ink-4)' }}>
              Chapter: {meta.chapter}
            </DialogDescription>
          )}
        </DialogHeader>

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Metadata chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {meta.marks && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 10px',
                background: 'var(--aira-saffron-soft)',
                border: '1px solid var(--aira-saffron)',
                borderRadius: 999,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                color: 'var(--aira-saffron-deep)',
              }}>
                {meta.marks}m
              </span>
            )}
            {meta.type && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 10px',
                background: 'var(--aira-paper-2)',
                border: '1px solid var(--aira-line)',
                borderRadius: 999,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                color: 'var(--aira-ink-3)',
              }}>
                {String(meta.type)}
              </span>
            )}
            {meta.language && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 10px',
                background: 'var(--aira-paper-2)',
                border: '1px solid var(--aira-line)',
                borderRadius: 999,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                color: 'var(--aira-ink-3)',
              }}>
                English
              </span>
            )}
          </div>

          {/* Question */}
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aira-ink-4)', marginBottom: 8 }}>
              Question
            </div>
            <div style={{
              padding: '12px 14px',
              background: 'var(--aira-paper-2)',
              borderRadius: 10,
              border: '1px solid var(--aira-line)',
              fontFamily: 'Newsreader, Georgia, serif',
              fontSize: 15,
              color: 'var(--aira-ink)',
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
            }}>
              {citation.content}
            </div>
          </div>

          {/* Marking scheme / answer */}
          {meta.answer && (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 9,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--aira-sage)',
                marginBottom: 8,
              }}>
                <CheckCircle2 style={{ width: 11, height: 11 }} />
                Marking Scheme
              </div>
              <div style={{
                padding: '12px 14px',
                background: 'var(--aira-sage-soft)',
                borderRadius: 10,
                border: '1px solid var(--aira-sage)',
                fontSize: 13.5,
                color: 'var(--aira-ink)',
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
              }}>
                {String(meta.answer)}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
