'use client';
import '../i18n';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CaseModal from './CaseModal';
import ImageWithFallback from './ImageWithFallback';

// ─── Types ──────────────────────────────────────────────────────────────────
type Project = {
  id: string;
  title: string;
  description: string;
  logoUrl: string;
  url: string;
  tags: Array<'saas' | 'client' | 'open-source' | 'mobile' | 'job'>;
  tech?: string[];
  metric?: string;
  caseFile?: {
    problem: string;
    approach: string[];
    result: string;
    images?: { src: string; alt: string }[];
    tags?: string[];
    tech?: string[];
  };
};

type ContentBundle = {
  projects: Project[];
  experiences: unknown[];
  journey: unknown[];
  notes: unknown[];
};

type Filter = 'all' | 'saas' | 'client' | 'open-source' | 'mobile' | 'job';

// ─── Config ──────────────────────────────────────────────────────────────────
const EXPO = [0.16, 1, 0.3, 1] as const;

// ─── Inline ruled line (consistent with Hero / Header motif) ─────────────────
function Rule() {
  return <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800" />;
}

// ─── Skeleton card ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse border-b border-r border-zinc-200 dark:border-zinc-800 p-6">
      <div className="mb-4 flex items-start justify-between">
        <div className="h-[18px] w-16 bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-8 w-8 bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <div className="mb-2 h-7 w-10 bg-zinc-100 dark:bg-zinc-800" />
      <div className="mb-1 h-5 w-3/4 bg-zinc-100 dark:bg-zinc-800" />
      <div className="mb-4 h-3 w-full bg-zinc-100 dark:bg-zinc-800" />
      <div className="mb-5 h-2 w-1/2 bg-zinc-100 dark:bg-zinc-800" />
      <div className="flex justify-between">
        <div className="h-3 w-12 bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export const Projects = () => {
  const { t } = useTranslation();

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all',         label: t('projects.filters.all') },
    { key: 'saas',        label: 'SaaS' },
    { key: 'client',      label: t('projects.filters.client') },
    { key: 'open-source', label: t('projects.filters.openSource') },
    { key: 'mobile',      label: t('projects.filters.mobile') },
    { key: 'job',         label: t('projects.filters.job') },
  ];

  // ── Remote data ──────────────────────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res  = await fetch('/api/content', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ContentBundle;
        if (mounted) { setProjects(json.projects || []); setErr(null); }
      } catch (e: any) {
        if (mounted) setErr(e?.message ?? 'Failed to load projects');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ── Filter ───────────────────────────────────────────────────────────────
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(
    () => filter === 'all' ? projects : projects.filter(p => p.tags?.includes(filter)),
    [filter, projects]
  );

  // ── Expand/Collapse State ────────────────────────────────────────────────
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Modal ────────────────────────────────────────────────────────────────
  const [open, setOpen]                     = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeProjectId, setActiveProjectId]   = useState<string | null>(null);

  const activeProject = useMemo(
    () => projects.find(p => p.id === activeProjectId) || null,
    [projects, activeProjectId]
  );

  const openCase = (id: string) => { setActiveProjectId(id); setActiveImageIndex(0); setOpen(true); };
  const closeCase = () => { setOpen(false); setTimeout(() => setActiveProjectId(null), 400); };

  return (
    <section id="projects" className="relative mx-auto mt-24 max-w-6xl px-4">

      {/* ── SECTION HEADER — ruled line system ─────────────────────────── */}
      <Rule />
      <div className="flex items-baseline justify-between py-4">
        <h2 className="font-heading text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
          {t('projects.title')}
        </h2>
        {!loading && (
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            {filtered.length} project{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <Rule />

      {/* ── BODY GRID ──────────────────────────────────────────────────── */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[180px_1fr]">

        {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
        <aside className="self-start lg:sticky lg:top-28">

          {/* Filter label — desktop only */}
          <p className="mb-3 hidden font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600 lg:block">
            {t('projects.filter')}
          </p>

          {/* Filter buttons */}
          <div
            className={[
              'flex flex-row flex-wrap gap-2',
              'lg:flex-col lg:gap-0',
              'lg:border-t lg:border-zinc-200 lg:dark:border-zinc-800',
            ].join(' ')}
          >
            {FILTERS.map(f => {
              const isActive = filter === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  aria-pressed={isActive}
                  className={[
                    'relative flex items-center gap-2.5',
                    'focus-visible:outline-none transition-colors duration-150',
                    // Mobile: small bordered chip
                    'rounded-sm border border-zinc-200 dark:border-zinc-800 px-3 py-1.5',
                    // Desktop: full-width row
                    'lg:rounded-none lg:border-0 lg:border-b lg:border-zinc-100 lg:dark:border-zinc-900 lg:px-0 lg:py-3 lg:w-full',
                    isActive
                      ? 'text-zinc-900 dark:text-zinc-50 border-zinc-900 dark:border-zinc-100 lg:border-zinc-100 lg:dark:border-zinc-900'
                      : 'text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300',
                  ].join(' ')}
                >
                  {/* Animated lime dash — desktop */}
                  <span
                    aria-hidden
                    className={[
                      'hidden lg:block h-px bg-[#2467AC] shrink-0',
                      'transition-[width,opacity] duration-300',
                      isActive ? 'w-5 opacity-100' : 'w-0 opacity-0',
                    ].join(' ')}
                  />
                  <span className="font-mono text-[10px] uppercase tracking-widest">
                    {f.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* CTA — desktop */}
          <div className="mt-8 hidden lg:block">
            <Rule />
            <div className="py-4">
              <p className="mb-2.5 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
                {t('projects.contact', { defaultValue: 'Need a build?' })}
              </p>
              <Link
                href="#contact"
                className={[
                  'flex w-full items-center justify-between',
                  'border border-zinc-900 dark:border-zinc-100',
                  'px-3 py-2 text-[11px] font-semibold uppercase tracking-widest',
                  'text-zinc-900 dark:text-zinc-100',
                  'hover:bg-zinc-900 hover:text-white',
                  'dark:hover:bg-zinc-50 dark:hover:text-zinc-900',
                  'transition-colors duration-150',
                ].join(' ')}
              >
                {t('projects.cta', { defaultValue: "Let's talk" })}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* ── PROJECT GRID ─────────────────────────────────────────────── */}
        <div>

          {/* Loading state */}
          {loading && (
            <div className="grid grid-cols-1 border-l border-t border-zinc-200 dark:border-zinc-800 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Error state */}
          {!loading && err && (
            <div className="border border-dashed border-zinc-200 dark:border-zinc-800 p-10 text-center">
              <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
                {t('projects.error', { defaultValue: 'Failed to load projects.' })}
              </p>
              <p className="mt-1 font-mono text-[10px] text-zinc-300 dark:text-zinc-700">{err}</p>
            </div>
          )}

          {/* Loaded state */}
          {!loading && !err && (
            <>
              <motion.ul
                layout
                className="grid grid-cols-1 border-l border-t border-zinc-200 dark:border-zinc-800 md:grid-cols-2"
              >
                <AnimatePresence mode="popLayout">
                  {filtered.map((p, i) => {
                    const isExpanded = expandedIds.has(p.id);
                    // Only show the toggle button if the text is likely to span more than two lines
                    const needsCollapse = p.description.length > 100;

                    return (
                      <motion.li
                        key={p.id}
                        layout
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ duration: 0.55, ease: EXPO, delay: (i % 4) * 0.07 }}
                        exit={{ opacity: 0, y: -8, transition: { duration: 0.25 } }}
                        className="relative border-b border-r border-zinc-200 dark:border-zinc-800"
                      >
                        <article
                          className={[
                            'group relative h-full p-5 lg:p-6',
                            'transition-colors duration-200',
                            'hover:bg-zinc-50 dark:hover:bg-zinc-900/60',
                          ].join(' ')}
                        >
                          {/* Top row: category tags + logo mark */}
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="flex flex-wrap gap-1.5">
                              {p.tags?.map(tag => (
                                <span
                                  key={tag}
                                  className={[
                                    'border border-zinc-200 dark:border-zinc-800',
                                    'px-2 py-0.5',
                                    'font-mono text-[9px] uppercase tracking-widest',
                                    'text-zinc-400 dark:text-zinc-500',
                                  ].join(' ')}
                                >
                                  {tag.replace('-', ' ')}
                                </span>
                              ))}
                            </div>
                            <ImageWithFallback
                              src={p.logoUrl}
                              alt={`${p.title} logo`}
                              width={32}
                              height={32}
                              className="shrink-0 border border-zinc-200/60 dark:border-zinc-700/50 object-cover"
                            />
                          </div>

                          {/* Metric */}
                          {p.metric && (
                            <p className="mb-1 font-mono text-3xl font-bold leading-none tracking-tight text-zinc-900 dark:text-zinc-50">
                              {p.metric}
                            </p>
                          )}

                          {/* Title */}
                          <h3 className="mb-1.5 font-heading text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            {p.title}
                          </h3>

                          {/* Description + Collapse Toggle */}
                          <div className="mb-4">
                            <motion.p
                              layout
                              className={[
                                'text-sm leading-relaxed text-zinc-500 dark:text-zinc-400',
                                isExpanded ? '' : 'line-clamp-2',
                              ].join(' ')}
                            >
                              {p.description}
                            </motion.p>
                            
                            {needsCollapse && (
                              <button
                                type="button"
                                onClick={() => toggleExpand(p.id)}
                                className={[
                                  'mt-2 flex items-center gap-1 border-b border-transparent',
                                  'font-mono text-[10px] font-bold uppercase tracking-widest',
                                  'text-[#2467AC] dark:text-[#3a8ceb]',
                                  'transition-colors hover:border-[#2467AC] dark:hover:border-[#3a8ceb]',
                                ].join(' ')}
                              >
                                {isExpanded ? 'Show Less ↑' : 'Read More ↓'}
                              </button>
                            )}
                          </div>

                          {/* Tech */}
                          {p.tech && p.tech.length > 0 && (
                            <p className="mb-5 font-mono text-[10px] uppercase tracking-widest text-zinc-300 dark:text-zinc-700">
                              {p.tech.slice(0, 4).join(' · ')}
                            </p>
                          )}

                          {/* Action row */}
                          <div className="flex items-center justify-between">
                            {p.url && p.url.trim() !== '' ? (
                              <a
                                href={p.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Open ${p.title}`}
                                className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                              >
                                Visit →
                              </a>
                            ) : <span />}

                            <button
                              type="button"
                              onClick={() => p.caseFile ? openCase(p.id) : undefined}
                              disabled={!p.caseFile}
                              aria-disabled={!p.caseFile}
                              className={[
                                'font-mono text-[10px] uppercase tracking-widest transition-colors',
                                p.caseFile
                                  ? 'cursor-pointer text-zinc-600 dark:text-zinc-400 hover:text-[#2467AC]'
                                  : 'cursor-not-allowed text-zinc-300 dark:text-zinc-700',
                              ].join(' ')}
                            >
                              {p.caseFile ? 'Case file ↗' : 'Case file soon'}
                            </button>
                          </div>

                          {/* Hover border accent */}
                          <span
                            aria-hidden
                            className="absolute left-0 top-0 h-0 w-[2px] bg-[#2467AC] transition-[height] duration-300 group-hover:h-full"
                          />
                        </article>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </motion.ul>

              {/* Empty state */}
              {filtered.length === 0 && (
                <div className="border border-dashed border-zinc-200 dark:border-zinc-800 py-16 text-center">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                    {t('projects.empty', { defaultValue: 'No projects in this filter… yet.' })}
                  </p>
                </div>
              )}

              {/* Mobile CTA */}
              <div className="mt-8 flex justify-start lg:hidden">
                <Link
                  href="#contact"
                  className={[
                    'inline-flex items-center gap-2',
                    'border border-zinc-900 dark:border-zinc-100',
                    'px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest',
                    'text-zinc-900 dark:text-zinc-100',
                    'hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-50 dark:hover:text-zinc-900',
                    'transition-colors duration-150',
                  ].join(' ')}
                >
                  {t('projects.cta', { defaultValue: "Let's talk" })} →
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── MODAL ──────────────────────────────────────────────────────── */}
      <CaseModal
        open={open && !!activeProject?.caseFile}
        onClose={closeCase}
        title={activeProject?.title || ''}
        caseFile={activeProject?.caseFile || { problem: '', approach: [], result: '' }}
        activeImageIndex={activeImageIndex}
        setActiveImageIndex={setActiveImageIndex}
      />
    </section>
  );
};