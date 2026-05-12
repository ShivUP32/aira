import { NextResponse } from "next/server";
import { allowDemoAuth, hasSupabaseEnv, siteUrl } from "@/lib/aira/env";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl()}/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (!error && data.url) return NextResponse.redirect(data.url);
  }

  if (!allowDemoAuth()) {
    return NextResponse.redirect(`${siteUrl()}/login?error=auth_unavailable`);
  }

  const response = NextResponse.redirect(`${siteUrl()}/onboarding?demo=1`);
  response.cookies.set("aira_demo_session", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
