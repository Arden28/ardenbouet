// app/notes/[slug]/page.tsx — Header provided by layout.tsx
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import nextDynamic from 'next/dynamic';
import type { Metadata } from 'next';
import type { ContentBundle, Note } from '@/app/admin/types';
import { mdToSafeHtml } from '@/lib/mardown';
import { RichBody, ShareRow, ArticleActions } from './NoteClient';

// ssr: false prevents framer-motion v12 hydration mismatches and browser-API errors
const ScrollProgress = nextDynamic(
  () => import('./NoteClient').then(m => ({ default: m.ScrollProgress })),
  { ssr: false }
);
const Toc = nextDynamic(
  () => import('./NoteClient').then(m => ({ default: m.Toc })),
  { ssr: false }
);
const CommentSection = nextDynamic(
  () => import('./NoteClient').then(m => ({ default: m.CommentSection })),
  { ssr: false }
);

export const dynamic = 'force-dynamic';

// ─── Data ─────────────────────────────────────────────────────────────────────
async function getNote(slug: string): Promise<Note | null> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const row = await prisma.content.findUnique({ where: { id: 1 } });
    const bundle = row?.data as ContentBundle | null;
    return bundle?.notes?.find(n => n.slug === slug) ?? null;
  } catch {
    return null;
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const note = await getNote(params.slug);
  if (!note) return {};
  return {
    title: `${note.title} · Notes · Arden BOUET`,
    description: note.excerpt,
    openGraph: {
      title: note.title,
      description: note.excerpt,
      ...(note.cover ? { images: [{ url: note.cover }] } : {}),
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function NotePage({ params }: { params: { slug: string } }) {
  const note = await getNote(params.slug);
  if (!note) notFound();

  const html = mdToSafeHtml(note.bodyMd ?? '');
  const permalink = `https://ardenbouet.com/notes/${note.slug}`;

  return (
    <>
      <ScrollProgress />

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-zinc-950 text-white">
        <div className="absolute inset-y-0 left-0 w-[3px] bg-[#2467AC]" />

        <div className="mx-auto max-w-5xl px-6 pb-12 pt-10 sm:pt-16">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-600"
          >
            <Link href="/notes" className="transition-colors duration-150 hover:text-zinc-300">
              Notes
            </Link>
            <span aria-hidden>·</span>
            <span className="truncate text-zinc-400 max-w-[200px]">{note.title}</span>
          </nav>

          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {note.tags.map(tag => (
                <span
                  key={tag}
                  className="border border-zinc-700 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="mt-5 break-words font-heading text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            {note.title}
          </h1>

          {/* Excerpt */}
          {note.excerpt && (
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-400">
              {note.excerpt}
            </p>
          )}

          {/* Meta row */}
          <div className="mt-6 flex flex-wrap items-center gap-5">
            {note.date && (
              <time
                dateTime={note.date}
                className="font-mono text-[10px] uppercase tracking-widest text-zinc-500"
              >
                {note.date}
              </time>
            )}
            {note.reading && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                {note.reading} read
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── COVER ─────────────────────────────────────────────────────────────── */}
      {note.cover && (
        <div className="relative mt-10 sm:mt-14">
          {/* Full-bleed on mobile, contained on desktop */}
          <div className="mx-auto max-w-5xl px-0 sm:px-6">
            <div className="relative aspect-[4/3] overflow-hidden bg-zinc-900 shadow-2xl sm:aspect-[21/9]">
              <Image
                src={note.cover}
                alt={note.title}
                fill
                className="object-cover opacity-90"
                sizes="(max-width:640px) 100vw, (max-width:1024px) 100vw, 960px"
                priority
              />
              {/* Subtle bottom gradient to blend into page */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/30 to-transparent dark:from-zinc-950/40" />
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENT ───────────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-14 sm:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_220px]">

          {/* Article */}
          <div className="min-w-0">
            <article className="notes-prose">
              <RichBody html={html} />
            </article>

            {/* Share row */}
            <div className="mt-12 border-t border-zinc-200 pt-8 dark:border-zinc-800">
              <ShareRow title={note.title} url={permalink} />
            </div>

            {/* Comment section */}
            <CommentSection slug={note.slug} noteTitle={note.title} />
          </div>

          {/* Sticky sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-8">

              {/* TOC */}
              <div>
                <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600">
                  Contents
                </p>
                <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 mb-3" />
                <Toc />
              </div>

              {/* Actions */}
              <div>
                <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600">
                  Actions
                </p>
                <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 mb-3" />
                <ArticleActions
                  articleSelector="article"
                  permalink={permalink}
                  className="flex flex-col items-start gap-2"
                />
              </div>

              {/* Back link */}
              <Link
                href="/notes"
                className="block font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                ← All notes
              </Link>
            </div>
          </aside>
        </div>

        {/* Mobile back link */}
        <div className="mt-8 lg:hidden">
          <Link
            href="/notes"
            className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            ← All notes
          </Link>
        </div>
      </main>
    </>
  );
}
