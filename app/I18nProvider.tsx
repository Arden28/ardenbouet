'use client';
// Pins react-i18next to the request locale (from the URL) and exposes locale-aware hrefs.
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { localizeHref, type Locale } from '@/lib/i18n/config';

const LocaleCtx = createContext<Locale>('en');

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  // A clone per locale: the base instance is a module singleton shared by concurrent SSR requests.
  const instance = useMemo(() => i18n.cloneInstance({ lng: locale, initAsync: false }), [locale]);
  return (
    <LocaleCtx.Provider value={locale}>
      <I18nextProvider i18n={instance}>{children}</I18nextProvider>
    </LocaleCtx.Provider>
  );
}

/** Current locale + `href()` that adds the /fr prefix when needed. */
export function useLocale() {
  const locale = useContext(LocaleCtx);
  return useMemo(() => ({ locale, href: (path: string) => localizeHref(path, locale) }), [locale]);
}
