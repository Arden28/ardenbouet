'use client';
import '../i18n';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { GithubIcon } from './icons/GithubIcon';
import { LinkedinIcon } from './icons/LinkedinIcon';
import LivewireIcon from "./icons/LivewireIcon";
import CpanelIcon from "./icons/CpanelIcon";
import StackIcon from "tech-stack-icons";
import AnimatedTitle from "./AnimatedTitle";

/** Simple Upwork glyph (mono, accessible) */
function UpworkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" {...props}>
      <path fill="currentColor" d="M7.7 6c1.6 0 2.9 1.3 3.1 3.3.2-.2.4-.5.6-.8.5-.7 1-1.5 1.4-2.4h2.1c-.5 1.4-1.2 2.7-2 3.8 1 .8 2.1 1.2 3.3 1.2 1.2 0 2.1-.7 2.1-1.8 0-1.1-.8-1.8-2-1.8-.7 0-1.4.2-1.9.5l-.5-1.8c.8-.3 1.7-.5 2.6-.5 2.5 0 4.2 1.6 4.2 3.9 0 2.4-1.8 4-4.3 4-1.6 0-3-.5-4.2-1.5-.6.7-1.2 1.3-1.7 1.6v3.9H7.9V12c0-1.2-.6-1.9-1.5-1.9S5 10.7 5 12.1V18H3V9.1h2v.9C5.5 7.9 6.4 6 7.7 6Z"/>
    </svg>
  );
}

