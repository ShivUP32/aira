'use client';

import { useEffect, useState } from 'react';
import { Bookmark, Trash2, BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Message } from '@/components/chat/Message';
import type { Citation } from '@/components/chat/CitationChip';

interface BookmarkItem {
  id: string;
  created_at: string;
  message_id?: string;
  messages?: {
    id: string;
    content: string;
    role: string;
    citations: Citation[];
    conversation_id: string;
    conversations?: { id: string; title: string; mode: string };
  };
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetch('/api/bookmarks')
      .then((r) => r.json())
      .then((data) => { setBookmarks(data.bookmarks || []); setLoading(false); })
      .catch(() => { toast.error('Failed to load bookmarks'); setLoading(false); });
  }, []);

  async function deleteBookmark(id: string) {
    const res = await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
      toast.success('Bookmark removed');
    } else {
      toast.error('Failed to remove bookmark');
    }
  }

  const modes = ['all', 'doubt', 'learning', 'practice', 'revision'];
  const filtered = filter === 'all'
    ? bookmarks
    : bookmarks.filter((b) => b.messages?.conversations?.mode === filter);

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--aira-canvas)' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--aira-paper)', borderBottom: '1px solid var(--aira-line)',
        padding: '14px 28px',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'var(--aira-indigo-tint)', border: '1px solid var(--aira-indigo-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bookmark style={{ width: 15, height: 15, color: 'var(--aira-indigo)' }} />
            </div>
            <div>
              <h1 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 20, fontWeight: 500, color: 'var(--aira-ink)', margin: 0 }}>
                Bookmarks
              </h1>
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--aira-ink-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {bookmarks.length} saved
              </div>
            </div>
          </div>

          {/* Mode filter tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {modes.map((m) => (
              <button
                key={m}
                onClick={() => setFilter(m)}
                style={{
                  padding: '5px 12px', borderRadius: 999, border: 'none',
                  background: filter === m ? 'var(--aira-ink)' : 'transparent',
                  color: filter === m ? '#fff' : 'var(--aira-ink-3)',
                  fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
                  textTransform: m === 'all' ? 'none' : 'capitalize',
                }}
              >
                {m === 'all' ? 'All' : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 28px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <Loader2 style={{ width: 24, height: 24, animation: 'spin 1s linear infinite', color: 'var(--aira-ink-4)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, background: 'var(--aira-paper)',
              border: '1px solid var(--aira-line)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <BookOpen style={{ width: 24, height: 24, color: 'var(--aira-ink-4)' }} />
            </div>
            <h3 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 20, fontWeight: 400, color: 'var(--aira-ink)', marginBottom: 8 }}>
              No bookmarks yet
            </h3>
            <p style={{ fontSize: 14, color: 'var(--aira-ink-3)' }}>
              Save helpful answers by clicking the bookmark icon on any response.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map((bookmark) => {
              const msg = bookmark.messages;
              if (!msg) return null;
              return (
                <div key={bookmark.id} style={{
                  background: 'var(--aira-paper)', border: '1px solid var(--aira-line)',
                  borderRadius: 16, overflow: 'hidden',
                }}>
                  {/* Bookmark header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px', borderBottom: '1px solid var(--aira-line-faint)',
                    background: 'var(--aira-paper-2)',
                  }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--aira-ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {msg.conversations?.title || 'Conversation'}
                    </span>
                    {msg.conversations?.mode && (
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                        padding: '2px 8px', borderRadius: 999,
                        background: 'var(--aira-indigo-tint)', color: 'var(--aira-indigo)',
                        textTransform: 'capitalize',
                      }}>
                        {msg.conversations.mode}
                      </span>
                    )}
                    <div style={{ flex: 1 }} />
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'var(--aira-ink-4)' }}>
                      {new Date(bookmark.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                    <button
                      onClick={() => deleteBookmark(bookmark.id)}
                      style={{
                        padding: 6, borderRadius: 6, border: 'none', background: 'transparent',
                        cursor: 'pointer', color: 'var(--aira-ink-4)', display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Remove bookmark"
                    >
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                  {/* Message */}
                  <div style={{ padding: '16px 16px' }}>
                    <Message
                      role={msg.role as 'user' | 'assistant'}
                      content={msg.content}
                      citations={msg.citations}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
