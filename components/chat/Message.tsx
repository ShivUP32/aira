'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { AiraLogo } from '@/components/brand/AiraLogo';
import { CitationChip, type Citation } from './CitationChip';

interface MessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  isStreaming?: boolean;
}

export function Message({ role, content, citations = [], isStreaming = false }: MessageProps) {
  if (role === 'system') return null;
  const isUser = role === 'user';

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          background: 'var(--aira-ink)',
          color: 'var(--aira-paper)',
          borderRadius: '16px 16px 4px 16px',
          padding: '10px 16px',
          fontSize: 14.5,
          lineHeight: 1.6,
          maxWidth: '75%',
          whiteSpace: 'pre-wrap',
        }}>
          {content}
        </div>
      </div>
    );
  }

  // Aira message
  return (
    <div style={{ display: 'flex', gap: 12, flexDirection: 'row', alignItems: 'flex-start' }}>
      {/* Avatar */}
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
        marginTop: 2,
      }}>
        <AiraLogo size={20} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Response header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--aira-ink)' }}>Aira</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--aira-ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            gemini-2.5-pro
          </span>
          {citations.length > 0 && (
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--aira-ink-4)' }}>
              · {citations.length} source{citations.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="prose-aira">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              p: ({ children }) => (
                <p style={{ marginBottom: '0.6em', lineHeight: 1.7, color: 'var(--aira-ink)' }}>{children}</p>
              ),
              ul: ({ children }) => (
                <ul style={{ paddingLeft: '1.4em', marginBottom: '0.6em' }}>{children}</ul>
              ),
              ol: ({ children }) => (
                <ol style={{ paddingLeft: '1.4em', marginBottom: '0.6em' }}>{children}</ol>
              ),
              li: ({ children }) => <li style={{ marginBottom: '0.2em' }}>{children}</li>,
              h1: ({ children }) => (
                <h1 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 20, fontWeight: 600, marginTop: '1.2em', marginBottom: '0.4em', color: 'var(--aira-ink)' }}>{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 18, fontWeight: 600, marginTop: '1.2em', marginBottom: '0.4em', color: 'var(--aira-ink)' }}>{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 16, fontWeight: 600, marginTop: '1em', marginBottom: '0.3em', color: 'var(--aira-ink)' }}>{children}</h3>
              ),
              h4: ({ children }) => (
                <h4 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 15, fontWeight: 500, marginTop: '0.8em', marginBottom: '0.3em', color: 'var(--aira-ink)' }}>{children}</h4>
              ),
              code: ({ children, className }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code style={{
                      background: 'var(--aira-indigo-tint)',
                      color: 'var(--aira-indigo)',
                      padding: '0.1em 0.4em',
                      borderRadius: '0.25rem',
                      fontSize: '0.875em',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}>
                      {children}
                    </code>
                  );
                }
                return <code className={className}>{children}</code>;
              },
              pre: ({ children }) => (
                <pre style={{
                  background: 'var(--aira-paper-3)',
                  color: 'var(--aira-ink)',
                  border: '1px solid var(--aira-line)',
                  padding: '12px 14px',
                  borderRadius: 10,
                  overflowX: 'auto',
                  marginBottom: '0.75em',
                  fontSize: '0.85em',
                  fontFamily: 'JetBrains Mono, monospace',
                  lineHeight: 1.5,
                }}>
                  {children}
                </pre>
              ),
              blockquote: ({ children }) => (
                <blockquote style={{
                  borderLeft: '3px solid var(--aira-indigo-soft)',
                  paddingLeft: '1em',
                  marginLeft: 0,
                  color: 'var(--aira-ink-3)',
                  fontStyle: 'italic',
                  fontFamily: 'Newsreader, Georgia, serif',
                }}>
                  {children}
                </blockquote>
              ),
              table: ({ children }) => (
                <div style={{ overflowX: 'auto', marginBottom: '0.75em' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th style={{
                  background: 'var(--aira-paper-2)',
                  border: '1px solid var(--aira-line)',
                  padding: '6px 10px',
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: 13,
                }}>
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td style={{ border: '1px solid var(--aira-line)', padding: '6px 10px', fontSize: 13 }}>
                  {children}
                </td>
              ),
              a: ({ href, children }) => (
                <a href={href} style={{ color: 'var(--aira-indigo)', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
              strong: ({ children }) => <strong style={{ fontWeight: 600, color: 'var(--aira-ink)' }}>{children}</strong>,
              em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
              hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--aira-line)', margin: '12px 0' }} />,
            }}
          >
            {content}
          </ReactMarkdown>
          {isStreaming && (
            <span className="aira-cursor" />
          )}
        </div>

        {/* Citation row */}
        {citations.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--aira-line-faint)' }}>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--aira-ink-4)',
              marginBottom: 8,
            }}>
              Grounded in
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {citations.map((citation, i) => (
                <CitationChip
                  key={citation.id || i}
                  citation={citation}
                  index={i}
                  isMarkingScheme={citation.metadata?.type === 'marking_scheme'}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
