'use client';
import '../i18n';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// ─── Types (unchanged) ───────────────────────────────────────────────────────
type JourneyRow = {
  id: string;
  kind: 'education' | 'cert';
  year: string;
  title: string;
  org?: string;
  url?: string;
  note?: string;
};

type ContentBundle = {
  projects: unknown[];
  experiences: unknown[];
  journey: JourneyRow[];
  notes: unknown[];
};

type Entry = {
  title: string;
  year: string;
  where?: string;
  whereUrl?: string;
  blurb: string;
  kind: 'edu' | 'cert';
  credentialUrl?: string;
};

// ─── Utilities ───────────────────────────────────────────────────────────────
function parseYearStart(y: string): number {
  const m = y?.match?.(/(20\d{2}|19\d{2})/);
  return m ? parseInt(m[1], 10) : 0;
}
function sortDesc<T extends Entry>(arr: T[]) {
  return [...arr].sort((a, b) => parseYearStart(b.year) - parseYearStart(a.year));
}

// ─── Motion ──────────────────────────────────────────────────────────────────
const EXPO = [0.16, 1, 0.3, 1] as const;
const INITIAL_CERTS = 6;

// ─── Design primitives ───────────────────────────────────────────────────────
function Rule({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}

function CredentialLink({ href, long = false }: { href: string; long?: boolean }) {
  const { t } = useTranslation();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={long
        ? 'mt-3 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-[#2467AC]'
        : 'font-mono text-[9px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-[#2467AC]'}
    >
      {long ? t('journey.viewCredential') : t('journey.credential')}
    </a>
  );
}

// ─── Education chapter row ───────────────────────────────────────────────────
/*
  Layout (desktop):
    [120px year + kind label]  |  [flex-1 title / issuer / blurb / credential]

  The row has a subtle hover bg tint and uses a left-edge lime accent on hover —
  consistent with the Project card hover treatment.
*/
function EduRow({ e, index }: { e: Entry; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease: EXPO, delay: index * 0.09 }}
      className="group relative"
    >
      <Rule />
      <div
        className={[
          'grid grid-cols-1 gap-x-10 gap-y-3 py-6',
          'lg:grid-cols-[120px_1fr]',
          'transition-colors duration-150',
          'hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40',
          'px-1',
        ].join(' ')}
      >
        {/* Left: year + kind label */}
        <div className="flex flex-row items-center gap-3 lg:flex-col lg:items-start lg:gap-2 lg:pt-0.5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
            {e.year}
          </p>
          <span
            className={[
              'border border-zinc-200 dark:border-zinc-800',
              'px-2 py-0.5',
              'font-mono text-[9px] uppercase tracking-widest',
              'text-zinc-400 dark:text-zinc-600',
            ].join(' ')}
          >
            Education
          </span>
        </div>

        {/* Right: content */}
        <div>
          <h4 className="font-heading text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {e.title}
          </h4>

          {e.where && (
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {e.whereUrl ? (
                <a
                  href={e.whereUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  {e.where} ↗
                </a>
              ) : e.where}
            </p>
          )}

          {e.blurb && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {e.blurb}
            </p>
          )}

          {e.credentialUrl && (
            <CredentialLink href={e.credentialUrl} long />
          )}
        </div>
      </div>

      {/* Hover left-edge accent — same motif as Project cards */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-0 w-[2px] bg-[#2467AC] transition-[height] duration-300 group-hover:h-full"
      />
    </motion.div>
  );
}

