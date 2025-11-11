'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import ImageWithFallback from './ImageWithFallback';

type CaseFile = {
  problem: string;
  approach: string[];
  result: string;
  images?: { src: string; alt: string }[];
  tags?: string[];
  tech?: string[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  caseFile: CaseFile;
  activeImageIndex: number;
  setActiveImageIndex: (i: number) => void;
};

export default function CaseModal({
  open,
  onClose,
  title,
  caseFile,
  activeImageIndex,
  setActiveImageIndex,
}: Props) {
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const mediaFrameRef = useRef<HTMLDivElement | null>(null);
  const firstFocusRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusRef = useRef<HTMLButtonElement | null>(null);

  // ---- state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const [isFs, setIsFs] = useState(false);

  const images = useMemo(() => (caseFile.images ?? []).filter(Boolean), [caseFile.images]);
  const count = images.length;
  const current = count ? images[activeImageIndex % count] : null;
  const isVideo = current ? current.src.toLowerCase().endsWith('.mp4') : false;

  // ---- Lock body scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ---- Fullscreen sync
  useEffect(() => {
    const onFsChange = () => {
      setIsFs(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // ---- Keyboard
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // if in fullscreen, exit fullscreen first
        if (document.fullscreenElement) {
          void document.exitFullscreen();
          return;
        }
        e.preventDefault();
        onClose();
      }
      if (!count) return;
      if (e.key === 'ArrowRight') setActiveImageIndex((activeImageIndex + 1) % count);
      if (e.key === 'ArrowLeft') setActiveImageIndex((activeImageIndex - 1 + count) % count);
      if (e.key.toLowerCase() === 'f') toggleFullscreen();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeImageIndex, count, onClose, setActiveImageIndex]);

  // ---- Focus on open
  useEffect(() => {
    if (open) firstFocusRef.current?.focus();
  }, [open]);

  // ---- focus trap
  const onTrapFirst = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'Tab' || !e.shiftKey) return;
    e.preventDefault();
    lastFocusRef.current?.focus();
  };
  const onTrapLast = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'Tab' || e.shiftKey) return;
    e.preventDefault();
    firstFocusRef.current?.focus();
  };

  // ---- gestures
  const onTouchStart = (e: React.TouchEvent) => setTouchStartX(e.changedTouches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX == null || !count) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const THRESH = 40;
    if (dx > THRESH) setActiveImageIndex((activeImageIndex - 1 + count) % count);
    if (dx < -THRESH) setActiveImageIndex((activeImageIndex + 1) % count);
    setTouchStartX(null);
  };

  // ---- fullscreen
  const toggleFullscreen = () => {
    const el = mediaFrameRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      void el.requestFullscreen?.();
    } else {
      void document.exitFullscreen?.();
    }
  };

  // ---- close on backdrop
  const onBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      if (document.fullscreenElement) {
        void document.exitFullscreen();
        return;
      }
      onClose();
    }
  };

  if (!open) return null;

  const content = (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[70] overflow-y-auto"
      onMouseDown={onBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="casefile-title"
    >
      {/* Backdrop: vignette + subtle blur */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.55),rgba(0,0,0,0.75))] backdrop-blur-sm" />

      {/* Panel wrapper */}
      <div className="relative mx-auto my-4 w-full max-w-[110rem] px-3 sm:my-8 sm:px-6">
        <div
          ref={panelRef}
          className="
            relative overflow-hidden rounded-2xl border border-zinc-200/20 bg-zinc-50/80 shadow-2xl backdrop-blur
            dark:border-zinc-700/40 dark:bg-zinc-900/70
          "
        >
          {/* Top bar */}
          <div className="flex items-center justify-between gap-3 border-b border-zinc-200/50 px-3 py-2 dark:border-zinc-700/50 sm:px-4">
            <div className="min-w-0">
              <h2
                id="casefile-title"
                className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100 sm:text-base"
                title={`${title} — Case File`}
              >
                {title} <span className="font-medium opacity-70">• Case File</span>
              </h2>
              {(caseFile.tags?.length || caseFile.tech?.length) && (
                <div className="mt-1 flex max-w-full flex-wrap items-center gap-2">
                  {caseFile.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-zinc-300/60 bg-white/60 px-2 py-[2px] text-[11px] font-medium text-zinc-700 dark:border-zinc-700/60 dark:bg-zinc-800/60 dark:text-zinc-200"
                    >
                      {tag}
                    </span>
                  ))}
                  {caseFile.tech?.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-full border border-zinc-300/60 bg-white/60 px-2 py-[2px] text-[11px] font-medium text-zinc-700 dark:border-zinc-700/60 dark:bg-zinc-800/60 dark:text-zinc-200"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {count > 0 && (
                <>
                  <button
                    ref={firstFocusRef}
                    onClick={() => setFitMode((m) => (m === 'contain' ? 'cover' : 'contain'))}
                    onKeyDown={onTrapFirst}
                    className="rounded-md border border-zinc-200/60 bg-white/70 px-2 py-1 text-xs font-medium text-zinc-700 shadow-sm hover:bg-white dark:border-zinc-700/60 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-900"
                    title={fitMode === 'contain' ? 'Fill frame' : 'Fit inside'}
                  >
                    {fitMode === 'contain' ? 'Fill' : 'Fit'}
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="rounded-md border border-zinc-200/60 bg-white/70 px-2 py-1 text-xs font-medium text-zinc-700 shadow-sm hover:bg-white dark:border-zinc-700/60 dark:bg-zinc-900/70 dark:text-zinc-200 dark:hover:bg-zinc-900"
                    title={isFs ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
                  >
                    {isFs ? 'Exit FS' : 'Fullscreen'}
                  </button>
                </>
              )}

              <button
                onClick={onClose}
                className="rounded-md border border-zinc-200/60 bg-white/70 p-2 text-xs text-zinc-600 shadow-sm hover:bg-white dark:border-zinc-700/60 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:bg-zinc-900"
                aria-label="Close case file"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Media + Details grid */}
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-5">
            {/* Media column */}
            <div className="col-span-3 border-b border-zinc-200/50 dark:border-zinc-700/50 lg:border-b-0 lg:border-r">
              {count > 0 ? (
                <div className="p-3 sm:p-4">
                  <div
                    ref={mediaFrameRef}
                    className="group relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-zinc-200/60 bg-zinc-100/70 dark:border-zinc-700/50 dark:bg-zinc-900/40"
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                    onDoubleClick={toggleFullscreen}
                    aria-label="Case media"
                  >
                    {/* Current media */}
                    {isVideo ? (
                      <video
                        src={current!.src}
                        className={`h-full w-full ${fitMode === 'contain' ? 'object-contain' : 'object-cover'}`}
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <Image
                        src={current!.src}
                        alt={current!.alt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 66vw"
                        className={`${fitMode === 'contain' ? 'object-contain' : 'object-cover'}`}
                        priority={false}
                      />
                    )}

                    {/* Top-right overlay controls */}
                    <div className="pointer-events-none absolute right-2 top-2 z-10 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="pointer-events-auto select-none rounded-md bg-black/40 px-2 py-[2px] text-[11px] text-white backdrop-blur">
                        {activeImageIndex + 1} / {count}
                      </span>
                    </div>

                    {/* Prev / Next arrows */}
                    {count > 1 && (
                      <>
                        <button
                          onClick={() => setActiveImageIndex((activeImageIndex - 1 + count) % count)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur transition hover:bg-black/60"
                          aria-label="Previous media"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => setActiveImageIndex((activeImageIndex + 1) % count)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white backdrop-blur transition hover:bg-black/60"
                          aria-label="Next media"
                        >
                          →
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {count > 1 && (
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div
                        className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                      >
                        <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
                        {images.map((img, i) => {
                          const v = img.src.toLowerCase().endsWith('.mp4');
                          return (
                            <button
                              key={`${img.src}-${i}`}
                              onClick={() => setActiveImageIndex(i)}
                              className={`relative h-14 w-24 flex-none overflow-hidden rounded-md border ${
                                i === activeImageIndex
                                  ? 'border-[color:var(--brand)]'
                                  : 'border-zinc-200 dark:border-zinc-700'
                              } snap-start`}
                              aria-label={`Show item ${i + 1}`}
                            >
                              {v ? (
                                <video 
                                    src={img.src} 
                                    className="h-full w-full object-cover" 
                                    autoPlay
                                    loop
                                    muted
                                    playsInline 
                                />
                              ) : (
                                <ImageWithFallback
                                  src={img.src}
                                  alt={img.alt}
                                  className="h-full w-full object-cover"
                                  width={96}
                                  height={56}
                                  rounded=''
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Dots (compact) */}
                      <div className="hidden gap-1 lg:flex">
                        {images.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveImageIndex(i)}
                            className={`h-1.5 w-4 rounded-full ${
                              i === activeImageIndex ? 'bg-[color:var(--brand)]' : 'bg-zinc-300 dark:bg-zinc-700'
                            }`}
                            aria-label={`Go to ${i + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Caption */}
                  {current?.alt && (
                    <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                      {current.alt}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-dashed border-zinc-300 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                    No media yet.
                  </div>
                </div>
              )}
            </div>

            {/* Details column */}
            <div className="col-span-2">
              <div className="space-y-4 p-3 sm:p-5">
                {/* Problem */}
                <section className="rounded-xl border border-zinc-200/60 bg-white/70 p-4 shadow-sm dark:border-zinc-700/50 dark:bg-zinc-900/70">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Problem</h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {caseFile.problem}
                  </p>
                </section>

                {/* Approach */}
                <section className="rounded-xl border border-zinc-200/60 bg-white/70 p-4 shadow-sm dark:border-zinc-700/50 dark:bg-zinc-900/70">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Approach</h3>
                  <ol className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                    {caseFile.approach.map((step, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-[2px] inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-[color:var(--brand-soft)] text-[11px] font-semibold text-[color:var(--brand)]">
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </section>

                {/* Result */}
                <section className="rounded-xl border border-zinc-200/60 bg-white/70 p-4 shadow-sm dark:border-zinc-700/50 dark:bg-zinc-900/70">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Result</h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {caseFile.result}
                  </p>
                </section>

                {/* CTA row */}
                <div className="flex flex-col-reverse items-stretch gap-2 pt-2 sm:flex-row sm:justify-end">
                  <button
                    onClick={onClose}
                    className="rounded-md border border-zinc-200/60 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700/50 dark:text-zinc-300 dark:hover:bg-zinc-800/60 sm:min-w-[110px]"
                  >
                    Close
                  </button>
                  <a
                    href="#contact"
                    className="rounded-md bg-[color:var(--brand)] px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:opacity-95 sm:min-w-[150px]"
                  >
                    Discuss this build
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Focus sentinel */}
          <button ref={lastFocusRef} className="sr-only" aria-hidden tabIndex={0} onKeyDown={onTrapLast} />
        </div>
      </div>
    </div>
  );

  return typeof document === 'undefined' ? null : createPortal(content, document.body);
}
