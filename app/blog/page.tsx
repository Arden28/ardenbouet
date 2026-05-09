// app/blog/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { Header } from '../components/Header';

export const metadata: Metadata = {
  title: 'Field Notes · Arden BOUET',
  description:
    'Thoughts on software engineering, SaaS, IoT, and the craft of building production systems.',
};

export const revalidate = 0;
export const dynamic   = 'force-dynamic';

// ─── Types ───────────────────────────────────────────────────────────────────
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getBase() {
  const h     = headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host  = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  return `${proto}://${host}`;
}

function fmtDate(d?: string) {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

async function getNotes(): Promise<Post[]> {
  try {
    const res = await fetch(`${getBase()}/api/content`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return ((json.notes ?? []) as any[])
      .filter(n => n?.title && n?.slug)
      .map(n => ({
        ...n,
        reading: n.reading ?? '5 min',
        tags: Array.isArray(n.tags) ? n.tags : [],
      }))
      .sort(
        (a, b) =>
          new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
      );
  } catch {
    return [];
  }
}

// ─── Design primitives ───────────────────────────────────────────────────────
function Rule() {
  return <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function BlogPage() {
  const notes    = await getNotes();
  const featured = notes[0];
  const archive  = notes.slice(1);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:pt-16">

      {/* ── Section header ──────────────────────────────────────────── */}
      <Rule />
      <div className="flex items-baseline justify-between py-4">
        <h1 className="font-heading text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
          Field Notes
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
          {notes.length} note{notes.length !== 1 ? 's' : ''}
        </p>
      </div>
      <Rule />

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {notes.length === 0 && (
        <div className="py-24 text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
            No notes yet.
          </p>
        </div>
      )}

      {/* ── FEATURED — editorial inner-border split ──────────────────── */}
      {/*
        The latest note gets full editorial treatment: image left 50%,
        content right 50%, 1px inner border separating them.
        On hover, title transitions to the lime accent — a subtle reward.
      */}
      {featured && (
        <Link href={`/notes/${featured.slug}`} className="group mt-8 block">
          <article className="grid grid-cols-1 border border-zinc-200 dark:border-zinc-800 lg:grid-cols-2">

            {/* Cover */}
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
              <div className="flex aspect-[3/2] items-center justify-center border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 lg:border-b-0 lg:border-r">
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-300 dark:text-zinc-700">
                  No cover
                </span>
              </div>
            )}

            {/* Content */}
            <div className="flex flex-col p-6 lg:p-8">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Latest
                </span>
                <time className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                  {fmtDate(featured.date)}
                </time>
                <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                  {featured.reading}
                </span>
              </div>

              <h2
                className={[
                  'font-heading text-2xl font-bold leading-tight tracking-tight',
                  'text-zinc-900 dark:text-zinc-50',
                  'transition-colors duration-200',
                  'lg:text-3xl',
                ].join(' ')}
              >
                {featured.title}
              </h2>

              <p className="mt-3 flex-1 line-clamp-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {featured.excerpt}
              </p>

              {featured.tags.length > 0 && (
                <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-zinc-300 dark:text-zinc-700">
                  {featured.tags.join(' · ')}
                </p>
              )}

              <div className="mt-6">
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-700 dark:text-zinc-400 group-hover:text-[#2467AC] transition-colors duration-200">
                  Read note →
                </span>
              </div>
            </div>
          </article>
        </Link>
      )}

      {/* ── ARCHIVE — editorial date / title / reading list ──────────── */}
      {/*
        Each row: [date left, fixed width] [title, dominant] [reading, right].
        This reads like a newspaper's archive or a design journal index.
        No card backgrounds — just ruled lines and type.
      */}
      {archive.length > 0 && (
        <div className="mt-14">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600">
            Archive
          </p>
          <Rule />
          <ul>
            {archive.map(note => (
              <li key={note.id}>
                <Link
                  href={`/notes/${note.slug}`}
                  className="group flex items-baseline justify-between gap-4 py-4 transition-colors duration-150 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 px-1"
                >
                  {/* Left: date + title */}
                  <div className="flex min-w-0 items-baseline gap-5">
                    <time className="hidden shrink-0 font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 sm:block w-28">
                      {fmtDate(note.date)}
                    </time>
                    <h3 className="truncate font-heading text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50 group-hover:text-[#2467AC] transition-colors duration-200">
                      {note.title}
                    </h3>
                  </div>

                  {/* Right: reading time */}
                  <span className="shrink-0 font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
                    {note.reading}
                  </span>
                </Link>
                <Rule />
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}