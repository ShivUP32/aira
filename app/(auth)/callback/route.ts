import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { allowDemoAuth, hasSupabaseEnv } from "@/lib/aira/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code && hasSupabaseEnv()) {
    const cookieStore = await cookies();
    const response = NextResponse.redirect(new URL("/onboarding", url.origin));
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
  }

  if (!allowDemoAuth()) {
    return NextResponse.redirect(new URL("/login?error=auth_failed", url.origin));
  }

  const response = NextResponse.redirect(new URL("/onboarding?demo=1", url.origin));
  response.cookies.set("aira_demo_session", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
