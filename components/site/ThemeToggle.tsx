'use client';
// Light/dark switch: the sun sets below a horizon as the moon rises (and back), and the page
// re-paints with a circular reveal from the button (View Transitions API, with a fallback).
import { useCallback, useEffect, useState } from 'react';

import { THEME_KEY } from '@/lib/theme';

type Theme = 'light' | 'dark';

function current(): Theme {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');
  useEffect(() => {
    setTheme(current());
    const obs = new MutationObserver(() => setTheme(current()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const toggle = useCallback((origin?: { x: number; y: number }) => {
    const next: Theme = current() === 'dark' ? 'light' : 'dark';
    const apply = () => {
      document.documentElement.classList.toggle('dark', next === 'dark');
      try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
    };
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || reduce) { apply(); return; }
    const x = origin?.x ?? window.innerWidth / 2;
    const y = origin?.y ?? 0;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const root = document.documentElement.style;
    root.setProperty('--theme-x', `${x}px`);
    root.setProperty('--theme-y', `${y}px`);
    root.setProperty('--theme-r', `${r}px`);
    doc.startViewTransition(apply);
  }, []);

  return { theme, toggle };
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={e => { const r = e.currentTarget.getBoundingClientRect(); toggle({ x: r.left + r.width / 2, y: r.top + r.height / 2 }); }}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className={`group relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-[#6b6b6b] transition-colors hover:bg-[#f2f2f2] hover:text-[#242424] ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden>
        <defs>
          <clipPath id="theme-horizon"><rect x="0" y="0" width="24" height="18.5" /></clipPath>
        </defs>
        {/* Sun: sinks below the horizon in dark mode */}
        <g clipPath="url(#theme-horizon)">
          <g style={{ transform: dark ? 'translateY(12px)' : 'translateY(0)', transition: 'transform 600ms cubic-bezier(0.65,0,0.35,1)' }}>
            <circle cx="12" cy="13" r="4" />
            <g style={{ transformOrigin: '12px 13px', transform: dark ? 'rotate(-60deg) scale(0.6)' : 'rotate(0) scale(1)', opacity: dark ? 0 : 1, transition: 'transform 600ms ease, opacity 300ms ease' }}>
              <path d="M12 5.5v1.5M5.8 8.2l1 1M18.2 8.2l-1 1M4.5 13H6M18 13h1.5" />
            </g>
          </g>
          {/* Moon: rises from below in dark mode */}
          <g style={{ transform: dark ? 'translateY(0)' : 'translateY(14px)', opacity: dark ? 1 : 0, transition: 'transform 600ms cubic-bezier(0.65,0,0.35,1) 80ms, opacity 300ms ease 80ms' }}>
            <path d="M15.5 6.5a5.5 5.5 0 1 0 2 9.3A6.5 6.5 0 0 1 15.5 6.5Z" />
            <path d="M18.5 4.5v1.6M17.7 5.3h1.6" strokeWidth={1.2} />
          </g>
        </g>
        {/* Horizon */}
        <path d="M3 18.5h18" />
      </svg>
    </button>
  );
}
