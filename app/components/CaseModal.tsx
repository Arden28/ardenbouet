'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import ImageWithFallback from './ImageWithFallback';

// ─── Types ──────────────────────────────────────────────────────────────────
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

// ─── Motion config ──────────────────────────────────────────────────────────
const EXPO: [number, number, number, number]     = [0.16, 1, 0.3, 1];
const EXPO_OUT: [number, number, number, number] = [0.32, 0, 0.67, 0];

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  exit:   { opacity: 0, transition: { duration: 0.3,  ease: 'easeIn' } },
};

// Media area fades + scales in from darkness
const mediaVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.6, ease: EXPO, delay: 0.12 } },
};

// Right detail panel slides in from the right
const detailVariants: Variants = {
  hidden: { x: 48, opacity: 0 },
  show:   { x: 0,  opacity: 1, transition: { duration: 0.55, ease: EXPO, delay: 0.08 } },
  exit:   { x: 48, opacity: 0, transition: { duration: 0.3,  ease: EXPO_OUT } },
};

// Content sections stagger in after panel arrives
const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show:   (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: EXPO, delay: 0.25 + i * 0.09 },
  }),
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** 01, 02, 03 … */
const ordinal = (n: number) => String(n).padStart(2, '0');

/** Thin ruled line — same motif as Hero / Header / Projects */
function Rule({ className = '' }: { className?: string }) {
  return <div className={`h-px bg-zinc-200 ${className}`} />;
}

