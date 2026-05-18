'use client';
import '../i18n';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ─── Types (unchanged) ───────────────────────────────────────────────────────
type ExperienceRow = {
  id: string;
  title: string;
  job: string;
  fromTo: string;
  bullets: string[];
  type: 'Freelance' | 'Contract' | 'Full-time' | 'Part-time' | 'Intern';
  location?: 'On-site' | 'Hybrid' | 'Remote';
  logline?: string;
  outcomes?: string[];
  tags?: string[];
  poster?: string;
};

type Scene = {
  id: string;
  company: string;
  role: string;
  period: string;
  type?: string;
  location?: string;
  logline?: string;
  bullets: string[];
  outcomes?: string[];
  poster?: string;
  tags?: string[];
};

type ContentBundle = {
  projects: unknown[];
  experiences: ExperienceRow[];
  journey: unknown[];
  notes: unknown[];
};

// ─── Motion ──────────────────────────────────────────────────────────────────
const EXPO = [0.16, 1, 0.3, 1] as const;

// ─── Design primitives ───────────────────────────────────────────────────────
function Rule({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}

function OutcomesLabel() {
  const { t } = useTranslation();
  return <>{t('experience.outcomes')}</>;
}

// ─── Single "scene" entry ─────────────────────────────────────────────────────
/*
  Structure:
    [logo 40px] [COMPANY NAME]                    [PERIOD]  [scene counter 01]
                ROLE · TYPE · LOCATION

                "Logline as the defining pull quote"

                — Bullet one
                — Bullet two

                OUTCOMES
                — Lime-accented outcome one

                STACK: tag · tag · tag
*/
function SceneEntry({ s, index }: { s: Scene; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, ease: EXPO, delay: 0.04 }}
      className="group"
    >
      <Rule />
      <article className="transition-colors duration-200 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40">

        {/* ── Header row — clickable toggle ───────────────────────────── */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex w-full items-start gap-4 py-8 text-left"
        >
          {/* Logo / initials mark */}
          <div className="relative shrink-0">
            {s.poster ? (
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1">
                <Image
                  src={s.poster}
                  alt={`${s.company} logo`}
                  width={36}
                  height={36}
                  className="h-full w-full object-contain"
                  sizes="36px"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center border border-zinc-200 dark:border-zinc-800">
                <span className="font-mono text-[9px] font-bold uppercase text-zinc-400 dark:text-zinc-600">
                  {s.company.slice(0, 2)}
                </span>
              </div>
            )}
          </div>

          {/* Company + role */}
          <div className="flex-1 min-w-0">
            <h3 className="font-heading text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
              {s.role}
            </h3>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {[s.company, s.type, s.location].filter(Boolean).join(' · ')}
            </p>
          </div>

          {/* Period + scene counter + chevron — right-aligned */}
          <div className="flex shrink-0 flex-col items-end gap-1">
            <div className="hidden sm:flex items-center gap-2">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                {s.period}
              </p>
              <span className="font-mono text-[9px] text-zinc-300 dark:text-zinc-700">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <ChevronDown
              className="h-4 w-4 text-zinc-400 transition-transform duration-300"
              style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </div>
        </button>

        {/* ── Period (mobile only) ────────────────────────────────────── */}
        <p className="pl-14 -mt-4 pb-3 font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          {s.period}
        </p>

        {/* ── Logline — always visible ─────────────────────────────────── */}
        {s.logline && (
          <p className="mb-4 max-w-3xl pl-14 text-sm font-medium italic leading-relaxed text-zinc-600 dark:text-zinc-400">
            {s.logline}
          </p>
        )}

        {/* ── Collapsible body ─────────────────────────────────────────── */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: EXPO }}
              className="overflow-hidden"
            >
              <div className="pb-8">
                {/* Bullets */}
                {s.bullets.length > 0 && (
                  <ul className="mt-4 space-y-1.5 pl-14">
                    {s.bullets.map((b, i) => (
                      <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-none bg-zinc-400 dark:bg-zinc-600" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Outcomes */}
                {s.outcomes && s.outcomes.length > 0 && (
                  <div className="mt-5 pl-14">
                    <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
                      <OutcomesLabel />
                    </p>
                    <ul className="space-y-1.5">
                      {s.outcomes.map((o, i) => (
                        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                          <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-[#2467AC]" />
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tech tags */}
                {s.tags && s.tags.length > 0 && (
                  <p className="mt-4 pl-14 font-mono text-[10px] uppercase tracking-widest text-zinc-300 dark:text-zinc-700">
                    {s.tags.join(' · ')}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </article>
    </motion.div>
  );
}

// ─── Resume CTA ───────────────────────────────────────────────────────────────
/*
  Sharp-bordered box — no rounded-md anywhere.
  Buttons match Hero's CTA style: uppercase tracking-widest, square edges.
*/
function ResumeCta() {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease: EXPO }}
      className="mt-12 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600">
            {t('experience.resume.label')}
          </p>
          <h4 className="font-heading text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t('experience.resume.title')}
          </h4>
          <p className="mt-1 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
            {t('experience.resume.desc')}
          </p>
          <div className="mt-3 flex gap-2">
            <span className="border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
              PDF · 1 page
            </span>
            <span className="border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
              {new Date().getFullYear()}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
          <a
            href="/files/cv-v6.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-zinc-900 dark:bg-zinc-50 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors duration-150"
          >
            {t('experience.resume.view')}
          </a>
          <a
            href="/#contact"
            className="inline-flex items-center justify-center border border-zinc-300 dark:border-zinc-700 px-5 py-2.5 text-[11px] font-medium uppercase tracking-widest text-zinc-700 dark:text-zinc-300 hover:border-zinc-900 hover:text-zinc-900 dark:hover:border-zinc-200 dark:hover:text-zinc-100 transition-colors duration-150"
          >
            {t('experience.resume.discuss')}
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ExperienceTimeline() {
  const { t } = useTranslation();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    async function load() {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch('/api/content', {
          credentials: 'same-origin',
          cache: 'no-store',
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ContentBundle = await res.json();
        const mapped: Scene[] = (json.experiences || []).map(x => ({
          id: x.id,
          company: x.title,
          role: x.job,
          period: x.fromTo,
          type: x.type,
          location: x.location,
          logline: x.logline || undefined,
          bullets: Array.isArray(x.bullets) ? x.bullets : [],
          outcomes: Array.isArray(x.outcomes) ? x.outcomes : undefined,
          poster: x.poster || undefined,
          tags: Array.isArray(x.tags) ? x.tags : undefined,
        }));
        setScenes(mapped);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setErr(e?.message || 'Failed to load experience');
      } finally {
        setLoading(false);
      }
    }
    void load();
    return () => ctrl.abort();
  }, []);

  return (
    <section id="experience" className="relative mx-auto mt-24 max-w-6xl px-4">

      {/* ── Section header ──────────────────────────────────────────── */}
      <Rule />
      <div className="flex items-baseline justify-between py-4">
        <h2 className="font-heading text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
          {t('experience.title')}
        </h2>
        {!loading && scenes.length > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            {scenes.length} {scenes.length !== 1 ? t('experience.roles') : t('experience.role')}
          </span>
        )}
      </div>
      <Rule />

      {/* ── Loading skeleton ────────────────────────────────────────── */}
      {loading && (
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse border-b border-zinc-200 dark:border-zinc-800 py-8">
              <div className="flex gap-4">
                <div className="h-10 w-10 shrink-0 bg-zinc-100 dark:bg-zinc-800" />
                <div className="flex-1">
                  <div className="mb-2 h-6 w-1/3 bg-zinc-100 dark:bg-zinc-800" />
                  <div className="mb-4 h-3 w-1/4 bg-zinc-100 dark:bg-zinc-800" />
                  <div className="h-3 w-2/3 bg-zinc-100 dark:bg-zinc-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Error state ─────────────────────────────────────────────── */}
      {!!err && !loading && (
        <div className="mt-8 border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
            {t('experience.error')}: {err}
          </p>
        </div>
      )}

      {/* ── Scenes ──────────────────────────────────────────────────── */}
      {!loading && !err && (
        <div>
          {scenes.map((s, i) => (
            <SceneEntry key={s.id} s={s} index={i} />
          ))}
          <Rule />
        </div>
      )}

      {/* ── Resume CTA ──────────────────────────────────────────────── */}
      {!loading && !err && <ResumeCta />}
    </section>
  );
}