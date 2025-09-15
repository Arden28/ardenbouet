'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

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
  setActiveImageIndex
}: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const firstFocusRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusRef = useRef<HTMLButtonElement | null>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Close on ESC, arrow keys for gallery
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      const imgs = caseFile.images?.length ?? 0;
      if (!imgs) return;
      if (e.key === 'ArrowRight') setActiveImageIndex((activeImageIndex + 1) % imgs);
      if (e.key === 'ArrowLeft') setActiveImageIndex((activeImageIndex - 1 + imgs) % imgs);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, activeImageIndex, caseFile.images?.length, onClose, setActiveImageIndex]);

  // Focus on open
  useEffect(() => {
    if (open) firstFocusRef.current?.focus();
  }, [open]);

  // Simple focus trap
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

  // Basic swipe on mobile for gallery
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => setTouchStartX(e.changedTouches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX == null || !caseFile.images?.length) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const THRESH = 40; // minimal swipe distance
    if (dx > THRESH) setActiveImageIndex((activeImageIndex - 1 + caseFile.images.length) % caseFile.images.length);
    if (dx < -THRESH) setActiveImageIndex((activeImageIndex + 1) % caseFile.images.length);
    setTouchStartX(null);
  };

  if (!open) return null;

  const content = (
    <div
      className="fixed inset-0 z-50"
      aria-labelledby="casefile-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="modal-backdrop absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Panel wrapper   bottom sheet on mobile, centered on ≥sm */}
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-3 sm:items-center sm:p-6">
        <div
          ref={panelRef}
          className="
            modal-panel pointer-events-auto relative w-full
            max-h-[85vh] overflow-auto rounded-t-2xl border border-zinc-200/70 bg-white p-4 shadow-xl
            dark:border-zinc-700/50 dark:bg-zinc-900
            sm:max-h-[90vh] sm:w-full sm:max-w-3xl sm:rounded-2xl sm:p-6
          "
        >
          {/* Focus sentinels */}
          <button ref={firstFocusRef} className="sr-only" onKeyDown={onTrapFirst} aria-hidden tabIndex={0} />

          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 id="casefile-title" className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                {title} <span className="font-semibold opacity-70">• Case File</span>
              </h2>
              {(caseFile.tags?.length || caseFile.tech?.length) && (
                <div className="mt-2 flex max-w-full flex-wrap items-center gap-2">
                  {caseFile.tags?.map(tag => (
                    <span key={tag} className="rounded-md bg-[color:var(--brand-soft,rgba(36,103,172,.12))] px-2 py-0.5 text-[11px] font-medium capitalize text-zinc-800 dark:text-zinc-200">
                      {tag}
                    </span>
                  ))}
                  {caseFile.tech?.map(tech => (
                    <span key={tech} className="rounded-md bg-[color:var(--brand-soft,rgba(36,103,172,.12))] px-2 py-0.5 text-[11px] font-medium text-zinc-800 dark:text-zinc-200">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="focus-outline rounded-md border border-zinc-200/60 p-2 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700/50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                aria-label="Close case file"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Gallery */}
          {caseFile.images && caseFile.images.length > 0 && (
            <div className="mt-4">
              <div
                className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-zinc-200/60 dark:border-zinc-700/50"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                <Image
                  src={caseFile.images[activeImageIndex].src}
                  alt={caseFile.images[activeImageIndex].alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 800px"
                  className="object-cover"
                  priority={false}
                />
              </div>

              {/* Thumbs + arrows: vertical space is tight on mobile, so thumbs scroll horizontally */}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]"
                     style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {/* hide scrollbar nicely */}
                  <style jsx>{`
                    div::-webkit-scrollbar { display: none; }
                  `}</style>
                  {caseFile.images.map((img, i) => (
                    <button
                      key={img.src}
                      onClick={() => setActiveImageIndex(i)}
                      className={`relative h-12 w-20 flex-none overflow-hidden rounded-md border ${i === activeImageIndex ? 'border-[color:var(--brand)]' : 'border-zinc-200 dark:border-zinc-700'} snap-start`}
                      aria-label={`Show image ${i + 1}`}
                    >
                      <Image src={img.src} alt={img.alt} fill className="object-cover" />
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 sm:mt-0">
                  <button
                    onClick={() => setActiveImageIndex((activeImageIndex - 1 + caseFile.images!.length) % caseFile.images!.length)}
                    className="focus-outline rounded-md border border-zinc-200/60 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700/50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                    aria-label="Previous image"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((activeImageIndex + 1) % caseFile.images!.length)}
                    className="focus-outline rounded-md border border-zinc-200/60 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700/50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                    aria-label="Next image"
                  >
                    →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Body */}
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <section>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Problem</h3>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{caseFile.problem}</p>
            </section>
            <section>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Approach</h3>
              <ul className="mt-1 list-disc pl-4 text-sm text-zinc-700 dark:text-zinc-300">
                {caseFile.approach.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </section>
            <section>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Result</h3>
              <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{caseFile.result}</p>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={onClose}
              className="rounded-md border border-zinc-200/60 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700/50 dark:text-zinc-300 dark:hover:bg-zinc-800/60 sm:min-w-[110px]"
            >
              Close
            </button>
            <a
              href="#contact"
              className="rounded-md bg-[color:var(--brand)] px-4 py-2 text-center text-sm font-semibold text-white hover:opacity-95 sm:min-w-[150px]"
            >
              Discuss this build
            </a>
            {/* Focus trap sentinel */}
            <button ref={lastFocusRef} onKeyDown={onTrapLast} className="sr-only" aria-hidden tabIndex={0} />
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document === 'undefined' ? null : createPortal(content, document.body);
}
