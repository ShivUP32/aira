import { NextRequest, NextResponse } from "next/server";
import { allowLocalTestLogin, siteUrl } from "@/lib/aira/env";

const TEST_EMAIL = "test@test.com";

function redirectWithTestSession(next = "/onboarding") {
  const redirectTo = next.startsWith("/") && !next.startsWith("//") ? next : "/onboarding";
  const response = NextResponse.redirect(`${siteUrl()}${redirectTo}`);
  response.cookies.set("aira_demo_session", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  response.cookies.set("aira_test_email", TEST_EMAIL, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

export async function GET(request: NextRequest) {
  if (!allowLocalTestLogin(request.headers.get("host"))) {
    return NextResponse.redirect(`${siteUrl()}/login?error=test_login_disabled`);
  }

  const next = request.nextUrl.searchParams.get("next") || "/onboarding";
  return redirectWithTestSession(next);
}

export async function POST(request: NextRequest) {
  if (!allowLocalTestLogin(request.headers.get("host"))) {
    return NextResponse.redirect(`${siteUrl()}/login?error=test_login_disabled`);
  }

  const formData = await request.formData().catch(() => null);
  const email = String(formData?.get("email") || "").trim().toLowerCase();
  const next = String(formData?.get("next") || "/onboarding");

  if (email !== TEST_EMAIL) {
    return NextResponse.redirect(`${siteUrl()}/login?error=test_email_not_allowed`);
  }

  return redirectWithTestSession(next);
}
