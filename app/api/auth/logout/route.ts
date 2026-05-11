import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv, siteUrl } from "@/lib/aira/env";

export async function POST() {
  if (hasSupabaseEnv()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      // Demo/local sign-out still clears the local cookie below.
    }
  }
  const response = NextResponse.redirect(siteUrl(), { status: 303 });
  response.cookies.delete("aira_demo_session");
  return response;
}
