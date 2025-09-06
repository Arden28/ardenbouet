'use client';
import '../i18n';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import CaseModal from './CaseModal';

type Project = {
  id: string; // stored as string in DB
  title: string;
  description: string;
  logoUrl: string;
  url: string;
  tags: Array<'saas' | 'client' | 'open-source'>;
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

export const Projects = () => {
  const { t } = useTranslation();

  // remote state
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/content', { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ContentBundle;
        if (mounted) {
          setProjects(json.projects || []);
          setErr(null);
        }
      } catch (e: any) {
        if (mounted) setErr(e?.message ?? 'Failed to load projects');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  

  type Filter = 'all' | 'saas' | 'client' | 'open-source';
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return projects;
    return projects.filter((p) => p.tags?.includes(filter));
  }, [filter, projects]);

  // Modal state
  const [open, setOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || null,
    [projects, activeProjectId],
  );

  const openCase = (id: string) => {
    setActiveProjectId(id);
    setActiveImageIndex(0);
    setOpen(true);
  };
  const closeCase = () => {
    setOpen(false);
    setTimeout(() => setActiveProjectId(null), 200);
  };

  return (
    <section id="projects" className="relative mt-20 px-4">
      <h2 className="mx-auto max-w-6xl text-left text-2xl font-extrabold leading-8">
        <span className="bg-gradient-to-r from-black to-[color:var(--brand)] bg-clip-text text-transparent dark:from-white dark:to-[color:var(--brand)]">
          Builds & Case Files
        </span>
      </h2>

      <div className="mx-auto mt-6 grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Filters */}
        <aside className="self-start space-y-4 lg:sticky lg:top-24 lg:col-span-1">
          <div className="rounded-xl border border-zinc-200/80 bg-white p-4 dark:border-zinc-700/40 dark:bg-zinc-900">
            <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {t('projects.filters', { defaultValue: 'Filter' })}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(['all', 'saas', 'client', 'open-source'] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={[
                    'w-full rounded-lg border px-3 py-1.5 text-sm transition',
                    filter === f
                      ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)] text-zinc-800'
                      : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/60',
                  ].join(' ')}
                >
                  {f === 'open-source' ? 'Open Source' : f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200/80 bg-white p-4 dark:border-zinc-700/40 dark:bg-zinc-900">
            <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {t('projects.contact', { defaultValue: 'Need a build?' })}
            </h3>
            <Button asChild className="w-full bg-[color:var(--brand)] hover:opacity-95">
              <Link href="#contact">{t('projects.cta', { defaultValue: "Let's talk" })}</Link>
            </Button>
          </div>
        </aside>

        {/* List */}
        <div className="lg:col-span-3">
          {loading && (
            <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="relative">
                  <div className="case-card h-full p-4 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                      <div className="flex-1">
                        <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
                        <div className="mt-2 h-3 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
                      </div>
                    </div>
                    <div className="mt-4 h-6 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!loading && err && (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-red-600 dark:border-zinc-700/40 dark:text-red-400">
              {t('projects.error', { defaultValue: 'Failed to load projects.' })} {err}
            </div>
          )}

          {!loading && !err && (
            <>
              <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {filtered.map((p, i) => (
                  <li key={p.id} className="relative">
                    <article className="case-card h-full p-4 dark:bg-zinc-900" style={{ animationDelay: `${(i % 6) * 60}ms` }}>
                      <div className="flex items-center gap-3">
                        <Image src={p.logoUrl} alt={`${p.title} logo`} width={44} height={44} className="rounded-lg" />
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{p.title}</h3>
                          <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{p.description}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {p.tags?.map((tag) => (
                          <span key={tag} className="chip chip-brand capitalize">
                            {tag.replace('-', ' ')}
                          </span>
                        ))}
                        {p.tech?.slice(0, 3).map((tk) => (
                          <span key={tk} className="chip chip-brand">
                            {tk}
                          </span>
                        ))}
                        {p.metric && <span className="chip chip-brand">{p.metric}</span>}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm link-brand"
                          aria-label={`Open ${p.title}`}
                        >
                          {t('experiences.projects.see', { defaultValue: 'See project' })}
                        </a>

                        <button
                          type="button"
                          onClick={() => (p.caseFile ? openCase(p.id) : undefined)}
                          disabled={!p.caseFile}
                          className={`text-sm ${
                            p.caseFile
                              ? 'text-zinc-600 hover:text-zinc-800 dark:text-zinc-300 dark:hover:text-zinc-100'
                              : 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                          }`}
                          aria-disabled={!p.caseFile}
                        >
                          {p.caseFile ? 'View case file' : 'Case file soon'}
                        </button>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>

              {filtered.length === 0 && (
                <div className="mt-8 rounded-xl border border-dashed p-6 text-center text-sm text-zinc-500 dark:border-zinc-700/40 dark:text-zinc-400">
                  {t('projects.empty', { defaultValue: 'No projects in this filter… yet.' })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal */}
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
