import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/aira/env";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (hasSupabaseEnv()) {
    const cookieStore = await cookies();
    const hasDemoSession = cookieStore.get("aira_demo_session")?.value === "1";

    if (!hasDemoSession) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) redirect("/login");
      } catch {
        redirect("/login");
      }
    }
  }

  return children;
}
