'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Play, X } from 'lucide-react';

type MediaItem = { src: string; alt: string };

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

function isVideoSrc(src: string) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src);
}

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } },
};

const frameVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: EXPO } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } },
};

// ─── Tile ───────────────────────────────────────────────────────────────────
function Tile({
  item,
  featured,
  onClick,
}: {
  item: MediaItem;
  featured?: boolean;
  onClick: () => void;
}) {
  const video = isVideoSrc(item.src);
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group relative block w-full overflow-hidden border border-zinc-200 bg-zinc-50 text-left dark:border-zinc-800 dark:bg-zinc-900',
        'transition-colors duration-150 hover:border-zinc-900 dark:hover:border-zinc-100',
        featured ? 'aspect-[16/9] sm:col-span-2' : 'aspect-[4/3]',
      ].join(' ')}
      aria-label={item.alt || 'Open media'}
    >
      {video ? (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
          <video
            src={item.src}
            className="absolute inset-0 h-full w-full object-cover opacity-60"
            muted
            playsInline
            preload="metadata"
          />
          <span className="relative flex h-11 w-11 items-center justify-center border border-white/30 bg-black/40 backdrop-blur-sm transition-colors duration-150 group-hover:border-white/70 group-hover:bg-black/60">
            <Play className="ml-0.5 h-4 w-4 text-white" fill="currentColor" />
          </span>
          <span className="absolute bottom-2 right-2 border border-white/20 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest text-white/60">
            video
          </span>
        </div>
      ) : (
        <Image
          src={item.src}
          alt={item.alt}
          fill
          sizes={featured ? '(max-width: 640px) 100vw, 66vw' : '(max-width: 640px) 100vw, 33vw'}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
        />
      )}

      {item.alt && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <span className="font-mono text-[10px] text-white/90 line-clamp-1">{item.alt}</span>
        </span>
      )}
    </button>
  );
}

// ─── Main export ────────────────────────────────────────────────────────────
export default function ProjectGallery({ images }: { images: MediaItem[] }) {
  const items = useMemo(() => images.filter(i => i?.src), [images]);
  const count = items.length;
  const [index, setIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const close = useCallback(() => setIndex(null), []);
  const next = useCallback(() => setIndex(i => (i === null ? null : (i + 1) % count)), [count]);
  const prev = useCallback(() => setIndex(i => (i === null ? null : (i - 1 + count) % count)), [count]);

  useEffect(() => {
    if (index === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [index, close, next, prev]);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.changedTouches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 40) prev();
    if (dx < -40) next();
    touchStartX.current = null;
  };

  if (count === 0) return null;

  const current = index !== null ? items[index] : null;
  const currentIsVideo = current ? isVideoSrc(current.src) : false;
  const showFeatured = count >= 3;

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item, i) => (
          <Tile
            key={`${item.src}-${i}`}
            item={item}
            featured={showFeatured && i === 0}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {current && (
              <motion.div
                variants={backdropVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                onClick={e => { if (e.target === e.currentTarget) close(); }}
                className="fixed inset-0 z-[70] flex flex-col bg-[#0A0A0A]/97 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                aria-label="Media viewer"
              >
                {/* Top bar */}
                <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 sm:px-6">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    {count > 1 ? `${index! + 1} / ${count}` : ''}
                  </span>
                  <button
                    onClick={close}
                    aria-label="Close"
                    className="inline-flex h-9 w-9 items-center justify-center border border-zinc-800 text-zinc-400 transition-colors duration-150 hover:border-zinc-200 hover:text-zinc-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Media frame */}
                <div
                  className="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-4 sm:px-8"
                  onTouchStart={onTouchStart}
                  onTouchEnd={onTouchEnd}
                >
                  <motion.div
                    key={index}
                    variants={frameVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="relative h-full w-full"
                  >
                    {currentIsVideo ? (
                      <video
                        src={current!.src}
                        className="mx-auto h-full max-h-[75vh] w-full object-contain"
                        controls
                        autoPlay
                        playsInline
                      />
                    ) : (
                      <Image
                        src={current!.src}
                        alt={current!.alt}
                        fill
                        sizes="100vw"
                        className="object-contain"
                        priority
                      />
                    )}
                  </motion.div>

                  {count > 1 && (
                    <>
                      <button
                        onClick={prev}
                        aria-label="Previous"
                        className="absolute left-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-zinc-800 bg-zinc-950/70 text-zinc-300 backdrop-blur-sm transition-colors duration-150 hover:border-zinc-500 hover:text-white sm:left-3"
                      >
                        ←
                      </button>
                      <button
                        onClick={next}
                        aria-label="Next"
                        className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-zinc-800 bg-zinc-950/70 text-zinc-300 backdrop-blur-sm transition-colors duration-150 hover:border-zinc-500 hover:text-white sm:right-3"
                      >
                        →
                      </button>
                    </>
                  )}
                </div>

                {/* Caption + thumbnails */}
                <div className="shrink-0 border-t border-zinc-900 px-4 py-3 sm:px-6">
                  {current?.alt && (
                    <p className="mb-3 font-mono text-[10px] text-zinc-500">{current.alt}</p>
                  )}
                  {count > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {items.map((img, i) => {
                        const active = i === index;
                        const thumbVideo = isVideoSrc(img.src);
                        return (
                          <button
                            key={`${img.src}-${i}`}
                            onClick={() => setIndex(i)}
                            aria-label={`Show item ${i + 1}`}
                            className={[
                              'relative h-12 w-20 shrink-0 overflow-hidden border transition-[border-color,opacity] duration-150',
                              active ? 'border-[#2467AC] opacity-100' : 'border-zinc-800 opacity-50 hover:opacity-80',
                            ].join(' ')}
                          >
                            {thumbVideo ? (
                              <div className="flex h-full w-full items-center justify-center bg-zinc-900">
                                <Play className="h-3 w-3 text-zinc-400" fill="currentColor" />
                              </div>
                            ) : (
                              <Image src={img.src} alt={img.alt} fill sizes="80px" className="object-cover" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
