'use client';
// Editorial bento gallery + immersive lightbox (zoom & pan, swipe, keyboard, thumbnail rail).
// Shared by project case studies and shop products.
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, Play, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export type GalleryItem = { src: string; alt?: string; caption?: string; kind?: 'image' | 'video' | 'embed' };

const isVideoUrl = (s: string) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(s);
function embedSrc(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1&dnt=1`;
  const loom = url.match(/loom\.com\/(?:share|embed)\/([a-f0-9]+)/);
  if (loom) return `https://www.loom.com/embed/${loom[1]}?autoplay=1`;
  return null;
}
function kindOf(it: GalleryItem): 'image' | 'video' | 'embed' {
  if (it.kind === 'embed' || embedSrc(it.src)) return 'embed';
  if (it.kind === 'video' || isVideoUrl(it.src)) return 'video';
  return 'image';
}
function ytThumb(url: string) {
  const id = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/)?.[1];
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

// Bento spans for up to 7 tiles; beyond that tiles repeat the 2-up rhythm.
const SPANS = [
  'sm:col-span-4 sm:row-span-2',
  'sm:col-span-2',
  'sm:col-span-2',
  'sm:col-span-3',
  'sm:col-span-3',
  'sm:col-span-2',
  'sm:col-span-4',
];

function Tile({ item, index, total, onOpen, span }: { item: GalleryItem; index: number; total: number; onOpen: () => void; span: string }) {
  const k = kindOf(item);
  const videoRef = useRef<HTMLVideoElement>(null);
  const poster = k === 'embed' ? ytThumb(item.src) : null;
  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => videoRef.current?.play().catch(() => {})}
      onMouseLeave={() => { const v = videoRef.current; if (v) { v.pause(); v.currentTime = 0; } }}
      className={`group relative col-span-6 overflow-hidden rounded-2xl bg-[#f2f2f2] text-left outline-none ring-[#1a8917] focus-visible:ring-2 ${span} aspect-[4/3] sm:aspect-auto`}
      aria-label={item.alt || item.caption || `Open media ${index + 1} of ${total}`}
    >
      {k === 'image' && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.src} alt={item.alt ?? ''} loading={index < 2 ? 'eager' : 'lazy'} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]" />
      )}
      {k === 'video' && <video ref={videoRef} src={item.src} muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover" />}
      {k === 'embed' && (poster
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]" />
        : <div className="absolute inset-0 bg-[#242424]" />)}

      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {k !== 'image' && (
        <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#242424] shadow-lg transition-transform duration-300 group-hover:scale-110">
          <Play className="ml-0.5 h-6 w-6 fill-current" />
        </span>
      )}
      <span className="absolute left-4 top-4 rounded-full bg-black/40 px-2 py-0.5 font-mono text-[11px] text-white/90 opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100">
        {String(index + 1).padStart(2, '0')}
      </span>
      {(item.caption || item.alt) && (
        <span className="absolute inset-x-4 bottom-4 translate-y-2 text-[14px] leading-5 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 line-clamp-2">
          {item.caption || item.alt}
        </span>
      )}
      <Maximize2 className="absolute right-4 top-4 h-4 w-4 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </button>
  );
}

