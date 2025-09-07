'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useCallback } from 'react';

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" {...props}>
      <path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48l-.01-1.69c-2.78.61-3.37-1.2-3.37-1.2-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.04 1.53 1.04.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.1.63-1.36-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .85-.27 2.8 1.02a9.7 9.7 0 0 1 5.1 0c1.95-1.29 2.8-1.02 2.8-1.02.54 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.69-4.57 4.94.36.31.68.92.68 1.86l-.01 2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/>
    </svg>
  );
}
function LinkedInIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" {...props}>
      <path fill="currentColor" d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8.98h5V24H0zM8.98 8.98H14v2.05h.07c.7-1.33 2.4-2.73 4.93-2.73 5.27 0 6.24 3.47 6.24 7.99V24h-5v-6.66c0-1.59-.03-3.64-2.22-3.64-2.22 0-2.56 1.73-2.56 3.52V24h-5V8.98z"/>
    </svg>
  );
}

function ArrowUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" {...props}>
      <path fill="currentColor" d="M12 4l6 6h-4v8h-4v-8H6l6-6z"/>
    </svg>
  );
}

export const Footer = () => {
  const year = new Date().getFullYear();

  const scrollTop = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <footer
      className="
        relative mx-auto mt-20 max-w-6xl rounded-t-2xl border border-zinc-200/70
        bg-white/80 px-4 py-6 shadow-sm backdrop-blur
        dark:border-zinc-700/50 dark:bg-zinc-900/80
        engineer-grid
      "
      aria-labelledby="site-footer"
    >
      {/* subtle scanline */}
      <div aria-hidden className="scanline absolute inset-0 pointer-events-none rounded-t-2xl" />

      <div id="site-footer" className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Left: brand / owner */}
        <div className="flex items-center gap-3">
          <Image
            src="/images/avatar-1.jpg"
            alt="Arden BOUET avatar"
            width={32}
            height={32}
            className="rounded-full ring-1 ring-zinc-200 dark:ring-zinc-700"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Arden BOUET
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              © {year} • Software & IoT Engineer
            </p>
          </div>
        </div>

        {/* Middle: quick nav */}
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-3 text-sm">
          {[
            { href: '/#projects', label: 'Builds' },
            { href: '/#experience', label: 'Experience' },
            { href: '/#journey', label: 'Journey' },
            { href: '/#contact', label: 'Contact' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="
                rounded-md border border-transparent px-2 py-1 text-zinc-700 underline-offset-2
                hover:border-zinc-200 hover:bg-white hover:underline
                dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900
              "
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right: socials + to-top */}
        <div className="flex items-center gap-2">
          <Link
            href="https://github.com/arden28"
            target="_blank"
            aria-label="GitHub"
            className="
              inline-flex h-9 w-9 items-center justify-center rounded-full border
              border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50
              dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800
            "
          >
            <GithubIcon className="text-[color:var(--brand)] h-[20px]" />
          </Link>
          <Link
            href="https://www.linkedin.com/in/arden-bouet/"
            target="_blank"
            aria-label="LinkedIn"
            className="
              inline-flex h-9 w-9 items-center justify-center rounded-full border
              border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50
              dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800
            "
          >
            <LinkedInIcon className="text-[color:var(--brand)] h-[20px]" />
          </Link>
          <button
            type="button"
            onClick={scrollTop}
            className="
              ml-2 inline-flex items-center gap-2 rounded-full border border-zinc-200/80
              bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition
              hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]
              dark:border-zinc-700/60 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800
            "
            aria-label="Back to top"
          >
            <ArrowUpIcon className="text-[color:var(--brand)]" />
            Top
          </button>
        </div>
      </div>

      {/* bottom micro-row */}
      <div className="mt-4 flex flex-col items-start justify-between gap-2 border-t border-zinc-200 pt-4 text-xs text-zinc-600 dark:border-zinc-700 dark:text-zinc-400 sm:flex-row">
        <p>Built with Next.js, Laravel APIs, and a dash of telemetry.</p>
        <p className="opacity-80">
          Nairobi • East Africa
        </p>
      </div>
    </footer>
  );
};
