import { StudyApp } from "@/components/aira/StudyApp";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; q?: string }>;
}) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  return (
    <StudyApp
      initialMode="doubt"
      initialConversationId={id}
      initialSavedId={resolvedSearchParams.saved}
      initialQuery={resolvedSearchParams.q}
    />
  );
}
