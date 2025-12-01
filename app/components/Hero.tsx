'use client';
import '../i18n';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'; 
import { Button } from '@/components/ui/button';
import { GithubIcon } from './icons/GithubIcon';
import { LinkedinIcon } from './icons/LinkedinIcon';
import LivewireIcon from "./icons/LivewireIcon";
import CpanelIcon from "./icons/CpanelIcon";
import StackIcon from "tech-stack-icons";
import AnimatedTitle from "./AnimatedTitle";
import Mapbox from './icons/Mapbox';

export const Hero = () => {
  const { t } = useTranslation();

  // --- 1. PERFORMANCE OPTIMIZED TILT ---
  // Using MotionValues prevents React Re-renders on every mouse move
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out the mouse values with a spring physics
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  // Transform mouse position into rotation degrees
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [7, -7]); // Up/Down tilt
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-7, 7]); // Left/Right tilt

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate normalized position (-0.5 to 0.5)
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <section
      id="about"
      aria-label={t('hero.aria') || 'About Arden'}
      className="relative mx-auto mt-10 max-w-6xl px-4 sm:mt-16 lg:mt-20 overflow-visible" 
    >
      {/* Background accents */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-10 -left-24 h-40 w-40 sm:h-56 sm:w-56 rounded-full bg-gradient-to-tr from-sky-500/15 to-violet-500/15 blur-3xl animate-blob" />
        <div className="absolute bottom-0 -right-16 h-44 w-44 sm:h-60 sm:w-60 rounded-full bg-gradient-to-tr from-fuchsia-500/12 to-amber-500/12 blur-3xl animate-blob" />
      </div>

      <div className="grid grid-cols-1 items-center gap-y-8 lg:grid-cols-2 lg:gap-x-10">
        
        {/* --- PORTRAIT WITH PHYSICS TILT --- */}
        <div className="flex justify-center lg:justify-start lg:pl-8">
          <motion.div
            style={{ 
                rotateX, 
                rotateY,
                transformStyle: 'preserve-3d',
                perspective: 1000 
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-36 cursor-pointer xs:w-40 sm:w-52 md:w-64 lg:w-72"
          >
            <div
              className="rounded-2xl border border-zinc-400/10 bg-zinc-50 p-1 shadow-xl dark:shadow-sky-900/5 transition-shadow duration-300 dark:border-zinc-700/50 dark:bg-zinc-800"
              style={{ transform: 'translateZ(20px)' }} // Adds depth inside the 3D space
            >
              <Image
                src="/images/profile-1.jpeg"
                alt={t('hero.alt.profile') || 'Arden BOUET portrait'}
                className="rounded-2xl object-cover pointer-events-none" // prevent image drag
                width={600}
                height={600}
                priority
              />
            </div>
            {/* Glossy reflection effect on tilt */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay" />
          </motion.div>
        </div>

        {/* Text */}
        <div className="text-center lg:text-left z-10">
          {/* Role badge */}
          <div className="animate-fade-in mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-300/60 bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-800 backdrop-blur dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
            {t('hero.role', { defaultValue: 'Software Engineer' })}
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in font-heading text-[1.75rem] sm:text-4xl font-bold leading-tight tracking-tight">
            <span className="relative inline-block">
              <span className="relative z-10 flex flex-wrap gap-2 justify-center lg:justify-start">
                 {/* Replaced generic text with optimized AnimatedTitle */}
                <AnimatedTitle /> 
                <span>{t('hero.title.openSource')}</span>
              </span>
              <span
                aria-hidden
                className="absolute inset-0 -z-0 bg-gradient-to-r from-sky-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent animate-shimmer-once bg-length-200"
              />
            </span>
          </h1>

          {/* Tagline */}
          <p className="animate-fade-in mt-3 mx-auto max-w-xl text-pretty text-zinc-700 dark:text-zinc-300 lg:mx-0" dangerouslySetInnerHTML={{ __html: t('hero.description.phrase1') }}>
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

          {/* CTAs + Socials */}
          <div className="animate-fade-in mt-6 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Button asChild size="lg" className="px-5">
              <Link href="#projects" className="focus-ring">{t('hero.cta.primary', { defaultValue: 'See my projects' })}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-5">
              <Link href="#contact" className="focus-ring">{t('hero.cta.secondary', { defaultValue: "Let's talk" })}</Link>
            </Button>

            <div className="ml-1 flex items-center gap-3">
              <Link href="https://github.com/arden28" aria-label="GitHub" className="focus-ring group inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300/70 bg-white/70 backdrop-blur transition hover:scale-105 dark:border-zinc-700 dark:bg-zinc-800">
                <GithubIcon className="h-5 w-5 opacity-80 group-hover:opacity-100" />
              </Link>
              <Link href="https://www.linkedin.com/in/arden-bouet/" aria-label="LinkedIn" className="focus-ring group inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300/70 bg-white/70 backdrop-blur transition hover:scale-105 dark:border-zinc-700 dark:bg-zinc-800">
                <LinkedinIcon className="h-5 w-5 opacity-80 group-hover:opacity-100" />
              </Link>
              <Link href="https://www.upwork.com/freelancers/~01b718c179049bbd70" aria-label="Upwork" className="focus-ring group inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300/70 bg-white/70 backdrop-blur transition hover:scale-105 dark:border-zinc-700 dark:bg-zinc-800">
                <img src="images/upwork.svg" alt="" className="opacity-80 group-hover:opacity-100 h-[20px]" />
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
          style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
        >
          <div className="flex w-max items-center gap-8 animate-marquee">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-8 py-1">
                <StackIcon name="laravel" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <LivewireIcon name="livewire" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="reactjs" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="nodejs" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="js" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="tailwindcss" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="mysql" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="prisma" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <Mapbox name="mapbox" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="docker" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
                <StackIcon name="redis" className="w-10 transition-transform duration-300 hover:-translate-y-1" />
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

        {/* Line 2 — Solutions (text chips) */}
        <div
          className="pause-on-hover relative mx-auto mt-3 overflow-hidden"
          style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
        >
          <div className="flex w-max items-center gap-3 animate-marquee-reverse">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-1">
                {[
                  'Subscriptions & Billing', 'Multi-tenant SaaS', 'Booking & Inventory',
                  'Maps & Geolocation', 'Admin dashboards', 'RBAC & audit logs',
                  'Payments/Stripe', 'Webhooks & events',
                ].map((label) => (
                  <span key={label + i} className="rounded-full border border-zinc-200/70 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700/50 dark:bg-zinc-900 dark:text-zinc-200">
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