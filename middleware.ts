// middleware.ts — admin guard + EN/FR locale routing.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME, verifyAdminToken } from '@/lib/adminSession';
import { LOCALE_COOKIE, LOCALE_HEADER, PATH_HEADER, isUnlocalizedPath, localizeHref, splitLocale } from '@/lib/i18n/config';

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ── Admin pages + admin API ───────────────────────────────────────────────
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
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

  // ── Locale routing for site pages ─────────────────────────────────────────
  const { locale, path } = splitLocale(pathname);
  if (isUnlocalizedPath(path)) return NextResponse.next();

  // A reader who chose French (cookie) landing on an English URL goes to the French one.
  // `?lang=en` (set by the language switcher) skips this so switching back works.
  const cookieLocale = req.cookies.get(LOCALE_COOKIE)?.value;
  if (locale === 'en' && cookieLocale === 'fr' && !req.nextUrl.searchParams.has('lang')) {
    const url = req.nextUrl.clone();
    url.pathname = localizeHref(path, 'fr');
    return NextResponse.redirect(url);
  }

  const headers = new Headers(req.headers);
  headers.set(LOCALE_HEADER, locale);
  headers.set(PATH_HEADER, path);

  let res: NextResponse;
  if (locale === 'fr') {
    const url = req.nextUrl.clone();
    url.pathname = path;
    url.search = search;
    res = NextResponse.rewrite(url, { request: { headers } });
  } else {
    res = NextResponse.next({ request: { headers } });
  }
  if (cookieLocale !== locale) {
    res.cookies.set(LOCALE_COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  }
  return res;
}

export const config = {
  // Everything except Next internals, static files and non-admin API routes.
  matcher: ['/((?!_next/|api/(?!admin)|.*\\.[a-zA-Z0-9]{2,5}$).*)'],
};
