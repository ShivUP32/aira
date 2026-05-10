'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CitationChip, type Citation } from '@/components/chat/CitationChip';
import { Bookmark, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

interface SavedItem {
  id: string;
  question: string;
  answer: string;
  citations: Citation[];
  subject: string;
  created_at: string;
  synced_at?: string;
}

const SUBJECT_COLORS: Record<string, string> = {
  physics: '#4C44B8',
  chemistry: '#B23A48',
  mathematics: '#DC8B3F',
  'computer science': '#4F7A6E',
  english: '#6B6680',
};

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function SavedPage() {
  const [saves, setSaves] = useState<SavedItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const LOCAL_KEY_PREFIX = 'aira_saved_';

  const loadFromLocal = useCallback((userId: string): SavedItem[] => {
    try {
      const raw = localStorage.getItem(`${LOCAL_KEY_PREFIX}${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, []);

  const saveToLocal = useCallback((userId: string, items: SavedItem[]) => {
    localStorage.setItem(`${LOCAL_KEY_PREFIX}${userId}`, JSON.stringify(items));
  }, []);

  const syncFromServer = useCallback(async (userId: string, localItems: SavedItem[]) => {
    setSyncing(true);
    try {
      // Find latest local timestamp for delta sync
      const latestLocal = localItems.length > 0
        ? localItems.reduce((a, b) => new Date(a.created_at) > new Date(b.created_at) ? a : b).created_at
        : null;

      let query = supabase
        .from('saves')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // Delta sync: only fetch newer items
      if (latestLocal) {
        query = query.gt('created_at', latestLocal);
      }

      const { data } = await query.limit(100);

      if (data && data.length > 0) {
        const serverItems: SavedItem[] = data.map((row: Record<string, unknown>) => ({
          id: row.id as string,
          question: row.question as string,
          answer: row.answer as string,
          citations: (row.citations as Citation[]) || [],
          subject: (row.subject as string) || '',
          created_at: row.created_at as string,
          synced_at: new Date().toISOString(),
        }));

        const merged = [
          ...serverItems,
          ...localItems.filter((l) => !serverItems.find((s) => s.id === l.id)),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        saveToLocal(userId, merged);
        setSaves(merged);

        if (serverItems.length > 0) {
          setJustSynced(serverItems[0].id);
          setTimeout(() => setJustSynced(null), 5000);
        }
      }
    } catch {
      // Silently fail — local data still shown
    } finally {
      setSyncing(false);
    }
  }, [supabase, saveToLocal]);

  useEffect(() => {
    let userId: string;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      userId = user.id;

      const local = loadFromLocal(userId);
      setSaves(local);
      setLoading(false);

      await syncFromServer(userId, local);
    }

    init();
  }, [supabase, loadFromLocal, syncFromServer]);

  const count = saves.length;

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      background: 'var(--aira-canvas)',
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bookmark style={{ width: 20, height: 20, color: 'var(--aira-indigo)' }} />
            <h1 style={{
              fontFamily: 'Newsreader, Georgia, serif',
              fontSize: 28,
              fontWeight: 500,
              color: 'var(--aira-ink)',
              margin: 0,
            }}>
              Saved
            </h1>
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              color: 'var(--aira-ink-4)',
              background: 'var(--aira-paper-3)',
              padding: '2px 8px',
              borderRadius: 999,
            }}>
              {count}
            </span>
          </div>

          <button
            onClick={() => {
              supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) syncFromServer(user.id, saves);
              });
            }}
            disabled={syncing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              border: '1px solid var(--aira-line)',
              borderRadius: 8,
              background: 'var(--aira-paper)',
              cursor: syncing ? 'not-allowed' : 'pointer',
              fontSize: 13,
              color: 'var(--aira-ink-3)',
              opacity: syncing ? 0.6 : 1,
            }}
          >
            <RefreshCw style={{ width: 13, height: 13, animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            Sync
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-shimmer" style={{ height: 72, borderRadius: 14 }} />
            ))}
          </div>
        ) : saves.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'var(--aira-indigo-tint)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Bookmark style={{ width: 22, height: 22, color: 'var(--aira-indigo)' }} />
            </div>
            <h3 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 20, color: 'var(--aira-ink)', fontWeight: 400, marginBottom: 8 }}>
              Nothing saved yet
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--aira-ink-4)' }}>
              Save Aira's answers to revisit them anytime — even offline.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {saves.map((item) => {
              const isExpanded = expanded === item.id;
              const isNew = justSynced === item.id;
              const dotColor = SUBJECT_COLORS[(item.subject || '').toLowerCase()] || 'var(--aira-indigo)';

              return (
                <div key={item.id} style={{
                  background: 'var(--aira-paper)',
                  border: `1px solid ${isNew ? 'var(--aira-saffron)' : 'var(--aira-line)'}`,
                  borderRadius: 14,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}>
                  {/* Row */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 16px',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                    <span style={{
                      flex: 1,
                      fontSize: 13.5,
                      color: 'var(--aira-ink)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      minWidth: 0,
                    }}>
                      {item.question}
                    </span>
                    <span style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 10,
                      color: 'var(--aira-ink-4)',
                      flexShrink: 0,
                    }}>
                      {formatRelativeTime(item.created_at)}
                    </span>
                    {isNew && (
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 9,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--aira-saffron-deep)',
                        background: 'var(--aira-saffron-soft)',
                        padding: '2px 8px',
                        borderRadius: 999,
                        flexShrink: 0,
                      }}>
                        Just synced
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp style={{ width: 14, height: 14, color: 'var(--aira-ink-4)', flexShrink: 0 }} />
                    ) : (
                      <ChevronDown style={{ width: 14, height: 14, color: 'var(--aira-ink-4)', flexShrink: 0 }} />
                    )}
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{
                      borderTop: '1px solid var(--aira-line-faint)',
                      padding: '16px 16px 16px',
                    }}>
                      {/* Full question */}
                      <div style={{
                        fontFamily: 'Newsreader, Georgia, serif',
                        fontSize: 15,
                        color: 'var(--aira-ink)',
                        lineHeight: 1.6,
                        marginBottom: 12,
                        fontWeight: 500,
                      }}>
                        {item.question}
                      </div>

                      {/* Answer */}
                      <div style={{
                        fontSize: 13.5,
                        color: 'var(--aira-ink-2)',
                        lineHeight: 1.7,
                        marginBottom: 12,
                        whiteSpace: 'pre-wrap',
                      }}>
                        {item.answer}
                      </div>

                      {/* Citations */}
                      {item.citations && item.citations.length > 0 && (
                        <div>
                          <div style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: 9,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            color: 'var(--aira-ink-4)',
                            marginBottom: 8,
                          }}>
                            Sources
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {item.citations.map((c, i) => (
                              <CitationChip key={c.id || i} citation={c} index={i} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
