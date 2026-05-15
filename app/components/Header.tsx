'use client';
import '../i18n';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LanguageSwitcher } from './LanguageSwitcher';

// ─── Types ──────────────────────────────────────────────────────────────────
type NavItem = { href: string; key: string; label?: string };

// ─── Constants ──────────────────────────────────────────────────────────────
const EXPO = [0.16, 1, 0.3, 1] as const;

// ─── GitHubIcon ─────────────────────────────────────────────────────────────
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48l-.01-1.69c-2.78.61-3.37-1.2-3.37-1.2-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.04 1.53 1.04.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.1.63-1.36-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .85-.27 2.8 1.02a9.7 9.7 0 0 1 5.1 0c1.95-1.29 2.8-1.02 2.8-1.02.54 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.69-4.57 4.94.36.31.68.92.68 1.86l-.01 2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
      />
    </svg>
  );
}

// ─── ArrowIcon (diagonal, for CV link) ──────────────────────────────────────
function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 10" className={className} aria-hidden>
      <path fill="currentColor" d="M1 1h8v8H7.5V3.621L2.56 8.56 1.44 7.44 6.379 2.5H1V1Z" />
    </svg>
  );
}

// ─── Reusable square icon-button ────────────────────────────────────────────
function IconLink({
  href,
  label,
  external = false,
  children,
}: {
  href: string;
  label: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={[
        'inline-flex h-8 w-8 items-center justify-center',
        'border border-zinc-200 dark:border-zinc-800',
        'text-zinc-500 dark:text-zinc-400',
        'hover:border-zinc-900 hover:text-zinc-900',
        'dark:hover:border-zinc-200 dark:hover:text-zinc-100',
        'transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100',
      ].join(' ')}
    >
      {children}
    </Link>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export const Header = () => {
  const { t } = useTranslation();
  const pathname = usePathname();

  const [menuOpen, setMenuOpen]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [progress, setProgress]   = useState(0);
  const [activeSection, setActiveSection] = useState<string>('/#about');

  // ── Scroll progress + sticky chrome ──────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const y   = window.scrollY;
      const h   = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setScrolled(y > 8);
      setProgress(max > 0 ? (y / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Active section via IntersectionObserver (homepage only) ─────────────
  useEffect(() => {
    if (pathname !== '/') return;
    const ids = ['about', 'projects', 'experience', 'journey', 'contact'];
    const els = ids.map(id => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;

    const obs = new IntersectionObserver(
      entries => {
        const top = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (top?.target?.id) setActiveSection(`/#${top.target.id}`);
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [pathname]);

  // ── Close mobile menu on Escape or scroll ────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onScroll = () => setMenuOpen(false);
    window.addEventListener('scroll', onScroll, { passive: true, once: true });
  }, [menuOpen]);

  // ── Nav items ─────────────────────────────────────────────────────────────
  const navItems: NavItem[] = useMemo(() => [
    { href: '/#projects',   key: 'menu.projects',   label: t('menu.projects')  },
    { href: '/#experience', key: 'menu.experience', label: t('menu.experience', { defaultValue: 'Experience' }) },
    { href: '/#journey',    key: 'menu.journey',    label: t('menu.journey')   },
    { href: '/#contact',    key: 'menu.contact',    label: t('menu.contact')   },
    { href: '/blog',        key: 'blog',            label: 'Blog'              },
    { href: '/shop',        key: 'shop',            label: 'Shop'              },
  ], [t]);

  // ── Active check: pathname for page routes, IO state for hash sections ──
  const isItemActive = (item: NavItem) => {
    if (item.href.includes('#')) return pathname === '/' && activeSection === item.href;
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  // ── Shared chrome classes ─────────────────────────────────────────────────
  const chromeCls = scrolled
    ? 'bg-white/95 backdrop-blur-sm dark:bg-zinc-950/95'
    : 'bg-transparent';

  return (
    <header
      className="z-50 w-full"
      role="banner"
    >

      {/* ── PROGRESS BAR ───────────────────────────────────────────────── */}
      <div aria-hidden className="relative h-[2px] w-full">
        <div
          className="absolute left-0 top-0 h-full bg-[#2467AC]"
          style={{ width: `${progress}%`, transition: 'width 0.15s linear' }}
        />
      </div>

      {/* ── MAIN NAV ───────────────────────────────────────────────────── */}
      <nav
        className={[
          'relative mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:py-3.5',
          'transition-[background,border-color,backdrop-filter] duration-300',
          // chromeCls,
          // Flat editorial border on scroll — no rounded pill
          scrolled ? 'border-b border-zinc-200 dark:border-zinc-800' : '',
        ].join(' ')}
        aria-label="Primary navigation"
      >

        {/* ── BRAND / MONOGRAM ─────────────────────────────────────────── */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 focus-visible:outline-none"
          aria-label="Arden BOUET — Home"
        >
          {/*
            Monogram "AB" in a square bordered box.
            Inverts on hover — consistent with the Hero's social link treatment.
          */}
          <span
            aria-hidden
            className={[
              'inline-flex h-8 w-8 items-center justify-center shrink-0',
              'border border-zinc-900 dark:border-zinc-100',
              'font-heading text-[11px] font-black tracking-tight leading-none',
              'text-zinc-900 dark:text-zinc-50',
              'transition-colors duration-150',
              'group-hover:bg-zinc-900 group-hover:text-white',
              'dark:group-hover:bg-zinc-50 dark:group-hover:text-zinc-900',
            ].join(' ')}
          >
            AB
          </span>
          <span className="hidden text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:inline select-none">
            Arden BOUET
          </span>
        </Link>

        {/* ── DESKTOP NAV ──────────────────────────────────────────────── */}
        <div className="hidden items-center gap-5 sm:flex">

          {/* Flat nav links — no pill/capsule container */}
          <ul className="flex items-center" role="list">
            {navItems.map((item) => {
              const isActive = isItemActive(item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={[
                      'relative px-3 py-5 flex items-center',
                      'text-[13px] font-medium tracking-wide',
                      'transition-colors duration-150',
                      'focus-visible:outline-none',
                      isActive
                        ? 'text-zinc-900 dark:text-zinc-50'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
                    ].join(' ')}
                  >
                    {item.label}

                    {/* Sliding underline bar — Framer Motion layoutId creates smooth transition between active links */}
                    {isActive && (
                      <motion.span
                        layoutId="desktop-nav-indicator"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        className="absolute bottom-0 left-1/2 h-[2px] w-5 -translate-x-1/2 bg-[#2467AC]"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Vertical 1px rule — consistent with Hero's ruled-line motif */}
          <div aria-hidden className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

          {/* Action cluster */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />

            <IconLink href="https://github.com/arden28" label="GitHub" external>
              <GitHubIcon className="h-4 w-4" />
            </IconLink>

            {/*
              CV — primary call to action.
              Sharp rectangular border + uppercase tracking mirrors Hero's CTA buttons.
            */}
            <a
              href="/files/cv-v6.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className={[
                'inline-flex items-center gap-1.5',
                'border border-zinc-900 dark:border-zinc-100',
                'px-3 py-1.5',
                'text-[11px] font-semibold uppercase tracking-widest',
                'text-zinc-900 dark:text-zinc-100',
                'hover:bg-zinc-900 hover:text-white',
                'dark:hover:bg-zinc-50 dark:hover:text-zinc-900',
                'transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900',
              ].join(' ')}
            >
              {t('menu.cv')}
              <ArrowUpRightIcon className="h-2.5 w-2.5" />
            </a>
          </div>
        </div>

        {/* ── MOBILE: lang + burger ─────────────────────────────────────── */}
        <div className="flex items-center gap-2 sm:hidden">
          <LanguageSwitcher />

          <button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className={[
              'inline-flex h-9 w-9 items-center justify-center',
              'border border-zinc-200 dark:border-zinc-800',
              'text-zinc-600 dark:text-zinc-400',
              'hover:border-zinc-900 hover:text-zinc-900',
              'dark:hover:border-zinc-200 dark:hover:text-zinc-100',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900',
            ].join(' ')}
          >
            {/* Animated burger → X using CSS transform — three bars */}
            <span className="relative flex h-[14px] w-[18px] flex-col justify-between" aria-hidden>
              <span
                className={[
                  'block h-px w-full origin-center bg-current',
                  'transition-transform duration-300',
                  menuOpen ? 'translate-y-[6.5px] rotate-45' : '',
                ].join(' ')}
              />
              <span
                className={[
                  'block h-px w-full bg-current',
                  'transition-[opacity,transform] duration-200',
                  menuOpen ? 'opacity-0 scale-x-0' : '',
                ].join(' ')}
              />
              <span
                className={[
                  'block h-px w-full origin-center bg-current',
                  'transition-transform duration-300',
                  menuOpen ? '-translate-y-[6.5px] -rotate-45' : '',
                ].join(' ')}
              />
            </span>
          </button>
        </div>
      </nav>

      {/* ── MOBILE MENU PANEL ──────────────────────────────────────────────── */}
      {/*
        Uses max-height transition (vs AnimatePresence) for performance.
        Styled with the same chrome as the nav on scroll.
      */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="false"
        aria-label="Mobile navigation"
        className={[
          'sm:hidden overflow-hidden',
          // Smooth slide-down using max-height
          'transition-[max-height,opacity] ease-[cubic-bezier(0.16,1,0.3,1)]',
          menuOpen ? 'max-h-[600px] opacity-100 duration-500' : 'max-h-0 opacity-0 duration-300',
          // Match nav chrome
          chromeCls,
          'border-b border-zinc-200 dark:border-zinc-800',
        ].join(' ')}
      >
        <div className="mx-auto max-w-6xl px-4 pt-2 pb-8">

          {/* Large typographic nav links — editorial style, NOT small rounded chips */}
          <ul role="list" className="flex flex-col">
            {navItems.map((item) => {
              const isActive = isItemActive(item);

              return (
                <li
                  key={item.href}
                  className="border-b border-zinc-100 dark:border-zinc-900 last:border-0"
                >
                  <Link
                    href={item.href}
                    // Only close the mobile menu on click; no manual preventDefault routing
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={[
                      'flex items-center justify-between py-4',
                      'font-heading text-xl font-bold tracking-tight',
                      'transition-colors duration-150',
                      isActive
                        ? 'text-zinc-900 dark:text-zinc-50'
                        : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200',
                    ].join(' ')}
                  >
                    <span>{item.label}</span>
                    {/* Lime dot on active — consistent with Hero availability indicator */}
                    {isActive && (
                      <span
                        aria-hidden
                        className="h-2 w-2 rounded-full bg-[#2467AC] shrink-0"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Secondary actions — same sharp rectangular style as Hero CTAs */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <a
              href="/files/cv-v6.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className={[
                'inline-flex items-center gap-1.5',
                'border border-zinc-900 dark:border-zinc-100',
                'px-4 py-2 text-[11px] font-semibold uppercase tracking-widest',
                'text-zinc-900 dark:text-zinc-100',
                'hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-50 dark:hover:text-zinc-900',
                'transition-colors duration-150',
              ].join(' ')}
            >
              {t('menu.cv')}
              <ArrowUpRightIcon className="h-2.5 w-2.5" />
            </a>

            {[
              { href: 'mailto:laudbouetoumoussa@gmail.com', label: 'Mail',   external: false },
              { href: 'https://github.com/arden28',         label: 'GitHub', external: true  },
            ].map(({ href, label, external }) => (
              <a
                key={label}
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className={[
                  'inline-flex items-center',
                  'border border-zinc-200 dark:border-zinc-800',
                  'px-4 py-2 text-[11px] font-medium uppercase tracking-widest',
                  'text-zinc-600 dark:text-zinc-400',
                  'hover:border-zinc-900 hover:text-zinc-900',
                  'dark:hover:border-zinc-200 dark:hover:text-zinc-100',
                  'transition-colors duration-150',
                ].join(' ')}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};