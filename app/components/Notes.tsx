'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import QuickPeek from './QuickPeek';

type Post = {
  id: string;             
  slug: string;
  title: string;
  excerpt: string;
  cover?: string;
  date: string;           // ISO
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

export default function Notes() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [peekSlug, setPeekSlug] = useState<string | null>(null);
  const [notes, setNotes] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const containerRef = useRef<HTMLElement | null>(null);

  /* ------------------------------ Fetch from DB ----------------------------- */
  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch('/api/content', { credentials: 'same-origin', cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ContentBundle = await res.json();

        // sort newest first; guard missing fields
        const clean = (json.notes || [])
          .filter(n => n && n.title && n.slug)
          .map(n => ({
            ...n,
            reading: n.reading || '5 min',
            tags: Array.isArray(n.tags) ? n.tags : [],
          }))
          .sort((a, b) => {
            const ad = new Date(a.date || 0).getTime();
            const bd = new Date(b.date || 0).getTime();
            return bd - ad;
          });

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

  /* --------------------------- Derived collections -------------------------- */
  const tags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach(p => p.tags?.forEach(t => t && set.add(t)));
    return ['all', ...Array.from(set)];
  }, [notes]);

  const featured = notes[0];
  const all = notes;

  // Filter across ALL posts (case-insensitive tag match + query search)
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

  // Show featured block only when "idle" (no query, no filter)
  const showFeatured = filter === 'all' && query.trim() === '' && !!featured;

  // Grid contents:
  // - idle: all minus featured
  // - filtering/searching: all matches (including featured if it matches)
  const gridPosts = useMemo(() => {
    if (showFeatured) return all.slice(1);
    return filteredAll;
  }, [showFeatured, filteredAll, all]);

  /* --------------------------- Soft reveal animation ------------------------ */
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('.reveal'));
    if (!nodes.length) return;

    nodes.forEach(n => n.classList.remove('in'));

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.15 }
    );

    nodes.forEach(n => io.observe(n));
    return () => io.disconnect();
  }, [filter, query, showFeatured, gridPosts.length]);

  /* --------------------------------- Helpers -------------------------------- */
  const openPeek = (slug: string) => setPeekSlug(slug);
  const closePeek = () => setPeekSlug(null);

  const fmtDate = (d: string) => {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString();
  };

  /* --------------------------------- Render --------------------------------- */
  return (
    <section
      id="notes"
      ref={containerRef as any}
      className="mx-auto mt-16 max-w-6xl px-4 pb-12 sm:mt-20 sm:pb-16"
    >
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <h2 className="text-left text-2xl font-extrabold">
          <span className="bg-gradient-to-r from-black to-[color:var(--brand)] bg-clip-text text-transparent dark:from-white dark:to-[color:var(--brand)]">
            Thoughts &amp; Field Notes
          </span>
        </h2>

        {/* search + rss */}
        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row">
          <div className="relative">
            <input
              placeholder="Search notes…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full rounded-lg border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm text-zinc-800 shadow-sm backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]
                         dark:border-zinc-700/50 dark:bg-zinc-900/70 dark:text-zinc-200"
            />
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400">⌘K</span>
          </div>
          <a
            href="/rss.xml"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm text-zinc-800 shadow-sm backdrop-blur hover:bg-white
                       dark:border-zinc-700/50 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            RSS
          </a>
        </div>
      </header>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setFilter(t)}
            aria-pressed={filter.toLowerCase() === t.toLowerCase()}
            className={[
              'rounded-full border px-3 py-1 text-xs font-medium transition',
              filter.toLowerCase() === t.toLowerCase()
                ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)] text-[color:var(--brand)]'
                : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/60',
            ].join(' ')}
          >
            {t === 'all' ? 'All' : t}
          </button>
        ))}
      </div>

      {/* Loading / error */}
      {loading && (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border border-zinc-200/70 bg-white/60 dark:border-zinc-700/50 dark:bg-zinc-900/60" />
          ))}
        </div>
      )}
      {!!err && !loading && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          Could not load notes: {err}
        </div>
      )}

      {/* Featured (only when idle) */}
      {!loading && !err && showFeatured && featured && (
        <article className="reveal mt-6 grid grid-cols-1 gap-5 rounded-2xl border border-zinc-200/70 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-zinc-700/50 dark:bg-zinc-900/70 sm:p-5 lg:grid-cols-2">
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-zinc-200/60 dark:border-zinc-700/50">
            <Image
              src={featured.cover || '/blog/placeholder.jpg'}
              alt={featured.title}
              fill
              className="object-cover"
              sizes="(max-width:1024px) 100vw, 520px"
              priority
            />
          </div>
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <time className="text-xs text-zinc-500 dark:text-zinc-400">{fmtDate(featured.date)}</time>
              <span className="rounded-full bg-[color:var(--brand-soft)] px-2 py-[2px] text-[11px] text-[color:var(--brand)]">
                {featured.reading}
              </span>
              {featured.tags.map(tag => (
                <span key={tag} className="rounded-md bg-zinc-500/10 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                  {tag}
                </span>
              ))}
            </div>
            <h3 className="mt-2 text-xl font-bold text-zinc-900 dark:text-zinc-100">{featured.title}</h3>
            <p className="mt-1 line-clamp-3 text-zinc-700 dark:text-zinc-300">{featured.excerpt}</p>
            <div className="mt-4 flex items-center gap-3">
              <Link
                href={`/notes/${featured.slug}`}
                className="rounded-md bg-[color:var(--brand)] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-95"
              >
                Read note
              </Link>
              <button
                onClick={() => openPeek(featured.slug)}
                className="rounded-md border border-zinc-200/70 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700/60 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
              >
                Quick peek
              </button>
            </div>
          </div>
        </article>
      )}

      {/* Two-column grid */}
      {!loading && !err && (
        <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {gridPosts.map((p, i) => (
            <li key={p.id} className="reveal">
              <article
                className="reel-frame grain p-4"
                style={{ animationDelay: `${(i % 4) * 60}ms` as any }}
              >
                {p.cover && (
                  <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-zinc-200/60 dark:border-zinc-700/50">
                    <Image
                      src={p.cover}
                      alt={p.title}
                      fill
                      className="object-cover"
                      sizes="(max-width:768px) 100vw, 600px"
                    />
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <time className="text-xs text-zinc-500 dark:text-zinc-400">{fmtDate(p.date)}</time>
                  <span className="rounded-full bg-[color:var(--brand-soft)] px-2 py-[2px] text-[11px] text-[color:var(--brand)]">
                    {p.reading}
                  </span>
                  {p.tags.map(tag => (
                    <span key={`${p.id}-${tag}`} className="rounded-md bg-zinc-500/10 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{p.title}</h3>
                <p className="line-clamp-3 text-sm text-zinc-700 dark:text-zinc-300">{p.excerpt}</p>
                <div className="mt-3 flex items-center justify-between">
                  <Link
                    href={`/notes/${p.slug}`}
                    className="text-sm text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-300"
                  >
                    Read note
                  </Link>
                  <button
                    onClick={() => openPeek(p.slug)}
                    className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  >
                    Quick peek
                  </button>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {!loading && !err && gridPosts.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed p-6 text-center text-sm text-zinc-500 dark:border-zinc-700/40 dark:text-zinc-400">
          No notes match that filter… yet.
        </div>
      )}

      <QuickPeek slug={peekSlug} onClose={closePeek} posts={notes} />
    </section>
  );
}
