// app/notes/[slug]/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { ScrollProgress, RichBody, Toc, ShareRow, Copyable, ArticleActions } from "./NoteClient";


export const revalidate = 0;          // always fresh
export const dynamic = 'force-dynamic';

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover?: string;
  date?: string;
  reading?: string;
  tags?: string[];
  bodyMd?: string;
  bodyHtml?: string;
};

type ContentBundle = {
  projects: unknown[];
  experiences: unknown[];
  journey: unknown[];
  notes: Post[];
};

// --- helpers ---
function getBaseUrl() {
  // Vercel/Node-friendly base URL constructor
  const h = headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  return `${proto}://${host}`;
}

function fmtDate(d?: string) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

async function getAllNotes(): Promise<Post[]> {
  const res = await fetch(`${getBaseUrl()}/api/content`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load content: ${res.status}`);
  const json = (await res.json()) as ContentBundle;

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
      return bd - ad; // newest first
    });

  return clean;
}

async function getNote(slug: string) {
  const notes = await getAllNotes();
  const idx = notes.findIndex(n => n.slug === slug);
  const note = notes[idx];
  if (!note) return { note: null, prev: null, next: null };

  const prev = idx > 0 ? notes[idx - 1] : null;               // previous in list (newer)
  const next = idx < notes.length - 1 ? notes[idx + 1] : null; // next in list (older)
  return { note, prev, next };
}

// --- SEO ---
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const { note } = await getNote(params.slug);
  if (!note) return { title: 'Not found' };

  const title = note.title;
  const description = note.excerpt ?? 'Note';
  const url = `${getBaseUrl()}/notes/${note.slug}`;
  const ogImages = note.cover ? [{ url: note.cover }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      images: ogImages,
    },
    twitter: {
      card: note.cover ? 'summary_large_image' : 'summary',
      title,
      description,
      images: note.cover ? [note.cover] : undefined,
    },
  };
}

// --- Page ---
export default async function NotePage({ params }: { params: { slug: string } }) {
  const { note, prev, next } = await getNote(params.slug);
  if (!note) notFound();

  return (
    <section className="mx-auto mt-12 max-w-3xl px-4 pb-20">
      <ScrollProgress />

      {/* Back link */}
      <div className="mb-4">
        <Link
          href="/#notes"
          className="text-sm text-[color:var(--brand)] underline-offset-2 hover:underline"
        >
          ← Back to notes
        </Link>
      </div>

      {/* Header */}
      <header>
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          {note.date && <time>{fmtDate(note.date)}</time>}
          {note.reading && (
            <span className="rounded-full bg-[color:var(--brand-soft)] px-2 py-[2px] text-[11px] text-[color:var(--brand)]">
              {note.reading}
            </span>
          )}
          {(note.tags ?? []).map((t) => (
            <span
              key={t}
              className="rounded-md bg-zinc-500/10 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300"
            >
              {t}
            </span>
          ))}
        </div>

        <h1 className="mt-2 text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
          {note.title}
        </h1>
        {note.excerpt && (
          <p className="mt-2 text-zinc-700 dark:text-zinc-300">{note.excerpt}</p>
        )}
      </header>

      {/* Cover */}
      {note.cover && (
        <div className="mt-5">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-zinc-200/60 dark:border-zinc-700/50">
            <Image
              src={note.cover}
              alt={note.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 880px"
              priority
            />
          </div>
        </div>
      )}

      {/* Body placeholder
          (Your current schema doesn't store a rich "body". If/when you add MD/MDX,
           render it here. For now we show a tidy placeholder.) */}
      <article
        id="note-article"
        className="prose prose-zinc mt-6 max-w-none rounded-2xl border border-zinc-200/70 bg-white/70 p-5 shadow-sm backdrop-blur dark:prose-invert dark:border-zinc-700/50 dark:bg-zinc-900/70"
      >
        <ArticleActions
          articleSelector="#note-article"
          permalink={`${getBaseUrl()}/notes/${note.slug}`}
          className="mb-4 flex flex-wrap items-center gap-2 not-prose"
        />

        {/* Render your rich HTML body when you add it to the note shape */}
        {/* For now you can keep your placeholder OR pass a real HTML string */}
        {note.bodyHtml ? (
          <RichBody html={note.bodyHtml ?? note.bodyMd ?? ""} />
        ):
        (
        <p>
          <em>This note currently has a short summary only. The full write-up will be published here.</em>
        </p>
        )}
      </article>


      {/* Prev / Next */}
      <nav className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          {prev ? (
            <Link
              href={`/notes/${prev.slug}`}
              className="block rounded-lg border border-zinc-200/70 bg-white/70 p-3 text-sm shadow-sm backdrop-blur hover:bg-white dark:border-zinc-700/50 dark:bg-zinc-900/70 dark:hover:bg-zinc-900"
            >
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Newer</div>
              <div className="line-clamp-2 font-medium text-zinc-800 dark:text-zinc-200">
                {prev.title}
              </div>
            </Link>
          ) : (
            <div className="rounded-lg border border-dashed p-3 text-xs text-zinc-400 dark:border-zinc-700/40">
              No newer note
            </div>
          )}
        </div>
        <div className="sm:text-right">
          {next ? (
            <Link
              href={`/notes/${next.slug}`}
              className="block rounded-lg border border-zinc-200/70 bg-white/70 p-3 text-sm shadow-sm backdrop-blur hover:bg-white dark:border-zinc-700/50 dark:bg-zinc-900/70 dark:hover:bg-zinc-900"
            >
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Older</div>
              <div className="line-clamp-2 font-medium text-zinc-800 dark:text-zinc-200">
                {next.title}
              </div>
            </Link>
          ) : (
            <div className="rounded-lg border border-dashed p-3 text-xs text-zinc-400 dark:border-zinc-700/40">
              No older note
            </div>
          )}
        </div>
      </nav>
    </section>
  );
}
