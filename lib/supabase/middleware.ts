import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { allowLocalTestLogin, allowMissingEnvLocalFallback, hasSupabaseEnv, isProduction } from "@/lib/aira/env";

const appRoutes = ["/chat", "/learning", "/revision", "/practice", "/bookmarks", "/saved", "/onboarding"];
const publicApiRoutes = ["/api/auth/google", "/api/auth/logout", "/api/auth/test"];

function isAppRoute(pathname: string) {
  return appRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isProtectedApiRoute(pathname: string) {
  return pathname.startsWith("/api/") && !publicApiRoutes.includes(pathname);
}

function authUnavailableResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "Authentication is not configured." }, { status: 503 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("error", "auth_unavailable");
  return NextResponse.redirect(url);
}

function authRequiredResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "Authentication required." }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  const protectedRoute = isAppRoute(request.nextUrl.pathname) || isProtectedApiRoute(request.nextUrl.pathname);
  const hasDemoSession = allowMissingEnvLocalFallback() || (
    allowLocalTestLogin(request.headers.get("host")) &&
    request.cookies.get("aira_demo_session")?.value === "1" &&
    request.cookies.get("aira_test_email")?.value === "test@test.com"
  );
  if (!hasSupabaseEnv()) {
    if (protectedRoute && isProduction()) return authUnavailableResponse(request);
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (protectedRoute && !user && !hasDemoSession) {
    return authRequiredResponse(request);
  }

  return response;
}
