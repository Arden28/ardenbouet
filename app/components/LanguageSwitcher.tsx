'use client';
// Switches language by navigating to the same page under the other locale's URL.
import { useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Check, Languages } from 'lucide-react';
import { useLocale } from '../I18nProvider';
import { LOCALES, LOCALE_LABELS, localizeHref, splitLocale, type Locale } from '@/lib/i18n/config';

export function LanguageSwitcher({ variant = 'pill' }: { variant?: 'pill' | 'inline' }) {
  const { locale } = useLocale();
  const pathname = usePathname() || '/';
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  const target = (l: Locale) => {
    const sp = new URLSearchParams(params?.toString() ?? '');
    sp.delete('lang');
    if (l === 'en') sp.set('lang', 'en'); // tells middleware not to bounce back to /fr
    const q = sp.toString();
    return localizeHref(splitLocale(pathname).path, l) + (q ? `?${q}` : '') + (typeof window !== 'undefined' ? window.location.hash : '');
  };
  // Full navigation so the root layout (html lang, providers) re-renders in the new locale.
  const go = (l: Locale) => { setOpen(false); if (l !== locale) window.location.assign(target(l)); };

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-1 text-[13px]">
        {LOCALES.map(l => (
          <button
            key={l}
            type="button"
            onClick={() => go(l)}
            aria-current={l === locale}
            className={`rounded-full px-2.5 py-1 ${l === locale ? 'bg-[#242424] text-white' : 'text-[#6b6b6b] hover:text-[#242424]'}`}
          >
            {LOCALE_LABELS[l].short}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label="Switch language"
        className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-[#6b6b6b] transition-colors hover:bg-[#f2f2f2] hover:text-[#242424]"
      >
        <Languages className="h-4 w-4" />
        {LOCALE_LABELS[locale].short}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-40 rounded-md border border-[#f2f2f2] bg-white py-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.12)]">
            {LOCALES.map(l => (
              <button
                key={l}
                type="button"
                onClick={() => go(l)}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-[14px] text-[#6b6b6b] hover:text-[#242424]"
              >
                {LOCALE_LABELS[l].name}
                {l === locale && <Check className="h-4 w-4 text-[#1a8917]" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
