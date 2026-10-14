// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME, verifyAdminToken } from '@/lib/adminSession';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // allow login/logout API + login page without a session
  if (
    pathname.startsWith('/api/admin/login') ||
    pathname.startsWith('/api/admin/logout') ||
    pathname === '/admin/login'
  ) {
    return NextResponse.next();
  }

  const authed = await verifyAdminToken(req.cookies.get(ADMIN_COOKIE_NAME)?.value);

  if (pathname.startsWith('/api/admin') && !authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (pathname.startsWith('/admin') && !authed) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Only run on /admin pages and /api/admin routes
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
