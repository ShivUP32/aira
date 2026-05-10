import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isDevanagari(text: string): boolean {
  return /[ऀ-ॿ]/.test(text);
}

export function detectLanguage(text: string): 'hi' | 'en' {
  return isDevanagari(text) ? 'hi' : 'en';
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function groupConversationsByDate<T extends { created_at: string }>(
  items: T[]
): { today: T[]; yesterday: T[]; older: T[] } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);

  return items.reduce(
    (acc, item) => {
      const date = new Date(item.created_at);
      const itemDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      if (itemDay.getTime() === today.getTime()) {
        acc.today.push(item);
      } else if (itemDay.getTime() === yesterday.getTime()) {
        acc.yesterday.push(item);
      } else {
        acc.older.push(item);
      }
      return acc;
    },
    { today: [] as T[], yesterday: [] as T[], older: [] as T[] }
  );
}
