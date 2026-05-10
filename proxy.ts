import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
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

    // @supabase/ssr names browser auth cookies: sb-<project-ref>-auth-token
    let hasSession = false;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      try {
        const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
        hasSession = request.cookies.has(`sb-${projectRef}-auth-token`);
      } catch {
        // Treat a malformed env var as no active browser session.
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
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/app/:path*',
    '/chat/:path*',
    '/onboarding/:path*',
    '/bookmarks/:path*',
    '/practice/:path*',
    '/revision/:path*',
    '/login',
    '/signup',
  ],
};
