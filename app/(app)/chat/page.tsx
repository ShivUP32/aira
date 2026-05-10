import { Suspense } from 'react';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Chat',
};

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col p-4 gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <ChatInterface />
    </Suspense>
  );
}
