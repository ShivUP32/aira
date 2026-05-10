'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { groupConversationsByDate, truncate } from '@/lib/utils';
import { AiraLogo } from '@/components/brand/AiraLogo';
import {
  Plus,
  LogOut,
  Bookmark,
  Settings,
  ChevronLeft,
  ChevronRight,
  Trash2,
  MessageSquare,
  BookOpen,
  PenLine,
  RotateCcw,
  GraduationCap,
  FileText,
} from 'lucide-react';
import type { Mode } from '@/lib/llm/prompts';

interface Conversation {
  id: string;
  title: string | null;
  mode: string;
  created_at: string;
  updated_at: string;
}

interface SidebarUser {
  id: string;
  email: string;
  displayName: string;
  avatarInitial: string;
}

interface SidebarClientProps {
  conversations: Conversation[];
  user: SidebarUser;
}

const SUBJECT_COLORS: Record<string, string> = {
  physics: '#4C44B8',
  chemistry: '#B23A48',
  mathematics: '#DC8B3F',
  'computer science': '#4F7A6E',
  english: '#6B6680',
};

const modeConfig = [
  { value: 'doubt' as Mode, label: 'Doubt Solver', icon: MessageSquare },
  { value: 'learning' as Mode, label: 'Learning', icon: BookOpen },
  { value: 'practice' as Mode, label: 'Practice', icon: PenLine },
  { value: 'revision' as Mode, label: 'Revision', icon: RotateCcw },
];

function getSubjectColor(mode: string): string {
  return SUBJECT_COLORS[mode] || 'var(--aira-indigo)';
}

