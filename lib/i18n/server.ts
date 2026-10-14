// lib/i18n/server.ts — server-side translation + localized links.
import 'server-only';
// Server-side i18next instance: same resources as the client, but no react-i18next
// (it calls createContext at import, which server components don't allow).
import i18next from 'i18next';
import { getLocale, getPathname } from '@/lib/serverT';
import { LOCALES, localizeHref, type Locale } from './config';
import { resources } from './resources';

export { getLocale, getPathname };

const i18n = i18next.createInstance();
i18n.init({ lng: 'en', initAsync: false, resources, fallbackLng: 'en', supportedLngs: ['en', 'fr'], interpolation: { escapeValue: false } });

/** i18next `t` fixed to the request locale (same resources as client components). */
export function getT(locale: Locale = getLocale()) {
  return i18n.getFixedT(locale);
}

export function lhref(path: string, locale: Locale = getLocale()) {
  return localizeHref(path, locale);
}

/** Metadata `alternates` with hreflang links for the current (or given) path. */
export function alternates(path: string = getPathname(), canonicalLocale: Locale = getLocale()) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://ardenbouet.me').replace(/\/$/, '');
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = site + localizeHref(path, l);
  languages['x-default'] = site + localizeHref(path, 'en');
  return { canonical: site + localizeHref(path, canonicalLocale), languages };
}
