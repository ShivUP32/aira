import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
import { SidebarClient } from '@/components/chat/SidebarClient';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch conversations for sidebar
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, title, mode, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(50);

  const displayName =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'Student';

  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--aira-canvas)]">
      <SidebarClient
        conversations={conversations || []}
        user={{
          id: user.id,
          email: user.email || '',
          displayName,
          avatarInitial,
        }}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">{children}</main>
    </div>
  );
}