// ─── Certification cell (compact grid) ───────────────────────────────────────
/*
  Used in a 3-col inner-border grid (border-l border-t on container,
  border-r border-b on each cell). Same pattern as Project grid.
*/
function CertCell({ e, index }: { e: Entry; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, ease: EXPO, delay: (index % 6) * 0.06 }}
      className="group relative border-b border-r border-zinc-200 dark:border-zinc-800 p-4 transition-colors duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
    >
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        {e.year}
      </p>
      <h4 className="mb-1 font-heading text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-snug">
        {e.title}
      </h4>
      {e.where && (
        <p className="mb-3 font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
          {e.where}
        </p>
      )}
      {e.credentialUrl && (
        <CredentialLink href={e.credentialUrl} />
      )}
      {/* Left-edge accent on hover */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-0 w-[2px] bg-[#2467AC] transition-[height] duration-300 group-hover:h-full"
      />
    </motion.div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────
export const Journey = () => {
  const { t } = useTranslation();
  const [education, setEducation] = useState<Entry[]>([]);
  const [certsAll, setCertsAll]   = useState<Entry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [err, setErr]             = useState<string | null>(null);
  const [showAll, setShowAll]     = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch('/api/content', {
          credentials: 'same-origin',
          cache: 'no-store',
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ContentBundle = await res.json();
        const rows = Array.isArray(data.journey) ? data.journey : [];
        const entries: Entry[] = rows.map(j => ({
          title: j.title,
          year: j.year,
          where: j.org || undefined,
          whereUrl: j.url || undefined,
          blurb: j.note || '',
          kind: j.kind === 'education' ? 'edu' : 'cert',
          credentialUrl: j.kind === 'cert' ? (j.url || undefined) : undefined,
        }));
        setEducation(sortDesc(entries.filter(e => e.kind === 'edu')));
        setCertsAll(sortDesc(entries.filter(e => e.kind === 'cert')));
      } catch (e: any) {
        if (e?.name !== 'AbortError') setErr(e?.message || 'Failed to load journey');
      } finally {
        setLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

  const certs = useMemo(
    () => (showAll ? certsAll : certsAll.slice(0, INITIAL_CERTS)),
    [showAll, certsAll]
  );

  return (
    <section id="journey" className="mx-auto mt-24 max-w-6xl px-4">

      {/* ── Section header ──────────────────────────────────────────── */}
      <Rule />
      <div className="flex items-baseline justify-between py-4">
        <h2 className="font-heading text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
          {t('journey.title')}
        </h2>
      </div>
      <Rule />

      {/* ── Loading ─────────────────────────────────────────────────── */}
      {loading && (
        <div className="mt-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse border-b border-zinc-200 dark:border-zinc-800 py-6">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[120px_1fr]">
                <div className="h-3 w-14 bg-zinc-100 dark:bg-zinc-800" />
                <div>
                  <div className="mb-2 h-5 w-1/2 bg-zinc-100 dark:bg-zinc-800" />
                  <div className="h-3 w-1/4 bg-zinc-100 dark:bg-zinc-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────── */}
      {!!err && !loading && (
        <div className="mt-8 border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
            {t('journey.error')}: {err}
          </p>
        </div>
      )}

      {/* ── Content ─────────────────────────────────────────────────── */}
      {!loading && !err && (
        <div className="mt-8">

          {/* ── EDUCATION CHAPTER ROWS ──────────────────────────────── */}
          <div>
            <p className="mb-0 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600">
              {t('journey.education')}
            </p>
            {education.length > 0 ? (
              <>
                {education.map((e, i) => (
                  <EduRow key={`edu-${i}`} e={e} index={i} />
                ))}
                <Rule />
              </>
            ) : (
              <div className="mt-2 border border-dashed border-zinc-200 dark:border-zinc-800 py-8 text-center">
                <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
                  {t('journey.noEducation')}
                </p>
              </div>
            )}
          </div>

          {/* ── CERTIFICATION GRID ──────────────────────────────────── */}
          <div className="mt-14">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600">
                {t('journey.certifications')}
                {certsAll.length > 0 && (
                  <span className="ml-3 text-zinc-300 dark:text-zinc-700">
                    ({certsAll.length})
                  </span>
                )}
              </p>
              {certsAll.length > INITIAL_CERTS && (
                <button
                  type="button"
                  onClick={() => setShowAll(v => !v)}
                  aria-expanded={showAll}
                  className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  {showAll ? t('journey.showFewer') : t('journey.showAll', { count: certsAll.length })}
                </button>
              )}
            </div>
            <Rule />

            {certsAll.length > 0 ? (
              /*
                Inner-border grid: container has border-l border-t,
                each CertCell has border-r border-b.
              */
              <motion.div
                layout
                className="grid grid-cols-1 border-l border-t border-zinc-200 dark:border-zinc-800 sm:grid-cols-2 lg:grid-cols-3"
              >
                <AnimatePresence>
                  {certs.map((c, i) => (
                    <CertCell key={`cert-${c.title}-${i}`} e={c} index={i} />
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="border border-dashed border-zinc-200 dark:border-zinc-800 py-8 text-center">
                <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
                  {t('journey.noCerts')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};