function Lightbox({ items, start, onClose }: { items: GalleryItem[]; start: number; onClose: () => void }) {
  const [i, setI] = useState(start);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const touch = useRef<number | null>(null);
  const item = items[i];
  const k = kindOf(item);
  const go = useCallback((d: number) => { setZoom(false); setI(x => (x + d + items.length) % items.length); }, [items.length]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [go, onClose]);

  // Preload neighbours
  useEffect(() => {
    [items[(i + 1) % items.length], items[(i - 1 + items.length) % items.length]].forEach(n => {
      if (n && kindOf(n) === 'image') { const img = new Image(); img.src = n.src; }
    });
  }, [i, items]);

  return createPortal(
    <div className="fixed inset-0 z-[400] flex flex-col bg-[#0b0b0b]/[0.97] text-white" role="dialog" aria-modal="true" aria-label="Gallery">
      <div className="flex items-center justify-between px-5 py-4">
        <span className="font-mono text-[13px] tracking-wider text-white/70">{String(i + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
        <div className="flex items-center gap-1">
          {k === 'image' && (
            <button type="button" onClick={() => setZoom(z => !z)} className="rounded-full p-2.5 text-white/80 hover:bg-white/10 hover:text-white" aria-label={zoom ? 'Zoom out' : 'Zoom in'}>
              {zoom ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
            </button>
          )}
          <button type="button" onClick={onClose} className="rounded-full p-2.5 text-white/80 hover:bg-white/10 hover:text-white" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 sm:px-20"
        onTouchStart={e => { touch.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (touch.current === null || zoom) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        <div key={i} className="flex h-full w-full items-center justify-center animate-[gallery-in_.35s_ease-out]">
          {k === 'image' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.src}
              alt={item.alt ?? ''}
              onClick={e => {
                if (!zoom) {
                  const r = (e.target as HTMLImageElement).getBoundingClientRect();
                  setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
                }
                setZoom(z => !z);
              }}
              onMouseMove={e => {
                if (!zoom) return;
                const r = (e.currentTarget as HTMLImageElement).getBoundingClientRect();
                setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
              }}
              style={{ transform: zoom ? 'scale(2.2)' : 'scale(1)', transformOrigin: origin }}
              className={`max-h-full max-w-full select-none object-contain transition-transform duration-300 ${zoom ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
              draggable={false}
            />
          )}
          {k === 'video' && <video src={item.src} controls autoPlay playsInline className="max-h-full max-w-full" />}
          {k === 'embed' && (
            <div className="aspect-video w-full max-w-[1100px] overflow-hidden rounded-lg bg-black">
              <iframe src={embedSrc(item.src)!} title={item.alt || 'Video'} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="h-full w-full border-0" />
            </div>
          )}
        </div>

        {items.length > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur transition-colors hover:bg-white/20 sm:block" aria-label="Previous"><ChevronLeft className="h-6 w-6" /></button>
            <button type="button" onClick={() => go(1)} className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur transition-colors hover:bg-white/20 sm:block" aria-label="Next"><ChevronRight className="h-6 w-6" /></button>
          </>
        )}
      </div>

      {(item.caption || item.alt) && <p className="mx-auto max-w-[720px] px-6 pt-4 text-center font-story text-[17px] leading-7 text-white/80">{item.caption || item.alt}</p>}

      {items.length > 1 && (
        <div className="no-scrollbar mx-auto flex max-w-full gap-2 overflow-x-auto px-5 py-5">
          {items.map((it, j) => {
            const tk = kindOf(it);
            const thumb = tk === 'image' ? it.src : tk === 'embed' ? ytThumb(it.src) : null;
            return (
              <button key={j} type="button" onClick={() => { setZoom(false); setI(j); }} aria-label={`Show ${j + 1}`}
                className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-md transition-all ${j === i ? 'opacity-100 ring-2 ring-white' : 'opacity-40 hover:opacity-80'}`}>
                {thumb
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={thumb} alt="" className="h-full w-full object-cover" />
                  : tk === 'video' ? <video src={it.src} muted preload="metadata" className="h-full w-full object-cover" /> : <span className="block h-full w-full bg-white/10" />}
                {tk !== 'image' && <Play className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 fill-white text-white" />}
              </button>
            );
          })}
        </div>
      )}
    </div>,
    document.body,
  );
}

export function Gallery({ items, className = '' }: { items: GalleryItem[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!items.length) return null;
  // A single item renders as a wide figure; two as an even split; 3+ as the bento.
  const spans = items.length === 1 ? ['sm:col-span-6'] : items.length === 2 ? ['sm:col-span-3', 'sm:col-span-3'] : SPANS;
  return (
    <div className={className}>
      <div className="grid auto-rows-[minmax(0,1fr)] grid-cols-6 gap-3 sm:auto-rows-[220px] lg:auto-rows-[260px]">
        {items.map((it, idx) => (
          <Tile key={`${it.src}-${idx}`} item={it} index={idx} total={items.length} onOpen={() => setOpen(idx)}
            span={`${spans[idx % spans.length]} ${items.length <= 2 ? 'sm:!aspect-auto sm:row-span-2' : ''}`} />
        ))}
      </div>
      {open !== null && <Lightbox items={items} start={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
