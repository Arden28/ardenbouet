'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Play } from 'lucide-react';
import type { ProductMediaItem } from '@/app/admin/types';

// ─── Embed helpers ─────────────────────────────────────────────────────────────
function getEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0`;

  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;

  const loom = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loom) return `https://www.loom.com/embed/${loom[1]}?autoplay=1`;

  return null;
}

function isDirectVideo(url: string) {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ item, onClose }: { item: ProductMediaItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const embedUrl = item.kind === 'video' ? getEmbedUrl(item.url) : null;
  const isDirect  = item.kind === 'video' && !embedUrl && isDirectVideo(item.url);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.label}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center border border-white/20 text-white/70 transition-colors hover:border-white hover:text-white focus-visible:outline-none"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Content — stop propagation so clicking media doesn't close modal */}
      <div
        className="relative flex max-h-[90vh] w-full max-w-5xl flex-col"
        onClick={e => e.stopPropagation()}
      >
        {item.kind === 'image' ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.url}
            alt={item.label}
            className="max-h-[80vh] w-full object-contain"
          />
        ) : embedUrl ? (
          <div className="relative aspect-video w-full bg-black">
            <iframe
              src={embedUrl}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
              title={item.label}
            />
          </div>
        ) : isDirect ? (
          <video
            src={item.url}
            controls
            autoPlay
            className="max-h-[80vh] w-full bg-black"
          />
        ) : (
          /* Fallback: unknown video source — open externally */
          <div className="flex flex-col items-center gap-4 py-16 text-center text-white">
            <p className="font-mono text-sm text-zinc-400">{item.label}</p>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/30 px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest text-white transition-colors hover:border-white"
            >
              Open video →
            </a>
          </div>
        )}

        {/* Caption */}
        {(item.label || item.description) && (
          <div className="mt-3 px-1">
            {item.label && (
              <p className="font-mono text-sm font-medium text-white">{item.label}</p>
            )}
            {item.description && (
              <p className="mt-0.5 text-sm leading-relaxed text-zinc-400">{item.description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────────
function MediaCard({ item, onClick }: { item: ProductMediaItem; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group block w-full border border-zinc-200 dark:border-zinc-800 text-left transition-colors duration-150 hover:border-zinc-900 dark:hover:border-zinc-100 focus-visible:outline-none focus-visible:border-zinc-900"
    >
      {item.kind === 'image' ? (
        <div className="aspect-[16/9] overflow-hidden bg-zinc-50 dark:bg-zinc-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.url}
            alt={item.label}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
        </div>
      ) : (
        <div className="relative aspect-[16/9] overflow-hidden bg-zinc-950 flex items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center border border-white/20 transition-colors duration-150 group-hover:border-white/60 group-hover:bg-white/10">
            <Play className="ml-0.5 h-5 w-5 text-white" fill="currentColor" />
          </div>
          <span className="absolute bottom-2 right-2 border border-white/20 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest text-white/50">
            video
          </span>
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-mono text-xs font-medium text-zinc-900 dark:text-zinc-50">
            {item.label}
          </p>
          <span className="shrink-0 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest text-zinc-400">
            {item.kind}
          </span>
        </div>
        {item.description && (
          <p className="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {item.description}
          </p>
        )}
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors duration-150 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
          {item.kind === 'video' ? 'Play →' : 'View →'}
        </p>
      </div>
    </button>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function MediaViewer({ items }: { items: ProductMediaItem[] }) {
  const [active, setActive] = useState<ProductMediaItem | null>(null);
  const close = useCallback(() => setActive(null), []);

  if (!items.length) return null;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((item, i) => (
          <MediaCard key={i} item={item} onClick={() => setActive(item)} />
        ))}
      </div>

      {active && <Modal item={active} onClose={close} />}
    </>
  );
}
