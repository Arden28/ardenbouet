'use client';
import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

type Post = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  cover?: string;
  date: string;
  reading: string;
  tags: string[];
};

export default function QuickPeek({
  slug,
  onClose,
  posts,
}: {
  slug: string | null;
  onClose: () => void;
  posts: Post[];
}) {
  const open = !!slug;
  const post = useMemo(() => posts.find(p => p.slug === slug), [slug, posts]);
  const firstRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    firstRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !post) return null;

  const content = (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-xl dark:border-zinc-700/50 dark:bg-zinc-900 sm:p-6">
          <div className="flex items-start justify-between">
            <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{post.title}</h4>
            <button
              ref={firstRef}
              onClick={onClose}
              className="rounded-md border border-zinc-200/60 p-2 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700/50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {post.cover && (
            <div className="mt-3 relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-zinc-200/60 dark:border-zinc-700/50">
              <Image src={post.cover} alt={post.title} fill className="object-cover" />
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <time className="text-xs text-zinc-500 dark:text-zinc-400">{new Date(post.date).toLocaleDateString()}</time>
            <span className="rounded-full bg-[color:var(--brand-soft)] px-2 py-[2px] text-[11px] text-[color:var(--brand)]">
              {post.reading}
            </span>
            {post.tags.map(tag => (
              <span key={tag} className="rounded-md bg-zinc-500/10 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                {tag}
              </span>
            ))}
          </div>

          <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
            {post.excerpt}
          </p>

          <div className="mt-4 flex items-center justify-end gap-2">
            <a
              href={`/notes/${post.slug}`}
              className="rounded-md bg-[color:var(--brand)] px-3 py-1.5 text-sm font-semibold text-white hover:opacity-95"
            >
              Read full
            </a>
            <button
              onClick={onClose}
              className="rounded-md border border-zinc-200/60 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700/50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document === 'undefined' ? null : createPortal(content, document.body);
}
