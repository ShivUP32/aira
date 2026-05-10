'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { groupConversationsByDate, truncate } from '@/lib/utils';
import { MODES } from '@/lib/llm/prompts';
import {
  MessageSquare,
  Plus,
  LogOut,
  User,
  Bookmark,
  Settings,
  ChevronLeft,
  ChevronRight,
  Trash2,
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

const modeEmoji: Record<string, string> = {
  doubt: '💬',
  learning: '📚',
  practice: '✏️',
  revision: '🔄',
};

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

    if (error) {
      toast.error('Failed to delete conversation');
      return;
    }

    setConversations((prev) => prev.filter((c) => c.id !== id));

    if (pathname === `/chat/${id}`) {
      router.push('/chat');
    }
  }

  function ConversationItem({ conv }: { conv: Conversation }) {
    const isActive = pathname === `/chat/${conv.id}`;

    return (
      <Link
        href={`/chat/${conv.id}`}
        className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
          isActive
            ? 'bg-[#534AB7] text-white'
            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
        }`}
      >
        <span className="text-xs flex-shrink-0">{modeEmoji[conv.mode] || '💬'}</span>
        <span className="flex-1 truncate min-w-0">
          {truncate(conv.title || 'New conversation', 30)}
        </span>
        <button
          onClick={(e) => handleDeleteConversation(conv.id, e)}
          className={`flex-shrink-0 opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity ${
            isActive ? 'text-white/70 hover:text-white' : 'text-zinc-400 hover:text-red-500'
          }`}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </Link>
    );
  }

  if (collapsed) {
    return (
      <div className="w-14 flex flex-col border-r border-zinc-200 bg-white h-full">
        <div className="flex flex-col items-center gap-2 p-2 pt-4">
          <div className="w-8 h-8 rounded-lg bg-[#534AB7] flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <button
            onClick={() => setCollapsed(false)}
            className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-1 p-2 mt-2">
          <Link href="/chat">
            <button className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500" title="New Chat">
              <Plus className="h-4 w-4" />
            </button>
          </Link>
          <Link href="/bookmarks">
            <button className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500" title="Bookmarks">
              <Bookmark className="h-4 w-4" />
            </button>
          </Link>
        </div>

        <div className="mt-auto flex flex-col items-center p-2 pb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{user.avatarInitial}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-48">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[260px] flex flex-col border-r border-zinc-200 bg-white h-full flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#534AB7] flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="font-bold text-[#534AB7] text-lg">Aira</span>
        </Link>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* New Chat */}
      <div className="px-3 py-3">
        <Link href="/chat">
          <Button className="w-full gap-2" size="sm">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </Link>
      </div>

      {/* Mode quick links */}
      <div className="px-3 pb-3 grid grid-cols-2 gap-1">
        {MODES.map((m) => (
          <Link
            key={m.value}
            href={`/chat?mode=${m.value}`}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-zinc-600 hover:bg-[#EEEDFB] hover:text-[#534AB7] transition-colors"
          >
            <span>{m.icon}</span>
            <span>{m.label}</span>
          </Link>
        ))}
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1 min-h-0 px-2">
        {conversations.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <MessageSquare className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-xs text-zinc-400">No conversations yet</p>
            <p className="text-xs text-zinc-400">Start a new chat above</p>
          </div>
        ) : (
          <div className="py-1 space-y-3">
            {grouped.today.length > 0 && (
              <div>
                <p className="px-2 py-1 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Today
                </p>
                <div className="space-y-0.5">
                  {grouped.today.map((conv) => (
                    <ConversationItem key={conv.id} conv={conv} />
                  ))}
                </div>
              </div>
            )}
            {grouped.yesterday.length > 0 && (
              <div>
                <p className="px-2 py-1 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Yesterday
                </p>
                <div className="space-y-0.5">
                  {grouped.yesterday.map((conv) => (
                    <ConversationItem key={conv.id} conv={conv} />
                  ))}
                </div>
              </div>
            )}
            {grouped.older.length > 0 && (
              <div>
                <p className="px-2 py-1 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Older
                </p>
                <div className="space-y-0.5">
                  {grouped.older.map((conv) => (
                    <ConversationItem key={conv.id} conv={conv} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Bottom nav */}
      <div className="border-t border-zinc-100 p-3 space-y-0.5">
        <Link
          href="/bookmarks"
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
        >
          <Bookmark className="h-4 w-4" />
          Bookmarks
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-colors">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs text-white bg-[#534AB7]">
                  {user.avatarInitial}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 text-left truncate">{user.displayName}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-52">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.displayName}</p>
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/onboarding" className="cursor-pointer">
                <Settings className="h-4 w-4" />
                Preferences
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
