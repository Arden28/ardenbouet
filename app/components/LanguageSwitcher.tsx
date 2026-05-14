'use client';

import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const current = i18n.language?.startsWith('fr') ? 'FR' : 'EN';

  const select = (lng: string) => {
    i18n.changeLanguage(lng);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label="Switch language"
        className={[
          'inline-flex h-8 items-center gap-1.5 border px-2.5',
          'font-mono text-[11px] uppercase tracking-widest',
          'transition-colors duration-150 focus-visible:outline-none',
          open
            ? 'border-[#2467AC] text-[#2467AC]'
            : 'border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-200 dark:hover:text-zinc-100',
        ].join(' ')}
      >
        <Globe className="h-3.5 w-3.5" />
        {current}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-36 border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            {(['en', 'fr'] as const).map(lng => {
              const active = i18n.language?.startsWith(lng);
              return (
                <button
                  key={lng}
                  type="button"
                  onClick={() => select(lng)}
                  className={[
                    'flex w-full items-center gap-2.5 px-3 py-2.5',
                    'font-mono text-[11px] uppercase tracking-widest transition-colors',
                    active
                      ? 'bg-[#2467AC] text-white'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100',
                  ].join(' ')}
                >
                  <span aria-hidden>{lng === 'en' ? '🇬🇧' : '🇫🇷'}</span>
                  {lng === 'en' ? 'English' : 'Français'}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
