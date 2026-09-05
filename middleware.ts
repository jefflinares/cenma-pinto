import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { signToken, verifyToken } from '@/lib/auth/session';

const protectedRoutes = '/dashboard';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session');
  const isProtectedPage = pathname.startsWith(protectedRoutes);
  const isApiRoute = pathname.startsWith('/api');

  // No cookie → redirect pages to sign-in, return 401 for API routes
  if (!sessionCookie) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (isProtectedPage) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    return NextResponse.next();
  }

  // Cookie exists → verify it
  try {
    const parsed = await verifyToken(sessionCookie.value);

    // Refresh token on GET page requests
    if (!isApiRoute && request.method === 'GET') {
      const expiresInOneDay = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const res = NextResponse.next();
      res.cookies.set({
        name: 'session',
        value: await signToken({
          ...parsed,
          expires: expiresInOneDay.toISOString(),
        }),
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        expires: expiresInOneDay,
      });
      return res;
    }

    return NextResponse.next();
  } catch {
    // Invalid or expired token
    const res = isApiRoute
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      : isProtectedPage
        ? NextResponse.redirect(new URL('/sign-in', request.url))
        : NextResponse.next();

    res.cookies.delete('session');
    return res;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs',
};
