import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { allowDemoAuth, hasSupabaseEnv, isProduction } from "@/lib/aira/env";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (hasSupabaseEnv()) {
    const cookieStore = await cookies();
    const hasDemoSession = allowDemoAuth() && cookieStore.get("aira_demo_session")?.value === "1";

    if (!hasDemoSession) {
      try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) redirect("/login");
      } catch {
        redirect("/login");
      }
    }
  } else if (isProduction()) {
    redirect("/login?error=auth_unavailable");
  }

  return children;
}
