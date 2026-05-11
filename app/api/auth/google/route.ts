import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { hasSupabaseEnv, siteUrl } from "@/lib/aira/env";

export async function GET() {
  if (hasSupabaseEnv()) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl()}/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (!error && data.url) return NextResponse.redirect(data.url);
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