export function SidebarClient({ conversations: initialConversations, user }: SidebarClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [conversations, setConversations] = useState(initialConversations);
  const supabase = createClient();

  const grouped = groupConversationsByDate(conversations);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function handleDeleteConversation(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const { error } = await supabase.from('conversations').delete().eq('id', id);
    if (error) { toast.error('Failed to delete conversation'); return; }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (pathname === `/chat/${id}`) router.push('/chat');
  }

  function ConversationItem({ conv }: { conv: Conversation }) {
    const isActive = pathname === `/chat/${conv.id}`;
    const dotColor = getSubjectColor(conv.mode);

    return (
      <Link
        href={`/chat/${conv.id}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 8px',
          borderRadius: 8,
          textDecoration: 'none',
          background: isActive ? 'var(--aira-indigo-soft)' : 'transparent',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'var(--aira-line-faint)'; }}
        onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
        className="group"
      >
        <span style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: dotColor,
          flexShrink: 0,
        }} />
        <span style={{
          flex: 1,
          fontSize: 13,
          color: isActive ? 'var(--aira-indigo)' : 'var(--aira-ink-2)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
        }}>
          {truncate(conv.title || 'New conversation', 28)}
        </span>
        <button
          onClick={(e) => handleDeleteConversation(conv.id, e)}
          style={{
            flexShrink: 0,
            padding: 2,
            borderRadius: 4,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--aira-ink-4)',
            opacity: 0,
            transition: 'opacity 0.1s',
          }}
          className="group-hover:!opacity-100"
        >
          <Trash2 style={{ width: 12, height: 12 }} />
        </button>
      </Link>
    );
  }

  function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--aira-ink-4)',
        padding: '8px 8px 4px',
      }}>
        {children}
      </div>
    );
  }

  function NavItem({ href, icon: Icon, label, badge }: { href: string; icon: React.ElementType; label: string; badge?: number }) {
    const isActive = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link href={href} style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 8px',
        borderRadius: 8,
        textDecoration: 'none',
        background: isActive ? 'var(--aira-indigo-soft)' : 'transparent',
        color: isActive ? 'var(--aira-indigo)' : 'var(--aira-ink-2)',
        fontSize: 13.5,
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'var(--aira-line-faint)'; }}
      onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
      >
        <Icon style={{ width: 15, height: 15, flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{label}</span>
        {badge !== undefined && (
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            background: 'var(--aira-paper-3)',
            color: 'var(--aira-ink-4)',
            borderRadius: 999,
            padding: '1px 7px',
          }}>
            {badge}
          </span>
        )}
      </Link>
    );
  }

  if (collapsed) {
    return (
      <div style={{
        width: 52,
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--aira-line)',
        background: 'var(--aira-paper-2)',
        height: '100%',
        flexShrink: 0,
        alignItems: 'center',
        padding: '12px 0',
        gap: 8,
      }}>
        <AiraLogo size={26} />
        <button
          onClick={() => setCollapsed(false)}
          style={{
            padding: 8,
            borderRadius: 8,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--aira-ink-3)',
          }}
        >
          <ChevronRight style={{ width: 16, height: 16 }} />
        </button>
        <div style={{ width: '100%', height: 1, background: 'var(--aira-line)', margin: '4px 0' }} />
        {modeConfig.map(({ value, icon: Icon }) => (
          <Link key={value} href={`/chat?mode=${value}`} style={{
            padding: 8,
            borderRadius: 8,
            color: 'var(--aira-ink-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Icon style={{ width: 16, height: 16 }} />
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      width: 260,
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--aira-line)',
      background: 'var(--aira-paper-2)',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 12px 14px 16px',
        borderBottom: '1px solid var(--aira-line)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <AiraLogo size={26} />
          <span style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: 18, fontWeight: 600, color: 'var(--aira-ink)' }}>
            Aira
          </span>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9,
            color: 'var(--aira-ink-4)',
            background: 'var(--aira-paper-3)',
            padding: '1px 6px',
            borderRadius: 999,
            border: '1px solid var(--aira-line)',
          }}>
            v1.0
          </span>
        </Link>
        <button
          onClick={() => setCollapsed(true)}
          style={{
            padding: 6,
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--aira-ink-4)',
          }}
        >
          <ChevronLeft style={{ width: 15, height: 15 }} />
        </button>
      </div>

      {/* New conversation */}
      <div style={{ padding: '10px 10px 0' }}>
        <Link href="/chat" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 10,
          border: '1px solid var(--aira-line-strong)',
          background: 'transparent',
          textDecoration: 'none',
          color: 'var(--aira-ink-2)',
          fontSize: 13.5,
          transition: 'background 0.1s, border-color 0.1s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.background = 'var(--aira-paper)';
          (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--aira-indigo)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
          (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--aira-line-strong)';
        }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus style={{ width: 15, height: 15 }} />
            New conversation
          </div>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9,
            color: 'var(--aira-ink-4)',
            background: 'var(--aira-paper-3)',
            padding: '2px 5px',
            borderRadius: 4,
          }}>
            ⌘K
          </span>
        </Link>
      </div>

      <ScrollArea style={{ flex: 1, minHeight: 0 }}>
        <div style={{ padding: '8px 10px' }}>
          {/* MODES */}
          <SectionLabel>Modes</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 8 }}>
            {modeConfig.map(({ value, label, icon: Icon }) => (
              <Link key={value} href={`/chat?mode=${value}`} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                borderRadius: 8,
                textDecoration: 'none',
                color: 'var(--aira-ink-2)',
                fontSize: 13.5,
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--aira-line-faint)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
              >
                <Icon style={{ width: 14, height: 14, color: 'var(--aira-ink-3)', flexShrink: 0 }} />
                {label}
              </Link>
            ))}
          </div>

          {/* LIBRARY */}
          <SectionLabel>Library</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 8 }}>
            <NavItem href="/saved" icon={Bookmark} label="Bookmarks" badge={0} />
            <NavItem href="/papers" icon={FileText} label="Past papers" />
          </div>

          {/* Conversations */}
          {conversations.length > 0 && (
            <>
              {grouped.today.length > 0 && (
                <>
                  <SectionLabel>Today</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 4 }}>
                    {grouped.today.map((conv) => <ConversationItem key={conv.id} conv={conv} />)}
                  </div>
                </>
              )}
              {grouped.yesterday.length > 0 && (
                <>
                  <SectionLabel>Yesterday</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 4 }}>
                    {grouped.yesterday.map((conv) => <ConversationItem key={conv.id} conv={conv} />)}
                  </div>
                </>
              )}
              {grouped.older.length > 0 && (
                <>
                  <SectionLabel>Last week</SectionLabel>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 4 }}>
                    {grouped.older.map((conv) => <ConversationItem key={conv.id} conv={conv} />)}
                  </div>
                </>
              )}
            </>
          )}

          {conversations.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--aira-ink-4)' }}>
              <GraduationCap style={{ width: 28, height: 28, margin: '0 auto 8px', color: 'var(--aira-ink-4)' }} />
              <p style={{ fontSize: 12 }}>No conversations yet</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom */}
      <div style={{
        borderTop: '1px solid var(--aira-line)',
        padding: '10px 10px 12px',
      }}>
        {/* Rate limit bar */}
        <div style={{ marginBottom: 10, padding: '0 4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--aira-ink-4)' }}>
              Hourly limit
            </span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: 'var(--aira-ink-4)' }}>
              18/30
            </span>
          </div>
          <div style={{ height: 3, background: 'var(--aira-line-strong)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '60%', background: 'var(--aira-indigo)', borderRadius: 999 }} />
          </div>
        </div>

        {/* User row */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '7px 8px',
              borderRadius: 10,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--aira-line-faint)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'var(--aira-indigo)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{user.avatarInitial}</span>
              </div>
              <span style={{ flex: 1, textAlign: 'left', fontSize: 13.5, color: 'var(--aira-ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.displayName}
              </span>
              <Settings style={{ width: 14, height: 14, color: 'var(--aira-ink-4)', flexShrink: 0 }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" style={{ width: 220 }}>
            <div style={{ padding: '8px 12px 8px' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--aira-ink)' }}>{user.displayName}</p>
              <p style={{ fontSize: 11, color: 'var(--aira-ink-4)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/onboarding" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings style={{ width: 14, height: 14 }} />
                Preferences
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              style={{ color: 'var(--aira-crimson)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <LogOut style={{ width: 14, height: 14 }} />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
