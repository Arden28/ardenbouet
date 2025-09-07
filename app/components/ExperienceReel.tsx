'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

type ExperienceRow = {
  id: string;                                  // uid
  title: string;                               // company/title
  job: string;                                 // role
  fromTo: string;                              // "Sept 2024 – Mar 2025 · 7 months"
  bullets: string[];
  type: 'Freelance' | 'Remote' | 'Intern';

  // NEW (now present in DB)
  logline?: string;
  outcomes?: string[];
  tags?: string[];
  poster?: string;                             // logo url
};

type Scene = {
  id: string;
  company: string;
  role: string;
  period: string;
  location?: string;                           // from .type
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

export default function ExperienceTimeline() {
  const itemsRef = useRef<Array<HTMLDivElement | null>>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Set itemRef
  const setItemRef = (index: number) =>
    (el: HTMLDivElement | null) => { itemsRef.current[index] = el; };

  // fetch experiences from public content endpoint
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

        const mapped: Scene[] = (json.experiences || []).map((x) => ({
          id: x.id,
          company: x.title,
          role: x.job,
          period: x.fromTo,
          location: x.type,                   // Freelance / Remote / Intern
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

  // subtle reveal-on-scroll (adds .in once)
  useEffect(() => {
    const nodes = itemsRef.current.filter(Boolean) as HTMLDivElement[];
    if (!nodes.length) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in'); }),
      { threshold: 0.25 }
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [scenes.length]);

  return (
    <section id="experience" className="relative mx-auto mt-20 max-w-6xl px-4">
      <h3 className="text-left text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-black to-sky-500 dark:from-white dark:to-sky-400">
        Professional Experience
      </h3>

      {/* loading / error */}
      {loading && (
        <div className="mt-6 grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-zinc-200/70 bg-white/60 dark:border-zinc-700/50 dark:bg-zinc-900/60" />
          ))}
        </div>
      )}
      {!!err && !loading && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          Could not load experience: {err}
        </div>
      )}

      {!loading && !err && (
        <div className="tl mt-8">
          <div className="tl-line" aria-hidden />
          <ol className="tl-list">
            {scenes.map((s, i) => {
              const side = i % 2 === 0 ? 'left' : 'right'; // alternate on desktop
              return (
                <li key={s.id} className={`tl-item ${side}`}>
                  {/* center marker + side connector */}
                  <span className="tl-dot" aria-hidden />
                  <span className="tl-connector" aria-hidden />

                  {/* card */}
                  <article
                    ref={setItemRef(i)}
                    className="tl-card reveal"
                    style={{ animationDelay: `${(i % 6) * 60}ms` as any }}
                  >
                    {/* grain overlay */}
                    <div className="grain absolute inset-0" aria-hidden />

                    {/* Header */}
                    <div className="flex items-start gap-3">
                      {s.poster && (
                        <span className="relative inline-flex h-10 w-10 overflow-hidden rounded-lg ring-1 ring-zinc-900/5 dark:ring-white/10">
                          <Image src={s.poster} alt={`${s.company} logo`} fill className="object-cover" sizes="40px" />
                        </span>
                      )}
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {s.company}
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {s.role} · <span className="whitespace-nowrap">{s.period}</span>
                          {s.location ? <> · <span className="whitespace-nowrap">{s.location}</span></> : null}
                        </p>
                      </div>
                    </div>

                    {/* Logline */}
                    {s.logline && (
                      <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-300">
                        {s.logline}
                      </p>
                    )}

                    {/* Bullets */}
                    {!!s.bullets?.length && (
                      <ul className="mt-2 list-disc pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                        {s.bullets.map((b, idx) => <li key={idx}>{b}</li>)}
                      </ul>
                    )}

                    {/* Outcomes */}
                    {!!s.outcomes?.length && (
                      <div className="mt-3">
                        <h5 className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--brand)' }}>
                          Outcome
                        </h5>
                        <ul className="mt-1 list-disc pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                          {s.outcomes.map((o, idx) => <li key={idx}>{o}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Tags */}
                    {!!s.tags?.length && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {s.tags.map((t) => (
                          <span key={t} className="tl-chip">{t}</span>
                        ))}
                      </div>
                    )}
                  </article>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Resume CTA */}
      <div className="mt-8">
        <div className="resume-cta">
          <span className="r-accent" aria-hidden />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-lg">Want the full story?</h4>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                Projects, stack, and impact compacted into 1 page. Updated regularly.
              </p>
              <div className="mt-2 flex gap-2">
                <span className="resume-chip">PDF • 1 page</span>
                <span className="resume-chip">Latest • {new Date().getFullYear()}</span>
              </div>
            </div>

            <div className="resume-actions">
              <a
                href="/files/cv-v2.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-[color:var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
              >
                View résumé (PDF)
              </a>
              <a
                href="/#contact"
                className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-white/60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800/50"
              >
                Discuss opportunities
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
