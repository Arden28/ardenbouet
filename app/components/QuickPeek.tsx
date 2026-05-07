'use client';
import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

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

// ─── Motion ──────────────────────────────────────────────────────────────────
const EXPO     = [0.16, 1, 0.3, 1] as const;
const EXPO_OUT = [0.32, 0, 0.67, 0] as const;

/*
  The drawer slides in from the RIGHT — not a centered modal.
  This creates a "discovery panel" feel, keeping context visible on the left.
*/
const drawerVariants = {
  hidden: { x: '100%', opacity: 0 },
  show:   { x: 0, opacity: 1, transition: { duration: 0.45, ease: EXPO } },
  exit:   { x: '100%', opacity: 0, transition: { duration: 0.3, ease: EXPO_OUT } },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:   { opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (d: string) => {
  const dt = new Date(d);
  return isNaN(dt.getTime())
    ? d
    : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// ─── Component ───────────────────────────────────────────────────────────────
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
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // ── Keyboard + scroll lock ───────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    // Focus the close button on open
    requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && post && (
        <>
          {/* ── BACKDROP — lighter than CaseModal, this is a "peek" ─── */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed inset-0 z-[60] bg-zinc-900/25 backdrop-blur-[3px]"
            onClick={onClose}
            aria-hidden
          />

          {/* ── DRAWER ─────────────────────────────────────────────── */}
          {/*
            Full-height right-side panel.
            bg-[#F5F4F0]: the same warm paper used in CaseModal's detail panel.
            This creates visual continuity — "peek" and "case file" feel related.
          */}
          <motion.aside
            variants={drawerVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="peek-title"
            className={[
              'fixed right-0 top-0 z-[61]',
              'flex h-full flex-col',
              'w-full sm:w-[440px] lg:w-[480px]',
              'bg-[#F5F4F0]',
              'overflow-y-auto',
              // Hide scrollbar for cleanliness
              '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
            ].join(' ')}
          >

            {/* ── TOP BAR — sticky, minimal ──────────────────────── */}
            <div
              className={[
                'sticky top-0 z-10',
                'flex shrink-0 items-center justify-between',
                'border-b border-zinc-200 bg-[#F5F4F0]',
                'px-5 py-3',
              ].join(' ')}
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                Quick Peek
              </p>
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Close preview"
                className={[
                  'inline-flex h-7 w-7 items-center justify-center text-xs',
                  'border border-zinc-300',
                  'text-zinc-500',
                  'hover:border-zinc-900 hover:text-zinc-900',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900',
                ].join(' ')}
              >
                ✕
              </button>
            </div>

            {/* ── COVER IMAGE — full-width, no border-radius ─────── */}
            {post.cover ? (
              <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden border-b border-zinc-200">
                <Image
                  src={post.cover}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width:640px) 100vw, 480px"
                  priority
                />
              </div>
            ) : (
              /* No-cover fallback — ruled texture placeholder */
              <div className="flex aspect-[16/9] w-full shrink-0 items-center justify-center border-b border-zinc-200 bg-zinc-100">
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                  No cover image
                </span>
              </div>
            )}

            {/* ── CONTENT ────────────────────────────────────────── */}
            <div className="flex flex-1 flex-col p-5 sm:p-6">

              {/* Meta — monospace, dot-separated */}
              <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                <time className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                  {fmtDate(post.date)}
                </time>
                <span aria-hidden className="text-zinc-300">·</span>
                <span className="font-mono text-[10px] text-zinc-400">
                  {post.reading}
                </span>
              </div>

              {/* Title */}
              <h2
                id="peek-title"
                className="font-heading text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl"
              >
                {post.title}
              </h2>

              {/* Tags — monospace row, same as Notes grid */}
              {post.tags.length > 0 && (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                  {post.tags.join(' · ')}
                </p>
              )}

              {/* Ruled separator */}
              <div className="my-4 h-px w-full bg-zinc-200" />

              {/* Excerpt */}
              <p className="text-sm leading-relaxed text-zinc-700">
                {post.excerpt}
              </p>

              {/* Push actions to bottom */}
              <div className="flex-1" />

              {/* ── Actions ────────────────────────────────────────── */}
              <div className="mt-6 flex items-center gap-3 border-t border-zinc-200 pt-4">
                <Link
                  href={`/notes/${post.slug}`}
                  className={[
                    'flex-1 inline-flex items-center justify-center',
                    'bg-zinc-900',
                    'px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest',
                    'text-white',
                    'hover:bg-zinc-700',
                    'transition-colors duration-150',
                  ].join(' ')}
                >
                  Read full note →
                </Link>
                <button
                  onClick={onClose}
                  className={[
                    'border border-zinc-300',
                    'px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest',
                    'text-zinc-600',
                    'hover:border-zinc-900 hover:text-zinc-900',
                    'transition-colors duration-150',
                  ].join(' ')}
                >
                  Close
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}