'use client';
import '../i18n';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { LanguageSwitcher } from './LanguageSwitcher';

type NavItem = { href: string; key: string; label?: string };

function UpworkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" {...props}>
      <path
        fill="currentColor"
        d="M7.7 6c1.6 0 2.9 1.3 3.1 3.3.2-.2.4-.5.6-.8.5-.7 1-1.5 1.4-2.4h2.1c-.5 1.4-1.2 2.7-2 3.8 1 .8 2.1 1.2 3.3 1.2 1.2 0 2.1-.7 2.1-1.8 0-1.1-.8-1.8-2-1.8-.7 0-1.4.2-1.9.5l-.5-1.8c.8-.3 1.7-.5 2.6-.5 2.5 0 4.2 1.6 4.2 3.9 0 2.4-1.8 4-4.3 4-1.6 0-3-.5-4.2-1.5-.6.7-1.2 1.3-1.7 1.6v3.9H7.9V12c0-1.2-.6-1.9-1.5-1.9S5 10.7 5 12.1V18H3V9.1h2v.9C5.5 7.9 6.4 6 7.7 6Z"
      />
    </svg>
  );
}

export const Header = () => {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState<string>('#about');

  // measure header height so we can offset the scroll
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerH, setHeaderH] = useState<number>(72); // sensible default

  useEffect(() => {
    const el = headerRef.current;
    const measure = () => {
      if (!el) return;
      const nav = el.querySelector('nav') as HTMLElement | null;
      setHeaderH((nav?.offsetHeight ?? 0) + 2); // +2 for the top progress bar
    };
    measure();
    window.addEventListener('resize', measure);
    const ro = new ResizeObserver(measure);
    if (el) ro.observe(el);
    return () => {
      window.removeEventListener('resize', measure);
      ro.disconnect();
    };
  }, []);

  const nav: NavItem[] = useMemo(
    () => [
      { href: '/#projects', key: 'menu.projects', label: t('menu.projects') },
      { href: '/#experience', key: 'menu.experience', label: t('menu.experience', { defaultValue: 'Experience' }) },
      { href: '/#journey', key: 'menu.journey', label: t('menu.journey') },
      { href: '/#contact', key: 'menu.contact', label: t('menu.contact') },
    ],
    [t]
  );

  // Sticky chrome + scroll progress
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 6);
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setProgress(max > 0 ? (y / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Section active link (IntersectionObserver)
  useEffect(() => {
    const ids = ['about', 'projects', 'experience', 'journey', 'contact'];
    const els = ids
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(`#${visible.target.id}`);
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Smooth scroll helper with header offset
  const smoothScrollToHash = (hash: string) => {
    const id = hash.replace(/^#/, '');
    const el = document.getElementById(id);
    if (!el) return;

    const top =
      el.getBoundingClientRect().top +
      window.scrollY -
      Math.max(0, headerH);

    window.scrollTo({ top, behavior: 'smooth' });

    // update URL hash without instant jump
    history.pushState(null, '', `#${id}`);
  };

  // Handle initial hash on page load (do it after layout paint)
  useEffect(() => {
    if (location.hash && document.getElementById(location.hash.slice(1))) {
      // small delay to ensure layout is stable
      setTimeout(() => smoothScrollToHash(location.hash), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <header
      ref={headerRef}
      className={['sticky top-0 z-50', 'mx-auto w-full'].join(' ')}
      role="banner"
    >
      {/* slim brand progress */}
      <div aria-hidden className="h-[2px] w-full bg-transparent" style={{ position: 'relative' }}>
        <div
          className="h-[2px]"
          style={{
            width: `${progress}%`,
            background: 'var(--brand, #2467AC)',
            transition: 'width .15s linear',
          }}
        />
      </div>

      <nav
        className={[
          'mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:py-4',
          'transition-all',
          scrolled
            ? 'rounded-b-2xl border border-zinc-200/70 bg-white/80 shadow-sm backdrop-blur dark:border-zinc-700/50 dark:bg-zinc-900/70'
            : '',
        ].join(' ')}
        aria-label="Primary"
      >
        {/* Brand */}
        <Link href="/" className="group flex items-center gap-3">
          {/* <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-zinc-900/5 shadow-zinc-800/5 shadow-sm dark:ring-white/10 overflow-hidden">
            <Image
              src="/images/avatar-1.jpg"
              alt="Arden BOUET"
              width={40}
              height={40}
              className="rounded-full object-cover"
              priority
            />
          </span> */}
          <span className="hidden text-sm font-semibold text-zinc-900 group-hover:no-underline dark:text-zinc-100 sm:inline">
            Arden BOUET
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-4 sm:flex">
          <ul
            className="
              flex items-center gap-1 rounded-full border border-zinc-200/70 bg-white/70 px-1 py-1 text-sm shadow-sm backdrop-blur
              dark:border-zinc-700/50 dark:bg-zinc-900/60
            "
          >
            {nav.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    smoothScrollToHash(item.href);
                  }}
                  className={['nav-chip', active === item.href ? 'is-active' : ''].join(' ')}
                >
                  <span className="nav-ink">{item.label}</span>
                </Link>
              </li>
            ))}
            <li>
              <a
                href="/files/cv-v4.pdf"
                className="nav-chip !border-[color:var(--brand,#2467AC)] !text-[color:var(--brand,#2467AC)] hover:!bg-[color:var(--brand,#2467AC)] hover:!text-white"
              >
                {t('menu.cv')}
              </a>
            </li>
          </ul>

          {/* Right block: socials + i18n */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link href="https://github.com/arden28" aria-label="GitHub" className="icon-btn">
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48l-.01-1.69c-2.78.61-3.37-1.2-3.37-1.2-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.04 1.53 1.04.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.1.63-1.36-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .85-.27 2.8 1.02a9.7 9.7 0 0 1 5.1 0c1.95-1.29 2.8-1.02 2.8-1.02.54 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.69-4.57 4.94.36.31.68.92.68 1.86l-.01 2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"
                />
              </svg>
            </Link>
            <a
              href="mailto:laudbouetoumoussa@gmail.com"
              className="ml-1 rounded-full border border-zinc-200/80 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand,#2467AC)] dark:border-zinc-700/60 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Mail
            </a>
          </div>
        </div>

        {/* Mobile: burger + i18n */}
        <div className="flex items-center gap-2 sm:hidden">
          <LanguageSwitcher />
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle menu"
            className="icon-btn"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
              <path fill="currentColor" d="M5 6.5H19V8H5zM5 11.5H19V13H5zM5 16.5H19V18H5z" />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile sheet */}
      <div
        id="mobile-menu"
        className={[
          'mx-auto max-w-6xl px-4',
          'sm:hidden',
          'transition-[max-height,opacity] duration-300 ease-out',
          menuOpen ? 'max-h-[420px] opacity-100' : 'max-h-0 opacity-0',
          'overflow-hidden',
        ].join(' ')}
      >
        <div className="mt-2 rounded-2xl border border-zinc-200/70 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-zinc-700/50 dark:bg-zinc-900/70">
          <ul className="flex flex-col gap-1">
            {nav.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    smoothScrollToHash(item.href);
                    setMenuOpen(false);
                  }}
                  className={[
                    'block rounded-lg px-3 py-2 text-sm',
                    active === item.href
                      ? 'text-[color:var(--brand,#2467AC)] bg-[color:var(--brand-soft,#2467AC1F)]'
                      : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60',
                  ].join(' ')}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-1 flex flex-wrap items-center gap-2">
              <a href="/files/cv-v4.pdf" className="chip-outline">CV</a>
              <a href="mailto:laudbouetoumoussa@gmail.com" className="chip-outline">Mail</a>
              <Link href="https://github.com/arden28" className="chip-outline">GitHub</Link>
              <Link href="https://www.linkedin.com/in/ardenbouet/" className="chip-outline">LinkedIn</Link>
              <Link href="https://www.upwork.com/freelancers/~01abcdef0123456789" className="chip-outline">Upwork</Link>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};
