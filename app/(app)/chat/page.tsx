import { StudyApp } from "@/components/aira/StudyApp";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; q?: string; conversationId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  return (
    <StudyApp
      initialMode="doubt"
      initialConversationId={resolvedSearchParams.conversationId}
      initialSavedId={resolvedSearchParams.saved}
      initialQuery={resolvedSearchParams.q}
    />
  );
}
