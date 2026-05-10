import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;

    const isAppRoute =
      pathname.startsWith('/app') ||
      pathname.startsWith('/chat') ||
      pathname.startsWith('/onboarding') ||
      pathname.startsWith('/bookmarks') ||
      pathname.startsWith('/practice') ||
      pathname.startsWith('/revision');

    const isAuthRoute =
      pathname.startsWith('/login') || pathname.startsWith('/signup');

    if (!isAppRoute && !isAuthRoute) {
      return NextResponse.next();
    }

    // Derive session cookie name from the Supabase project URL.
    // @supabase/ssr names it: sb-<project-ref>-auth-token
    let hasSession = false;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      try {
        const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
        hasSession = request.cookies.has(`sb-${projectRef}-auth-token`);
      } catch {
        // malformed URL — treat as no session
      }
    }

    if (isAppRoute && !hasSession) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (isAuthRoute && hasSession) {
      return NextResponse.redirect(new URL('/chat', request.url));
    }

    return NextResponse.next();
  } catch (e) {
    console.error('Middleware error:', e);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
