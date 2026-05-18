'use client';
import '../i18n';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import QuickPeek from './QuickPeek';

// ─── Types (unchanged) ───────────────────────────────────────────────────────
type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover?: string;
  date: string;
  reading: string;
  tags: string[];
};

type ContentBundle = {
  projects: unknown[];
  experiences: unknown[];
  journey: unknown[];
  notes: Post[];
};

type Filter = 'all' | string;

// ─── Motion ──────────────────────────────────────────────────────────────────
const EXPO = [0.16, 1, 0.3, 1] as const;

// ─── Design primitives ───────────────────────────────────────────────────────
function Rule({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}

const fmtDate = (d: string) => {
  const dt = new Date(d);
  return isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function Notes() {
  const { t } = useTranslation();
  const [query, setQuery]       = useState('');
  const [filter, setFilter]     = useState<Filter>('all');
  const [peekSlug, setPeekSlug] = useState<string | null>(null);
  const [notes, setNotes]       = useState<Post[]>([]);
  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch('/api/content', { credentials: 'same-origin', cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ContentBundle = await res.json();
        const clean = (json.notes || [])
          .filter(n => n && n.title && n.slug)
          .map(n => ({ ...n, reading: n.reading || '5 min', tags: Array.isArray(n.tags) ? n.tags : [] }))
          .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        if (alive) setNotes(clean);
      } catch (e: any) {
        if (alive) setErr(e?.message || 'Failed to load notes');
      } finally {
        if (alive) setLoading(false);
      }
    }
    void load();
    return () => { alive = false; };
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const tags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach(p => p.tags?.forEach(tag => tag && set.add(tag)));
    return ['all', ...Array.from(set)];
  }, [notes]);

  const featured = notes[0];
  const all = notes;

  const filteredAll = useMemo(() => {
    const q = query.trim().toLowerCase();
    const f = filter.toLowerCase();
    return all.filter(p => {
      const matchesTag = f === 'all' || p.tags?.some(t => t.toLowerCase() === f);
      if (!matchesTag) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.excerpt || '').toLowerCase().includes(q) ||
        (p.tags || []).join(' ').toLowerCase().includes(q)
      );
    });
  }, [query, filter, all]);

  const showFeatured = filter === 'all' && query.trim() === '' && !!featured;

  const gridPosts = useMemo(
    () => showFeatured ? all.slice(1) : filteredAll,
    [showFeatured, filteredAll, all]
  );

  return (
    <section id="notes" className="mx-auto mt-24 max-w-6xl px-4 pb-16">

      {/* ── Section header + search row ────────────────────────────── */}
      <Rule />
      <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
          {t('notes.title')}
        </h2>

        {/* Search + RSS — flat, no rounded corners */}
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="search"
            placeholder={t('notes.search')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search notes"
            className={[
              'w-44 border border-zinc-200 dark:border-zinc-800',
              'bg-transparent px-3 py-2',
              'font-mono text-[11px] text-zinc-800 dark:text-zinc-200',
              'placeholder:text-zinc-400 dark:placeholder:text-zinc-600',
              'focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none',
              'transition-colors duration-150',
            ].join(' ')}
          />
          <a
            href="/rss.xml"
            aria-label="RSS feed"
            className={[
              'border border-zinc-200 dark:border-zinc-800',
              'px-3 py-2 font-mono text-[11px] uppercase tracking-widest',
              'text-zinc-400 dark:text-zinc-500',
              'hover:border-zinc-900 hover:text-zinc-900',
              'dark:hover:border-zinc-100 dark:hover:text-zinc-100',
              'transition-colors duration-150',
            ].join(' ')}
          >
            RSS
          </a>
        </div>
      </div>
      <Rule />

      {/* ── Tag filters — bordered chips (no pill/rounded shape) ─────── */}
      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map(tag => {
          const isActive = filter.toLowerCase() === tag.toLowerCase();
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setFilter(tag)}
              aria-pressed={isActive}
              className={[
                'border px-3 py-1',
                'font-mono text-[10px] uppercase tracking-widest',
                'transition-colors duration-150 focus-visible:outline-none',
                isActive
                  ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 hover:border-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300',
              ].join(' ')}
            >
              {tag === 'all' ? t('notes.all') : tag}
            </button>
          );
        })}
      </div>

      {/* ── Loading skeleton ─────────────────────────────────────────── */}
      {loading && (
        <div className="mt-8 grid grid-cols-1 border-l border-t border-zinc-200 dark:border-zinc-800 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse border-b border-r border-zinc-200 dark:border-zinc-800 p-5"
            >
              <div className="mb-4 aspect-[3/2] w-full bg-zinc-100 dark:bg-zinc-800" />
              <div className="mb-2 h-3 w-20 bg-zinc-100 dark:bg-zinc-800" />
              <div className="mb-2 h-5 w-3/4 bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      )}

      {/* ── Error state ──────────────────────────────────────────────── */}
      {!!err && !loading && (
        <div className="mt-8 border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
            {t('notes.error')}: {err}
          </p>
        </div>
      )}

      {!loading && !err && (
        <>
          {/* ── FEATURED — editorial inner-border split ───────────────── */}
          {/*
            Desktop: image left 50% | content right 50%, separated by 1px rule.
            No background fill, no shadow. Bordered rectangular container.
            Consistent with CaseModal's split-panel concept.
          */}
          {showFeatured && featured && (
            <motion.article
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: EXPO }}
              className="group mt-8 grid grid-cols-1 border border-zinc-200 dark:border-zinc-800 lg:grid-cols-2"
            >
              {/* Cover image */}
              {featured.cover ? (
                <div className="relative aspect-[3/2] overflow-hidden border-b border-zinc-200 dark:border-zinc-800 lg:border-b-0 lg:border-r">
                  <Image
                    src={featured.cover}
                    alt={featured.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    sizes="(max-width:1024px) 100vw, 520px"
                    priority
                  />
                </div>
              ) : (
                /* No-image fallback: ruled texture block */
                <div className="flex aspect-[3/2] items-center justify-center border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 lg:border-b-0 lg:border-r">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-300 dark:text-zinc-700">
                    No cover
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="flex flex-col p-6 lg:p-8">
                {/* Meta row */}
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <span
                    className={[
                      'border border-zinc-200 dark:border-zinc-800',
                      'px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest',
                      'text-zinc-400 dark:text-zinc-500',
                    ].join(' ')}
                  >
                    {t('notes.featured')}
                  </span>
                  <time className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                    {fmtDate(featured.date)}
                  </time>
                  <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                    {featured.reading}
                  </span>
                </div>

                <h3 className="font-heading text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 lg:text-2xl">
                  {featured.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 line-clamp-4">
                  {featured.excerpt}
                </p>

                {featured.tags.length > 0 && (
                  <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-zinc-300 dark:text-zinc-700">
                    {featured.tags.join(' · ')}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-5 flex items-center gap-3">
                  <Link
                    href={`/notes/${featured.slug}`}
                    className={[
                      'inline-flex items-center justify-center',
                      'bg-zinc-900 dark:bg-zinc-50',
                      'px-4 py-2 text-[11px] font-semibold uppercase tracking-widest',
                      'text-white dark:text-zinc-900',
                      'hover:bg-zinc-700 dark:hover:bg-zinc-200',
                      'transition-colors duration-150',
                    ].join(' ')}
                  >
                    {t('notes.read')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => setPeekSlug(featured.slug)}
                    className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    {t('notes.peek')}
                  </button>
                </div>
              </div>
            </motion.article>
          )}

          {/* ── NOTES GRID — inner-border 2-col ─────────────────────── */}
          {gridPosts.length > 0 && (
            <motion.ul
              layout
              className="mt-6 grid grid-cols-1 border-l border-t border-zinc-200 dark:border-zinc-800 sm:grid-cols-2"
            >
              <AnimatePresence mode="popLayout">
                {gridPosts.map((p, i) => (
                  <motion.li
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, ease: EXPO, delay: (i % 4) * 0.07 }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    className="group relative border-b border-r border-zinc-200 dark:border-zinc-800"
                  >
                    <article className="h-full p-5 transition-colors duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-900/50">

                      {/* Cover */}
                      {p.cover && (
                        <div className="relative mb-4 aspect-[3/2] w-full overflow-hidden border border-zinc-200 dark:border-zinc-800">
                          <Image
                            src={p.cover}
                            alt={p.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                            sizes="(max-width:768px) 100vw, 600px"
                          />
                        </div>
                      )}

                      {/* Meta */}
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <time className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                          {fmtDate(p.date)}
                        </time>
                        <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                          {p.reading}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="mb-1.5 font-heading text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50 line-clamp-2">
                        {p.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                        {p.excerpt}
                      </p>

                      {/* Tags — monospace dot-separated */}
                      {p.tags.length > 0 && (
                        <p className="mb-4 font-mono text-[9px] uppercase tracking-widest text-zinc-300 dark:text-zinc-700">
                          {p.tags.join(' · ')}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/notes/${p.slug}`}
                          className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                          {t('notes.readShort')}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPeekSlug(p.slug)}
                          className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                          {t('notes.peekShort')}
                        </button>
                      </div>

                      {/* Hover left-edge lime accent */}
                      <span
                        aria-hidden
                        className="absolute left-0 top-0 h-0 w-[2px] bg-[#2467AC] transition-[height] duration-300 group-hover:h-full"
                      />
                    </article>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}

          {/* ── Empty state ──────────────────────────────────────────── */}
          {gridPosts.length === 0 && (
            <div className="mt-8 border border-dashed border-zinc-200 dark:border-zinc-800 py-12 text-center">
              <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                {t('notes.empty')}
              </p>
            </div>
          )}
        </>
      )}

      <QuickPeek slug={peekSlug} onClose={() => setPeekSlug(null)} posts={notes} />
    </section>
  );
}