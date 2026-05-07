'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

// ─── Motion ──────────────────────────────────────────────────────────────────
const EXPO = [0.16, 1, 0.3, 1] as const;

// ─── Live EAT clock ───────────────────────────────────────────────────────────
/*
  Nairobi is UTC+3 (East Africa Time, no DST).
  Ticks every second — a subtle signal that this portfolio is alive.
*/
function EATClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      // Add 3h offset to get UTC+3
      const eat = new Date(now.getTime() + 3 * 60 * 60 * 1000);
      const hh  = eat.getUTCHours().toString().padStart(2, '0');
      const mm  = eat.getUTCMinutes().toString().padStart(2, '0');
      const ss  = eat.getUTCSeconds().toString().padStart(2, '0');
      setTime(`${hh}:${mm}:${ss}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="font-mono text-sm tabular-nums tracking-wider text-zinc-400">
      {time || '--:--:--'}
    </span>
  );
}

// ─── Dark magnetic link ───────────────────────────────────────────────────────
/*
  Same magnetic mechanic as Contact.tsx but styled for the dark footer.
  The inner icon/child pulls toward the cursor; the border stays fixed.
*/
function MagneticSocial({
  href,
  label,
  external = true,
  children,
}: {
  href: string;
  label: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 240, damping: 22 });
  const sy = useSpring(y, { stiffness: 240, damping: 22 });

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.4);
    y.set((e.clientY - r.top - r.height / 2) * 0.4);
  };
  const onMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <div
      ref={wrapRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative"
    >
      <Link
        href={href}
        aria-label={label}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={[
          'inline-flex h-9 w-9 items-center justify-center',
          'border border-zinc-700',
          'text-zinc-500',
          'hover:border-zinc-300 hover:text-zinc-100',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400',
        ].join(' ')}
      >
        <motion.span
          style={{ x: sx, y: sy }}
          className="inline-flex items-center justify-center"
        >
          {children}
        </motion.span>
      </Link>
    </div>
  );
}

// ─── GitHub SVG ──────────────────────────────────────────────────────────────
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

// ─── LinkedIn SVG ─────────────────────────────────────────────────────────────
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8.98h5V24H0zM8.98 8.98H14v2.05h.07c.7-1.33 2.4-2.73 4.93-2.73 5.27 0 6.24 3.47 6.24 7.99V24h-5v-6.66c0-1.59-.03-3.64-2.22-3.64-2.22 0-2.56 1.73-2.56 3.52V24h-5V8.98z"
      />
    </svg>
  );
}

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV = [
  { href: '/#projects',   label: 'Projects'   },
  { href: '/#experience', label: 'Experience' },
  { href: '/#journey',    label: 'Journey'    },
  { href: '/#contact',    label: 'Contact'    },
  { href: '/blog',        label: 'Blog'       },
];

// ─── Main component ───────────────────────────────────────────────────────────
export const Footer = () => {
  const year = new Date().getFullYear();

  const scrollTop = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    /*
      Dark footer (#0A0A0A) as the definitive "closing act".
      No max-w on the outer shell — full bleed dark bg.
      The #2467AC 2px rule at the top is the visual bridge: it matches
      the Header's scroll-progress bar, creating a design loop.
    */
    <footer className="mt-0 bg-[#0A0A0A]" role="contentinfo" aria-labelledby="footer-brand">

      {/* ── LIME ACCENT RULE — echoes the Header progress bar ──────── */}
      <div aria-hidden className="h-[2px] w-full bg-[#2467AC]" />

      <div className="mx-auto max-w-6xl px-4">

        {/* ── ROW 1: Brand colophon + clock/location ──────────────────── */}
        {/*
          "ARDEN / BOUET" in large display type — the colophon.
          The oversized name is both a design element and a brand signature.
          Right side: live EAT clock + location coordinates.
        */}
        <div className="flex flex-col gap-10 py-12 lg:flex-row lg:items-end lg:justify-between">

          {/* Brand block */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.75, ease: EXPO }}
          >
            {/* Large colophon type */}
            <p
              id="footer-brand"
              className={[
                'font-heading font-black uppercase tracking-tighter leading-[0.85]',
                'text-[3.5rem] sm:text-[4.5rem] lg:text-[5rem]',
                'text-zinc-100',
                'select-none',
              ].join(' ')}
              aria-label="Arden Bouet"
            >
              Arden<br />Bouet
            </p>

            {/* Role + location */}
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Software Engineer · Full-Stack
            </p>

            {/* Availability */}
            <div className="mt-2 flex items-center gap-1.5">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#2467AC]" />
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Available for new projects
              </p>
            </div>

            {/* Social links — magnetic */}
            <div className="mt-6 flex items-center gap-2">
              <MagneticSocial href="https://github.com/arden28" label="GitHub">
                <GitHubIcon className="h-4 w-4" />
              </MagneticSocial>
              <MagneticSocial href="https://www.linkedin.com/in/arden-bouet/" label="LinkedIn">
                <LinkedInIcon className="h-4 w-4" />
              </MagneticSocial>
              <MagneticSocial href="https://www.upwork.com/freelancers/~01b718c179049bbd70" label="Upwork">
                <img src="/images/upwork.svg" alt="" className="h-3.5 w-3.5 opacity-50 hover:opacity-100 transition-opacity" />
              </MagneticSocial>
            </div>
          </motion.div>

          {/* Clock + location block — right */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: EXPO, delay: 0.15 }}
            className="flex flex-col items-start gap-2 lg:items-end"
          >
            {/* Live EAT clock — shows the portfolio owner's local time */}
            <div className="flex items-center gap-2">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#2467AC] opacity-60" />
              <EATClock />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">
              East Africa Time · UTC +3
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-700">
              1.2921° S, 36.8219° E
            </p>
          </motion.div>
        </div>

        {/* ── RULED DIVIDER ─────────────────────────────────────────── */}
        <div aria-hidden className="h-px w-full bg-zinc-800" />

        {/* ── ROW 2: Nav + Back to top ─────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-5">
          <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'font-mono text-[10px] uppercase tracking-widest',
                  'text-zinc-500 hover:text-zinc-100',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:text-zinc-100',
                ].join(' ')}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Back to top — simple monospace text with upward arrow */}
          <button
            type="button"
            onClick={scrollTop}
            aria-label="Back to top"
            className={[
              'group flex items-center gap-1.5',
              'font-mono text-[10px] uppercase tracking-widest',
              'text-zinc-600 hover:text-zinc-100',
              'transition-colors duration-150',
              'focus-visible:outline-none focus-visible:text-zinc-100',
            ].join(' ')}
          >
            {/* Arrow animates up on hover */}
            <span
              aria-hidden
              className="inline-block transition-transform duration-200 group-hover:-translate-y-0.5"
            >
              ↑
            </span>
            Back to top
          </button>
        </div>

        {/* ── RULED DIVIDER ─────────────────────────────────────────── */}
        <div aria-hidden className="h-px w-full bg-zinc-800" />

        {/* ── ROW 3: Copyright micro-row ─────────────────────────────── */}
        <div className="flex flex-col items-start justify-between gap-2 py-4 sm:flex-row sm:items-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-700">
            © {year} Arden Bouetoumoussa
          </p>
          <div className="flex items-center gap-5">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-700">
              Built with Next.js
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-700">
              Nairobi · East Africa
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};