// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'admin_session';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // allow login API + page without cookie
  if (pathname.startsWith('/api/admin/login') || pathname === '/admin/login') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    const has = req.cookies.get(COOKIE_NAME)?.value === '1';
    if (!has) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Only run on /admin paths (and the login page)
export const config = {
  matcher: [
    '/admin/:path*',
    '/admin/login',
    '/api/admin/login',
    '/api/admin/logout',
    '/api/admin/content',
    '/api/admin/orders',
    '/api/admin/orders/:id*',
    '/api/admin/media',
    '/api/admin/media/upload',
    '/api/admin/media/import',
  ],
};
