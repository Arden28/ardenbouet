'use client';
import { useEffect, useMemo, useState } from 'react';

/** ---- Types from DB ---- */
type JourneyRow = {
  id: string;
  kind: 'education' | 'cert';
  year: string;
  title: string;
  org?: string;
  url?: string;     // can point to org or credential page
  note?: string;    // blurb
};

type ContentBundle = {
  projects: unknown[];
  experiences: unknown[];
  journey: JourneyRow[];
  notes: unknown[];
};

/** ---- UI Entry ---- */
type Entry = {
  title: string;
  year: string;          // "2024 – Present", "Jan 2025", "2019 – 2022"
  where?: string;        // Issuer/School
  whereUrl?: string;     // Link to school/issuer
  blurb: string;         // Keep concise
  kind: 'edu' | 'cert';
  credentialUrl?: string; // Optional “View credential”
};

/** ---- Utilities ---- */
function parseYearStart(y: string): number {
  const m = y?.match?.(/(20\d{2}|19\d{2})/);
  return m ? parseInt(m[1], 10) : 0;
}
function sortDesc<T extends Entry>(arr: T[]) {
  return [...arr].sort((a, b) => parseYearStart(b.year) - parseYearStart(a.year));
}

/** ---- Icon ---- */
function Icon({ kind }: { kind: 'edu' | 'cert' }) {
  const cls = 'h-5 w-5 text-[color:var(--brand)]';
  return kind === 'edu' ? (
    <svg viewBox="0 0 24 24" aria-hidden className={cls}>
      <path d="M3 8.5 12 4l9 4.5-9 4.5L3 8.5Z" fill="currentColor" />
      <path d="M6 10v4.5c2 1.3 4 2 6 2s4-.7 6-2V10" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden className={cls}>
      <path d="M12 3a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z" fill="currentColor" />
      <path d="M9 13.5 7 21l5-3 5 3-2-7.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** ---- Card ---- */
function Card({ e }: { e: Entry }) {
  return (
    <article className="relative rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm dark:border-zinc-700/40 dark:bg-zinc-900">
      <span className="absolute left-0 top-0 h-full w-[3px] rounded-l-2xl bg-[color:var(--brand)]" aria-hidden />
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--brand-soft,rgba(36,103,172,.12))]">
          <Icon kind={e.kind} />
        </div>
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{e.title}</h4>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="rounded-full bg-[color:var(--brand-soft,rgba(36,103,172,.12))] px-2 py-0.5 font-medium text-zinc-800 dark:text-zinc-200">
              {e.year}
            </span>
            {e.where && (
              <>
                {' '}•{' '}
                {e.whereUrl ? (
                  <a href={e.whereUrl} target="_blank" rel="noopener noreferrer" className="text-[color:var(--brand)] hover:underline">
                    {e.where}
                  </a>
                ) : (
                  <span>{e.where}</span>
                )}
              </>
            )}
          </p>
        </div>
      </div>
      {e.blurb && <p className="mt-3 line-clamp-3 text-sm text-zinc-700 dark:text-zinc-300">{e.blurb}</p>}

      {e.credentialUrl && (
        <div className="mt-3">
          <a
            href={e.credentialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[color:var(--brand)] underline-offset-2 hover:underline"
          >
            View credential
          </a>
        </div>
      )}
    </article>
  );
}

/** ---- Section ---- */
export const Journey = () => {
  const [education, setEducation] = useState<Entry[]>([]);
  const [certsAll, setCertsAll] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

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

        const entries: Entry[] = rows.map((j) => ({
          title: j.title,
          year: j.year,
          where: j.org || undefined,
          whereUrl: j.url || undefined,          // link to org/issuer
          blurb: j.note || '',
          kind: j.kind === 'education' ? 'edu' : 'cert',
          credentialUrl: j.kind === 'cert' ? (j.url || undefined) : undefined, // if cert, treat url as credential
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

  const INITIAL_CERTS = 6;
  const [showAll, setShowAll] = useState(false);
  const certs = useMemo(
    () => (showAll ? certsAll : certsAll.slice(0, INITIAL_CERTS)),
    [showAll, certsAll]
  );

  return (
    <section id="journey" className="mx-auto mt-20 max-w-6xl px-4">
      <h2 className="text-left text-2xl font-extrabold">
        <span className="bg-gradient-to-r from-black to-[color:var(--brand)] bg-clip-text text-transparent dark:from-white dark:to-[color:var(--brand)]">
          Educational & Certifications Journey
        </span>
      </h2>

      {/* Loading / Error */}
      {loading && (
        <div className="mt-6 grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-zinc-200/70 bg-white/60 dark:border-zinc-700/50 dark:bg-zinc-900/60" />
          ))}
        </div>
      )}
      {!!err && !loading && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          Could not load journey: {err}
        </div>
      )}

      {!loading && !err && (
        <>
          {/* Education */}
          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">Education</h3>
            {education.length ? (
              <ul className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                {education.map((e, i) => (
                  <li key={`${e.title}-${i}`}><Card e={e} /></li>
                ))}
              </ul>
            ) : (
              <div className="mt-3 rounded-lg border border-dashed p-4 text-sm text-zinc-500 dark:border-zinc-700/40 dark:text-zinc-400">
                No education items yet.
              </div>
            )}
          </div>

          {/* Certifications */}
          <div className="mt-8">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">Certifications</h3>
            {certsAll.length ? (
              <>
                <ul className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {certs.map((c, i) => (
                    <li key={`${c.title}-${i}`}><Card e={c} /></li>
                  ))}
                </ul>

                {certsAll.length > INITIAL_CERTS && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowAll(v => !v)}
                      className="rounded-md border border-zinc-200/70 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700/50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                      aria-expanded={showAll}
                    >
                      {showAll ? 'Show fewer' : `Show all ${certsAll.length}`}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-3 rounded-lg border border-dashed p-4 text-sm text-zinc-500 dark:border-zinc-700/40 dark:text-zinc-400">
                No certifications yet.
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
};
