// lib/i18n/config.ts — locale routing rules shared by middleware, server and client (pure module).
//
// English lives at the unprefixed URLs (/blog/x); French under /fr (/fr/blog/x). Middleware
// rewrites /fr/* to the unprefixed route and passes the locale in the `x-locale` header,
// so every page exists once in app/ and reads its locale with getLocale().

export const LOCALES = ['en', 'fr'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'arden_lang';
export const LOCALE_HEADER = 'x-locale';
export const PATH_HEADER = 'x-pathname'; // unprefixed path, for hreflang / switchers

export const LOCALE_LABELS: Record<Locale, { short: string; name: string }> = {
  en: { short: 'EN', name: 'English' },
  fr: { short: 'FR', name: 'Français' },
};

export function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as readonly string[]).includes(v);
}

/** "/fr/blog/x" → { locale: "fr", path: "/blog/x" } */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const m = pathname.match(/^\/(fr)(?=\/|$)(.*)$/);
  if (m) return { locale: 'fr', path: m[2] || '/' };
  return { locale: DEFAULT_LOCALE, path: pathname || '/' };
}

/** Paths that are never localized (admin, APIs, assets, auth callbacks). */
export function isUnlocalizedPath(path: string): boolean {
  return /^\/(admin|api|_next|images|files|case|favicon|robots|sitemap|download)(\/|$|\.)/.test(path) || /\.[a-z0-9]{2,5}$/i.test(path);
}

/** Prefix an internal href for a locale. External, hash-only and unlocalized hrefs are returned as-is. */
export function localizeHref(href: string, locale: Locale): string {
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const [pathAndQuery, hash = ''] = href.split('#');
  const [path, query = ''] = pathAndQuery.split('?');
  const bare = splitLocale(path).path;
  if (isUnlocalizedPath(bare)) return href;
  const out = locale === DEFAULT_LOCALE ? bare : bare === '/' ? '/fr' : `/fr${bare}`;
  return `${out}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;
}