export const Hero = () => {
  const { t } = useTranslation();

  // Parallax tilt (soft, disabled on very small screens)
  const cardRef = useRef<HTMLDivElement|null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, dz: 0 });
  useEffect(() => {
    const el = cardRef.current;
    if (!el || window.innerWidth < 480) return; // prevent tiny-screen overflow/jitter
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const ry = (x - 0.5) * 8;
      const rx = (0.5 - y) * 6;
      const dz = Math.min(Math.hypot(x - 0.5, y - 0.5) * 6, 8);
      setTilt({ rx, ry, dz });
    };
    const onLeave = () => setTilt({ rx: 0, ry: 0, dz: 0 });
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, []);

  return (
    <section
      id="about"
      aria-label={t('hero.aria') || 'About Arden'}
      className="relative mx-auto mt-10 max-w-6xl px-4 sm:mt-16 lg:mt-20 overflow-hidden" /* prevent bg overflow on mobile */
    >
      {/* Background accents (smaller on mobile, no overflow) */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-10 -left-24 h-40 w-40 sm:h-56 sm:w-56 rounded-full bg-gradient-to-tr from-sky-500/15 to-violet-500/15 blur-3xl animate-blob" />
        <div className="absolute bottom-0 -right-16 h-44 w-44 sm:h-60 sm:w-60 rounded-full bg-gradient-to-tr from-fuchsia-500/12 to-amber-500/12 blur-3xl animate-blob" />
      </div>

      <div className="grid grid-cols-1 items-center gap-y-8 lg:grid-cols-2 lg:gap-x-10">
        {/* Portrait with tilt */}
        <div className="flex justify-center lg:justify-start lg:pl-8">
          <div
            ref={cardRef}
            style={{ transformStyle: 'preserve-3d', perspective: '800px' }}
            className="relative w-36 xs:w-40 sm:w-52 md:w-64 lg:w-72"
          >
            <div
              className="rounded-2xl border border-zinc-400/10 bg-zinc-50 p-1 shadow-sm transition-transform duration-300 dark:border-zinc-700/50 dark:bg-zinc-800"
              style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(${tilt.dz}px)` }}
            >
              <Image
                src="/images/profile-1.jpg"
                alt={t('hero.alt.profile') || 'Arden BOUET portrait'}
                className="rounded-2xl object-cover"
                width={600}
                height={600}
                sizes="(max-width: 640px) 62vw, (max-width: 1024px) 40vw, 320px"
                priority
                fetchPriority="high"
              />
            </div>
            {/* moving highlight (subtle) */}
            <div className="pointer-events-none absolute -right-6 top-6 h-1 w-24 sm:w-28 rounded-full bg-gradient-to-r from-sky-500/70 to-blue-500/70 animate-sweep" />
          </div>
        </div>

        {/* Text */}
        <div className="text-center lg:text-left">
          {/* Role badge */}
          <div className="animate-fade-in mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-300/60 bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-800 backdrop-blur dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200">
            <span className="inline-block h-2 w-2 rounded-full bg-sky-500" />
            {t('hero.role', { defaultValue: 'Software & IoT Developer' })}
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in font-heading text-[1.75rem] sm:text-4xl font-bold leading-tight tracking-tight">
            <span className="relative inline-block">
              <span className="relative z-10">
                <AnimatedTitle /> {t('hero.title.openSource')}
              </span>
              <span
                aria-hidden
                className="absolute inset-0 -z-0 bg-gradient-to-r from-sky-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent animate-shimmer-once bg-length-200"
              />
            </span>
          </h1>

          {/* Tagline */}
          <p className="animate-fade-in mt-3 mx-auto max-w-xl text-pretty text-zinc-700 dark:text-zinc-300" dangerouslySetInnerHTML={{ __html: t('hero.description.phrase1') }}>
          </p>

          {/* Chips */}
          <ul className="animate-fade-in mt-4 flex list-none flex-wrap items-center justify-center gap-2 p-0 lg:justify-start">
            <li className="rounded-md border border-zinc-300/60 bg-white/70 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
              Nairobi • East Africa
            </li>
            <li className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
              12+ shipped projects
            </li>
            <li className="rounded-md bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-700 dark:text-sky-300">
              Realtime • Cloud • Embedded
            </li>
          </ul>

          {/* CTAs + Socials (added Upwork) */}
          <div className="animate-fade-in mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Button asChild size="lg" className="px-5">
              <Link href="#projects" className="focus-ring">{t('hero.cta.primary', { defaultValue: 'See my projects' })}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-5">
              <Link href="#contact" className="focus-ring">{t('hero.cta.secondary', { defaultValue: "Let's talk" })}</Link>
            </Button>

            <div className="ml-1 flex items-center gap-3">
              <Link
                href="https://github.com/arden28"
                aria-label="GitHub"
                className="focus-ring group inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300/70 bg-white/70 backdrop-blur transition hover:scale-105 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <GithubIcon className="h-5 w-5 opacity-80 group-hover:opacity-100" />
              </Link>
              <Link
                href="https://www.linkedin.com/in/arden-bouet/"
                aria-label="LinkedIn"
                className="focus-ring group inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300/70 bg-white/70 backdrop-blur transition hover:scale-105 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <LinkedinIcon className="h-5 w-5 opacity-80 group-hover:opacity-100" />
              </Link>
              <Link
                href="https://www.upwork.com/freelancers/~01b718c179049bbd70" /* <- Upwork profile */
                aria-label="Upwork"
                className="focus-ring group inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300/70 bg-white/70 backdrop-blur transition hover:scale-105 dark:border-zinc-700 dark:bg-zinc-800"
              >
                <img src="images/upwork.svg" alt="" className="opacity-80 group-hover:opacity-100 text-[color:var(--brand,#2467AC)] h-[20px]" />
                {/* <UpworkIcon className="opacity-80 group-hover:opacity-100 text-[color:var(--brand,#2467AC)]" /> */}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Two-line marquee: Stacks + Solutions */}
      <div className="mt-10 rounded-2xl border border-zinc-200/70 p-4 dark:border-zinc-700/50">
        <h2 className="mb-2 text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-black to-sky-500 dark:from-white dark:to-sky-400">
          {t('hero.stack', { defaultValue: 'Tech I enjoy' })}
        </h2>

        {/* Line 1 — Stacks (icons) */}
        <div
          className="pause-on-hover relative mx-auto overflow-hidden"
          aria-label={t('hero.stackAria') || 'Technology carousel'}
          tabIndex={0}
          role="group"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          }}
        >
          <div className="flex w-max items-center gap-8 animate-marquee">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-8 py-1">
                <StackIcon name="laravel" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <LivewireIcon name="livewire" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="reactjs" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="nodejs" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="python" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="js" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="tailwindcss" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="mysql" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="prisma" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="docker" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="redis" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="aws" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="postman" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="gcloud" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <CpanelIcon name="cpanel" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="openai" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="lovable" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="supabase" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="wordpress" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Line 2 — Solutions (text chips, reverse scroll) */}
        <div
          className="pause-on-hover relative mx-auto mt-3 overflow-hidden"
          aria-label="Solutions carousel"
          tabIndex={0}
          role="group"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
            maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          }}
        >
          <div className="flex w-max items-center gap-3 animate-marquee-reverse">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                {[
                  'Subscriptions & Billing',
                  'Multi-tenant SaaS',
                  'Booking & Inventory',
                  'Maps & Geolocation',
                  'PDF pipelines',
                  'IoT telemetry',
                  'Admin dashboards',
                  'RBAC & audit logs',
                  'Payments/Stripe',
                  'Webhooks & events',
                ].map((label) => (
                  <span
                    key={label + i}
                    className="rounded-full border border-zinc-200/70 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700/50 dark:bg-zinc-900 dark:text-zinc-200"
                  >
                    {label}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
