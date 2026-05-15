'use client';
import '../i18n';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { Button } from '@/components/ui/button';
import { GithubIcon } from './icons/GithubIcon';
import { LinkedinIcon } from './icons/LinkedinIcon';
import LivewireIcon from './icons/LivewireIcon';
import CpanelIcon from './icons/CpanelIcon';
import StackIcon from 'tech-stack-icons';
import AnimatedTitle from './AnimatedTitle';
import Mapbox from './icons/Mapbox';

// ─── Motion config ──────────────────────────────────────────────────────────
// Custom cubic-bezier for a refined, non-bouncy ease-out-expo feel
const EXPO = [0.16, 1, 0.3, 1] as const;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.75, ease: EXPO } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 1, ease: EXPO } },
};

// Ruled line that draws itself left → right
const revealRule = {
  hidden: { scaleX: 0, originX: '0%' },
  show: { scaleX: 1, originX: '0%', transition: { duration: 1.1, ease: EXPO } },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Thin ruled line that animates in */
function Rule({ className = '' }: { className?: string }) {
  return (
    <motion.div
      variants={revealRule}
      className={`h-px w-full bg-zinc-200 dark:bg-zinc-800 ${className}`}
    />
  );
}

/** Single stat — large mono number with a label */
function Stat({ number, label }: { number: string; label: string }) {
  return (
    <motion.div variants={fadeUp} className="flex flex-col gap-0.5 pl-4 border-l border-zinc-300 dark:border-zinc-700">
      <span className="font-mono text-2xl font-bold leading-none tracking-tight text-zinc-900 dark:text-zinc-50">
        {number}
      </span>
      <span className="text-[10px] uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
        {label}
      </span>
    </motion.div>
  );
}

/** Social icon link — square, sharp-cornered */
function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={[
        'inline-flex h-9 w-9 items-center justify-center',
        'border border-zinc-300 dark:border-zinc-700',
        'text-zinc-500 dark:text-zinc-400',
        'hover:border-zinc-900 hover:text-zinc-900',
        'dark:hover:border-zinc-200 dark:hover:text-zinc-100',
        'transition-colors duration-200',
      ].join(' ')}
    >
      {children}
    </Link>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export const Hero = () => {
  const { t } = useTranslation();

  // Physics-based tilt for portrait — kept intentionally subtle
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sX = useSpring(mx, { stiffness: 220, damping: 38 });
  const sY = useSpring(my, { stiffness: 220, damping: 38 });
  const rotateX = useTransform(sY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(sX, [-0.5, 0.5], [-4, 4]);

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onMouseLeave = () => { mx.set(0); my.set(0); };

  // ── Solutions chips (no state — static for marquee performance)
  const solutions = [
    'Subscriptions & Billing',
    'Multi-tenant SaaS',
    'Booking & Inventory',
    'Maps & Geolocation',
    'Admin Dashboards',
    'RBAC & Audit Logs',
    'Payments / Stripe',
    'Webhooks & Events',
  ];

  return (
    <section
      id="about"
      aria-label={t('hero.aria') || 'About Arden'}
      className="relative mx-auto mt-10 max-w-6xl px-4 sm:mt-16 lg:mt-24"
    >
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="flex flex-col"
      >

        {/* ── TOP RULE ─────────────────────────────────────────────────── */}
        <Rule />

        {/* ── NAME + ROLE HEADER ROW ───────────────────────────────────── */}
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 py-4"
        >
          {/* Billboard name — purely visual, aria-hidden; h1 is below */}
          <p
            aria-hidden
            className={[
              'font-heading text-[2.6rem] xs:text-3xl sm:text-4xl lg:text-4xl xl:text-6xl',
              'font-black uppercase tracking-tighter leading-[0.9]',
              'text-zinc-900 dark:text-zinc-50',
              'select-none',
            ].join(' ')}
          >
            Arden<br />Bouetoumoussa
          </p>

          {/* Availability badge — sharp pill replaced with an editorial label */}
          <div className="flex flex-col items-start sm:items-end gap-1 shrink-0 pb-1">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] font-mono text-zinc-500 dark:text-zinc-400">
              {/* Electric lime dot — the ONLY accent color in the design */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2467AC] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2467AC]" />
              </span>
              {t('hero.role', { defaultValue: 'Software Engineer' })}
            </span>
            <span className="text-[10px] uppercase tracking-[0.15em] font-mono text-zinc-400 dark:text-zinc-600">
              Nairobi · East Africa
            </span>
          </div>
        </motion.div>

        {/* ── MID RULE ─────────────────────────────────────────────────── */}
        <Rule />

        {/* ── MAIN GRID: portrait / content / stats ────────────────────── */}
        <div
          className={[
            'py-8 grid gap-8',
            'grid-cols-1',
            'sm:grid-cols-[auto_1fr]',
            'lg:grid-cols-[200px_1fr_160px] lg:gap-10',
          ].join(' ')}
        >

          {/* ── PORTRAIT ─────────────────────────────────────────────── */}
          <motion.div
            variants={fadeIn}
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            className="mx-auto sm:mx-0 cursor-pointer self-start"
          >
            <div
              style={{ transform: 'translateZ(12px)' }}
              className={[
                'relative overflow-hidden',
                // Sharp corners — no border-radius
                'border border-zinc-300/80 dark:border-zinc-700',
                // Subtle offset shadow using box-shadow instead of a blob
                'shadow-[4px_4px_0px_0px_theme(colors.zinc.900/8%)]',
                'dark:shadow-[4px_4px_0px_0px_theme(colors.zinc.50/6%)]',
                'w-40 sm:w-[200px]',
              ].join(' ')}
            >
              <Image
                src="/images/me.png"
                alt={t('hero.alt.profile') || 'Arden BOUET'}
                className="object-cover w-full h-auto pointer-events-none"
                width={600}
                height={600}
                priority
              />
              {/* Inner vignette — purely shadow, no gradient */}
              <div className="absolute inset-0 shadow-[inset_0_0_24px_rgba(0,0,0,0.07)] dark:shadow-[inset_0_0_24px_rgba(0,0,0,0.25)] pointer-events-none" />
            </div>
          </motion.div>

          {/* ── TEXT CONTENT ─────────────────────────────────────────── */}
          <motion.div
            variants={stagger}
            className="flex flex-col gap-5 text-center sm:text-left"
          >
            {/* Semantic h1 — uses AnimatedTitle component */}
            <motion.h1
              variants={fadeUp}
              className={[
                'font-heading text-2xl sm:text-3xl font-bold',
                'leading-tight tracking-tight',
                'text-zinc-900 dark:text-zinc-50',
                'flex flex-wrap gap-2 items-baseline justify-center sm:justify-start',
              ].join(' ')}
            >
              <AnimatedTitle />
              <span className="font-normal text-zinc-400 dark:text-zinc-500 text-xl">
                {t('hero.title.openSource')}
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={fadeUp}
              className="text-sm sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto sm:mx-0 text-pretty"
              dangerouslySetInnerHTML={{ __html: t('hero.description.phrase1') }}
            />

            {/* Specialism list — dash-prefixed, no pills */}
            <motion.ul
              variants={fadeUp}
              className={[
                'list-none p-0 m-0',
                'flex flex-wrap gap-x-5 gap-y-1.5',
                'justify-center sm:justify-start',
                'text-[11px] uppercase tracking-[0.12em] font-mono',
                'text-zinc-500 dark:text-zinc-400',
              ].join(' ')}
            >
              {[t('hero.specialism0'), t('hero.specialism1'), t('hero.specialism2'), t('hero.specialism3')].map((s) => (
                <li key={s} className="flex items-center gap-1.5">
                  <span className="text-[#2467AC] leading-none">—</span>
                  {s}
                </li>
              ))}
            </motion.ul>

            {/* ── CTAs + Socials ────────────────────────────────────── */}
            <motion.div
              variants={fadeUp}
              className="flex flex-wrap items-center gap-3 justify-center sm:justify-start"
            >
              {/* Buttons: no border-radius — square, editorial */}
              <Button
                asChild
                size="lg"
                className="rounded-none px-6 uppercase text-[11px] tracking-widest font-semibold"
              >
                <Link href="#projects">
                  {t('hero.cta.primary', { defaultValue: 'See my projects' })}
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-none px-6 uppercase text-[11px] tracking-widest font-semibold"
              >
                <Link href="#contact">
                  {t('hero.cta.secondary', { defaultValue: "Let's talk" })}
                </Link>
              </Button>

              {/* Divider */}
              <div className="h-6 w-px bg-zinc-300 dark:bg-zinc-700 mx-1" />

              {/* Social links */}
              <div className="flex items-center gap-2">
                <SocialLink href="https://github.com/arden28" label="GitHub">
                  <GithubIcon className="h-4 w-4" />
                </SocialLink>
                <SocialLink href="https://www.linkedin.com/in/arden-bouet/" label="LinkedIn">
                  <LinkedinIcon className="h-4 w-4" />
                </SocialLink>
                <SocialLink href="https://www.upwork.com/freelancers/~01b718c179049bbd70" label="Upwork">
                  <img src="images/upwork.svg" alt="" className="h-4 w-4 opacity-80" />
                </SocialLink>
              </div>
            </motion.div>
          </motion.div>

          {/* ── STATS COLUMN (desktop only) ──────────────────────────── */}
          <motion.div
            variants={stagger}
            className={[
              'hidden lg:flex flex-col justify-start gap-6',
              'border-l border-zinc-200 dark:border-zinc-800 pl-8',
            ].join(' ')}
          >
            <Stat number="12+" label={t('hero.stats.projects')} />
            <Stat number="5+"  label={t('hero.stats.years')} />
            <Stat number="3"   label={t('hero.stats.continents')} />

            {/* Index label — decorative type element */}
            <p className="mt-auto text-[9px] uppercase tracking-[0.2em] font-mono text-zinc-300 dark:text-zinc-700">
              Portfolio<br />2025 • v2
            </p>
          </motion.div>
        </div>

        {/* ── BOTTOM RULE ──────────────────────────────────────────────── */}
        <Rule />

        {/* ── TECH STACK MARQUEES ──────────────────────────────────────── */}
        <div className="pt-5 pb-2">

          {/* Section label */}
          <motion.div
            variants={fadeUp}
            className="mb-4 flex items-center justify-between"
          >
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-zinc-400 dark:text-zinc-500">
              {t('hero.stack', { defaultValue: 'Tech I enjoy' })}
            </span>
            <span className="text-[10px] uppercase tracking-[0.15em] font-mono text-zinc-300 dark:text-zinc-700">
              {t('hero.hoverToPause')}
            </span>
          </motion.div>

          {/* Line 1 — Tech icons */}
          <motion.div variants={fadeIn}>
            <div
              className="pause-on-hover relative overflow-hidden"
              style={{
                maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
              }}
            >
              <div className="flex w-max items-center gap-8 animate-marquee">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center gap-8 py-1">
                    {[
                      <StackIcon key="laravel"     name="laravel"     className="w-8 opacity-50 hover:opacity-100 transition-opacity duration-200" />,
                      <LivewireIcon key="livewire"                    className="w-8 opacity-50 hover:opacity-100 transition-opacity duration-200" />,
                      <StackIcon key="reactjs"     name="reactjs"     className="w-8 opacity-50 hover:opacity-100 transition-opacity duration-200" />,
                      <StackIcon key="nodejs"      name="nodejs"      className="w-8 opacity-50 hover:opacity-100 transition-opacity duration-200" />,
                      <StackIcon key="js"          name="js"          className="w-8 opacity-50 hover:opacity-100 transition-opacity duration-200" />,
                      <StackIcon key="tailwindcss" name="tailwindcss" className="w-8 opacity-50 hover:opacity-100 transition-opacity duration-200" />,
                      <StackIcon key="mysql"       name="mysql"       className="w-8 opacity-50 hover:opacity-100 transition-opacity duration-200" />,
                      <StackIcon key="prisma"      name="prisma"      className="w-8 opacity-50 hover:opacity-100 transition-opacity duration-200" />,
                      <Mapbox    key="mapbox"                         className="w-8 opacity-50 hover:opacity-100 transition-opacity duration-200" />,
                      <StackIcon key="docker"      name="docker"      className="w-8 opacity-50 hover:opacity-100 transition-opacity duration-200" />,
                      <StackIcon key="redis"       name="redis"       className="w-8 opacity-50 hover:opacity-100 transition-opacity duration-200" />,
                      <StackIcon key="postman"     name="postman"     className="w-8 opacity-50 hover:opacity-100 transition-opacity duration-200" />,
                      <StackIcon key="gcloud"      name="gcloud"      className="w-8 opacity-50 hover:opacity-100 transition-opacity duration-200" />,
                      <CpanelIcon key="cpanel"                        className="w-8 opacity-50 hover:opacity-100 transition-opacity duration-200" />,
                      <StackIcon key="openai"      name="openai"      className="w-8 opacity-50 hover:opacity-100 transition-opacity duration-200" />,
                      <StackIcon key="supabase"    name="supabase"    className="w-8 opacity-50 hover:opacity-100 transition-opacity duration-200" />,
                      <StackIcon key="wordpress"   name="wordpress"   className="w-8 opacity-50 hover:opacity-100 transition-opacity duration-200" />,
                    ]}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Thin divider between marquee rows */}
          <div className="my-3 h-px w-full bg-zinc-100 dark:bg-zinc-900" />

          {/* Line 2 — Solution chips (sharp monospace tags) */}
          <motion.div variants={fadeIn}>
            <div
              className="pause-on-hover relative overflow-hidden"
              style={{
                maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
              }}
            >
              <div className="flex w-max items-center gap-2 animate-marquee-reverse">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2 py-0.5">
                    {solutions.map((label) => (
                      <span
                        key={label + i}
                        className={[
                          'border border-zinc-200 dark:border-zinc-800',
                          'bg-transparent px-3 py-1',
                          'text-[10px] uppercase tracking-[0.12em] font-mono',
                          'text-zinc-500 dark:text-zinc-400 whitespace-nowrap',
                        ].join(' ')}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

      </motion.div>
    </section>
  );
};