/** Diagonal arrow icon for "Discuss" CTA */
function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 10 10" className={className} aria-hidden>
      <path fill="currentColor" d="M1 1h8v8H7.5V3.621L2.56 8.56 1.44 7.44 6.379 2.5H1V1Z" />
    </svg>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function CaseModal({
  open,
  onClose,
  title,
  caseFile,
  activeImageIndex,
  setActiveImageIndex,
}: Props) {
  const backdropRef    = useRef<HTMLDivElement | null>(null);
  const mediaFrameRef  = useRef<HTMLDivElement | null>(null);
  const firstFocusRef  = useRef<HTMLButtonElement | null>(null);
  const lastFocusRef   = useRef<HTMLButtonElement | null>(null);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [fitMode, setFitMode]         = useState<'contain' | 'cover'>('contain');
  const [isFs, setIsFs]               = useState(false);

  const images  = useMemo(() => (caseFile.images ?? []).filter(Boolean), [caseFile.images]);
  const count   = images.length;
  const current = count ? images[activeImageIndex % count] : null;
  const isVideo = current?.src.toLowerCase().endsWith('.mp4') ?? false;

  // ── Body scroll lock ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // ── Fullscreen sync ───────────────────────────────────────────────────
  useEffect(() => {
    const onChange = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // ── Keyboard handling ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) { void document.exitFullscreen(); return; }
        e.preventDefault();
        onClose();
      }
      if (!count) return;
      if (e.key === 'ArrowRight') setActiveImageIndex((activeImageIndex + 1) % count);
      if (e.key === 'ArrowLeft')  setActiveImageIndex((activeImageIndex - 1 + count) % count);
      if (e.key.toLowerCase() === 'f') toggleFullscreen();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeImageIndex, count, onClose, setActiveImageIndex]);

  // ── Focus management ──────────────────────────────────────────────────
  useEffect(() => { if (open) firstFocusRef.current?.focus(); }, [open]);

  // ── Focus trap ────────────────────────────────────────────────────────
  const onTrapFirst = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); lastFocusRef.current?.focus(); }
  };
  const onTrapLast = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); firstFocusRef.current?.focus(); }
  };

  // ── Touch / swipe ─────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => setTouchStartX(e.changedTouches[0].clientX);
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX == null || !count) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (dx >  40) setActiveImageIndex((activeImageIndex - 1 + count) % count);
    if (dx < -40) setActiveImageIndex((activeImageIndex + 1) % count);
    setTouchStartX(null);
  };

  // ── Fullscreen ────────────────────────────────────────────────────────
  const toggleFullscreen = () => {
    const el = mediaFrameRef.current;
    if (!el) return;
    if (!document.fullscreenElement) void el.requestFullscreen?.();
    else                              void document.exitFullscreen?.();
  };

  // ── Backdrop click ────────────────────────────────────────────────────
  const onBackdropClick = (e: React.MouseEvent) => {
    if (e.target !== backdropRef.current) return;
    if (document.fullscreenElement) { void document.exitFullscreen(); return; }
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        /*
          BACKDROP — true full-screen overlay.
          Near-black #0A0A0A: cinematic, not generic modal-grey.
        */
        <motion.div
          ref={backdropRef}
          variants={backdropVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          onClick={onBackdropClick}
          className="fixed inset-0 z-[70] flex flex-col bg-[#0A0A0A]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="casefile-title"
        >

          {/* ── TOP BAR ──────────────────────────────────────────────── */}
          {/*
            Full-width. Dark bg. Left: title + meta. Right: controls.
            Height is intentionally compact — the media should dominate.
          */}
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-zinc-800 px-4 py-3 sm:px-6">

            {/* Left: title + tags/tech */}
            <div className="min-w-0">
              <h2
                id="casefile-title"
                className="font-heading text-sm font-bold text-zinc-100 sm:text-base"
                title={`${title} — Case File`}
              >
                <span className="truncate">{title}</span>
                <span className="ml-2 font-normal text-zinc-500">· Case File</span>
              </h2>
              {(caseFile.tags?.length || caseFile.tech?.length) && (
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                  {[...(caseFile.tags ?? []), ...(caseFile.tech ?? [])].join(' · ')}
                </p>
              )}
            </div>

            {/* Right: controls */}
            <div className="flex shrink-0 items-center gap-2">
              {count > 0 && (
                <>
                  {/* Fit/Fill toggle */}
                  <button
                    ref={firstFocusRef}
                    onKeyDown={onTrapFirst}
                    onClick={() => setFitMode(m => m === 'contain' ? 'cover' : 'contain')}
                    className={[
                      'hidden sm:inline-flex items-center',
                      'border border-zinc-800 px-2.5 py-1',
                      'font-mono text-[10px] uppercase tracking-widest text-zinc-400',
                      'hover:border-zinc-600 hover:text-zinc-200 transition-colors',
                    ].join(' ')}
                    title={fitMode === 'contain' ? 'Fill frame' : 'Fit inside'}
                  >
                    {fitMode === 'contain' ? 'Fill' : 'Fit'}
                  </button>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className={[
                      'hidden sm:inline-flex items-center',
                      'border border-zinc-800 px-2.5 py-1',
                      'font-mono text-[10px] uppercase tracking-widest text-zinc-400',
                      'hover:border-zinc-600 hover:text-zinc-200 transition-colors',
                    ].join(' ')}
                    title={isFs ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
                  >
                    {isFs ? 'Exit FS' : 'Full ↗'}
                  </button>
                </>
              )}

              {/* Close */}
              <button
                onClick={onClose}
                aria-label="Close case file"
                className={[
                  'inline-flex h-8 w-8 items-center justify-center',
                  'border border-zinc-800 text-zinc-400',
                  'hover:border-zinc-200 hover:text-zinc-100',
                  'transition-colors duration-150 text-sm',
                ].join(' ')}
              >
                ✕
              </button>
            </div>
          </div>

          {/* ── MAIN SPLIT ───────────────────────────────────────────── */}
          {/*
            Desktop: 60 / 40 split — media theatre left, case study right.
            Mobile: single column — media on top, scrollable detail below.
            The contrast between the near-black left and warm-white right
            creates the "cinematic press kit" split-screen effect.
          */}
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">

            {/* ── LEFT: MEDIA PANEL ──────────────────────────────────── */}
            <motion.div
              variants={mediaVariants}
              initial="hidden"
              animate="show"
              className="relative flex flex-col bg-[#0A0A0A] lg:w-[60%]"
            >
              {count > 0 ? (
                <>
                  {/* Main image / video frame */}
                  <div
                    ref={mediaFrameRef}
                    className={[
                      'group relative flex-1 overflow-hidden',
                      // Mobile: fixed height; Desktop: fills remaining space
                      'h-[45vw] max-h-[55vh] lg:h-auto lg:max-h-none',
                    ].join(' ')}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                    onDoubleClick={toggleFullscreen}
                    aria-label="Case media"
                  >
                    {isVideo ? (
                      <video
                        src={current!.src}
                        className={`h-full w-full ${fitMode === 'contain' ? 'object-contain' : 'object-cover'}`}
                        autoPlay loop muted playsInline
                      />
                    ) : (
                      current && (
                        <Image
                          src={current.src}
                          alt={current.alt}
                          fill
                          sizes="(max-width: 1024px) 100vw, 60vw"
                          className={fitMode === 'contain' ? 'object-contain' : 'object-cover'}
                          priority={false}
                        />
                      )
                    )}

                    {/* Counter badge — top right, appears on hover */}
                    {count > 1 && (
                      <span className="pointer-events-none absolute right-3 top-3 font-mono text-[10px] uppercase tracking-widest text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100">
                        {activeImageIndex + 1} / {count}
                      </span>
                    )}

                    {/* Prev / Next — transparent full-height click zones */}
                    {count > 1 && (
                      <>
                        <button
                          onClick={() => setActiveImageIndex((activeImageIndex - 1 + count) % count)}
                          aria-label="Previous media"
                          className={[
                            'absolute left-0 top-0 flex h-full w-1/4 items-center justify-start pl-3',
                            'text-zinc-500 opacity-0 transition-opacity hover:opacity-100',
                            'focus-visible:opacity-100 focus-visible:outline-none',
                          ].join(' ')}
                        >
                          <span className="flex h-8 w-8 items-center justify-center border border-zinc-700 bg-zinc-900/80 text-sm backdrop-blur-sm">
                            ←
                          </span>
                        </button>
                        <button
                          onClick={() => setActiveImageIndex((activeImageIndex + 1) % count)}
                          aria-label="Next media"
                          className={[
                            'absolute right-0 top-0 flex h-full w-1/4 items-center justify-end pr-3',
                            'text-zinc-500 opacity-0 transition-opacity hover:opacity-100',
                            'focus-visible:opacity-100 focus-visible:outline-none',
                          ].join(' ')}
                        >
                          <span className="flex h-8 w-8 items-center justify-center border border-zinc-700 bg-zinc-900/80 text-sm backdrop-blur-sm">
                            →
                          </span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Caption */}
                  {current?.alt && (
                    <p className="border-t border-zinc-900 px-4 py-2 font-mono text-[10px] text-zinc-600">
                      {current.alt}
                    </p>
                  )}

                  {/* Thumbnail strip */}
                  {count > 1 && (
                    <div className="border-t border-zinc-900 px-4 py-3">
                      <div
                        className={[
                          'flex gap-2 overflow-x-auto pb-1',
                          '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
                        ].join(' ')}
                      >
                        {images.map((img, i) => {
                          const isThumbVideo = img.src.toLowerCase().endsWith('.mp4');
                          const isActive = i === activeImageIndex;
                          return (
                            <button
                              key={`${img.src}-${i}`}
                              onClick={() => setActiveImageIndex(i)}
                              aria-label={`Show item ${i + 1}`}
                              className={[
                                'relative h-12 w-20 shrink-0 overflow-hidden border',
                                'transition-[border-color,opacity] duration-150',
                                isActive
                                  ? 'border-[#2467AC] opacity-100'
                                  : 'border-zinc-800 opacity-50 hover:opacity-80',
                              ].join(' ')}
                            >
                              {isThumbVideo ? (
                                <video src={img.src} className="h-full w-full object-cover" autoPlay loop muted playsInline />
                              ) : (
                                <ImageWithFallback
                                  src={img.src}
                                  alt={img.alt}
                                  className="h-full w-full object-cover"
                                  width={80}
                                  height={48}
                                  rounded=""
                                />
                              )}
                            </button>
                          );
                        })}

                        {/* Dot indicators */}
                        <div className="ml-auto flex items-center gap-1.5 shrink-0 pl-2">
                          {images.map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setActiveImageIndex(i)}
                              aria-label={`Go to ${i + 1}`}
                              className={[
                                'h-1 transition-[width,background] duration-200',
                                i === activeImageIndex
                                  ? 'w-4 bg-[#2467AC]'
                                  : 'w-1.5 bg-zinc-700 hover:bg-zinc-500',
                              ].join(' ')}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* No media placeholder */
                <div className="flex flex-1 items-center justify-center border border-dashed border-zinc-800 m-4">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-700">
                    No media yet.
                  </p>
                </div>
              )}
            </motion.div>

            {/* ── RIGHT: DETAIL PANEL ────────────────────────────────── */}
            {/*
              Warm paper (#F5F4F0) creates a strong contrast with the dark media left.
              This split reads as "the evidence on the wall vs the dossier on the table."
            */}
            <motion.div
              variants={detailVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className={[
                'flex flex-col bg-[#F5F4F0] lg:w-[40%]',
                'overflow-y-auto',
                '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
              ].join(' ')}
            >
              <div className="flex flex-1 flex-col p-5 sm:p-7">

                {/* ── SECTION 01: Problem ──────────────────────────── */}
                <motion.section
                  custom={0}
                  variants={sectionVariants}
                  initial="hidden"
                  animate="show"
                  className="mb-6"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <span className="font-mono text-[10px] font-bold text-zinc-400">
                      {ordinal(1)}
                    </span>
                    <Rule className="flex-1 bg-zinc-300" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                      Problem
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-700">
                    {caseFile.problem}
                  </p>
                </motion.section>

                {/* ── SECTION 02: Approach ─────────────────────────── */}
                <motion.section
                  custom={1}
                  variants={sectionVariants}
                  initial="hidden"
                  animate="show"
                  className="mb-6"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="font-mono text-[10px] font-bold text-zinc-400">
                      {ordinal(2)}
                    </span>
                    <Rule className="flex-1 bg-zinc-300" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                      Approach
                    </span>
                  </div>
                  <ol className="space-y-3">
                    {caseFile.approach.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        {/*
                          Step number: large monospace — editorial, not a
                          generic filled circle badge
                        */}
                        <span className="shrink-0 font-mono text-[11px] font-bold text-zinc-400 pt-0.5">
                          {ordinal(i + 1)}.
                        </span>
                        <p className="text-sm leading-relaxed text-zinc-700">{step}</p>
                      </li>
                    ))}
                  </ol>
                </motion.section>

                {/* ── SECTION 03: Result ───────────────────────────── */}
                <motion.section
                  custom={2}
                  variants={sectionVariants}
                  initial="hidden"
                  animate="show"
                  className="mb-8"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <span className="font-mono text-[10px] font-bold text-zinc-400">
                      {ordinal(3)}
                    </span>
                    <Rule className="flex-1 bg-zinc-300" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                      Result
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-700">
                    {caseFile.result}
                  </p>
                </motion.section>

                {/* ── SPACER ───────────────────────────────────────── */}
                <div className="flex-1" />

                {/* ── CTA ROW ──────────────────────────────────────── */}
                <motion.div
                  custom={3}
                  variants={sectionVariants}
                  initial="hidden"
                  animate="show"
                >
                  <Rule className="mb-4 bg-zinc-300" />
                  <div className="flex items-center gap-3">
                    <button
                      ref={lastFocusRef}
                      onKeyDown={onTrapLast}
                      onClick={onClose}
                      className={[
                        'border border-zinc-300 px-4 py-2',
                        'font-mono text-[11px] uppercase tracking-widest text-zinc-600',
                        'hover:border-zinc-900 hover:text-zinc-900',
                        'transition-colors duration-150',
                      ].join(' ')}
                    >
                      Close
                    </button>

                    <a
                      href="#contact"
                      onClick={() => setTimeout(onClose, 150)}
                      className={[
                        'flex-1 flex items-center justify-center gap-1.5',
                        'bg-[#0A0A0A] px-4 py-2',
                        'font-mono text-[11px] uppercase tracking-widest text-[#F5F4F0]',
                        'hover:bg-zinc-800 transition-colors duration-150',
                      ].join(' ')}
                    >
                      Discuss this build
                      <ArrowUpRightIcon className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}