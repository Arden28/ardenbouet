'use client';
// app/shop/ShopClient.tsx
// Client components for the shop detail page:
//   PurchaseButton — triggers the drawer
//   PurchaseDrawer — right-side slide-in confirmation panel
//   StickyPurchaseBar — fixed bottom bar that appears when main CTA scrolls out of view

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product, Service, ShopItem } from './data';

// ─── Motion ──────────────────────────────────────────────────────────────────
const EXPO     = [0.16, 1, 0.3, 1] as const;
const EXPO_OUT = [0.32, 0, 0.67, 0] as const;

const drawerVariants = {
  hidden: { x: '100%', opacity: 0 },
  show:   { x: 0, opacity: 1, transition: { duration: 0.45, ease: EXPO } },
  exit:   { x: '100%', opacity: 0, transition: { duration: 0.3, ease: EXPO_OUT } },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.25 } },
  exit:   { opacity: 0, transition: { duration: 0.25 } },
};

// ─── Design primitives ───────────────────────────────────────────────────────
function Rule({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-zinc-200 ${className}`} />;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isProduct(item: ShopItem): item is Product {
  return item.category === 'product';
}

function getPrice(item: ShopItem): string {
  return isProduct(item) ? `$${item.price}` : (item as Service).priceLabel;
}

function getBuyLabel(item: ShopItem): string {
  return isProduct(item) ? 'Buy now →' : 'Book via email →';
}

function getBuyHref(item: ShopItem): string {
  if (isProduct(item)) {
    return (item as Product).buyUrl ?? `mailto:laudbouetoumoussa@gmail.com?subject=Purchase: ${encodeURIComponent(item.name)}`;
  }
  const svc = item as Service;
  return svc.bookUrl ?? `mailto:laudbouetoumoussa@gmail.com?subject=Book: ${encodeURIComponent(svc.name)}&body=${encodeURIComponent(`Hi Arden,\n\nI'd like to book "${svc.name}".\n\nMy details:\n— Name: \n— Project/context: \n— Preferred start date: `)}`;
}

function getHighlights(item: ShopItem): string[] {
  if (isProduct(item)) return (item as Product).features.slice(0, 4);
  return (item as Service).deliverables.slice(0, 4);
}

// ────────────────────────────────────────────────────────────────────────────
// PURCHASE DRAWER
// Right-side slide-in panel — identical motion pattern to QuickPeek.
// bg-[#F5F4F0] warm paper to contrast the page.
// Price shown in lime (#2467AC) — the only accent usage on this panel.
// ────────────────────────────────────────────────────────────────────────────
export function PurchaseDrawer({
  item,
  open,
  onClose,
}: {
  item: ShopItem;
  open: boolean;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Body scroll lock + keyboard escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const price      = getPrice(item);
  const highlights = getHighlights(item);
  const buyHref    = getBuyHref(item);
  const buyLabel   = getBuyLabel(item);
  const isExternal = isProduct(item) && !!(item as Product).buyUrl;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed inset-0 z-[60] bg-zinc-900/25 backdrop-blur-[3px]"
            onClick={onClose}
            aria-hidden
          />

          {/* Drawer */}
          <motion.aside
            variants={drawerVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label={`Purchase ${item.name}`}
            className={[
              'fixed right-0 top-0 z-[61]',
              'flex h-full flex-col',
              'w-full sm:w-[420px] lg:w-[460px]',
              'bg-[#F5F4F0]',
              'overflow-y-auto',
              '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
            ].join(' ')}
          >
            {/* Top bar */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-[#F5F4F0] px-5 py-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                {isProduct(item) ? 'Purchase' : 'Book service'}
              </p>
              <button
                ref={closeRef}
                onClick={onClose}
                aria-label="Close"
                className={[
                  'inline-flex h-7 w-7 items-center justify-center text-xs',
                  'border border-zinc-300 text-zinc-500',
                  'hover:border-zinc-900 hover:text-zinc-900',
                  'transition-colors duration-150',
                ].join(' ')}
              >
                ✕
              </button>
            </div>

            <div className="flex flex-1 flex-col p-5 sm:p-6">

              {/* Item type */}
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400">
                {isProduct(item) ? (item as Product).type : (item as Service).type}
              </p>

              {/* Name */}
              <h2 className="font-heading text-xl font-bold tracking-tight text-zinc-900">
                {item.name}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                {item.tagline}
              </p>

              {/* Price — lime accent */}
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-zinc-900">
                  {price}
                </span>
                {!isProduct(item) && (
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                    {(item as Service).duration}
                  </span>
                )}
              </div>

              {/* Key highlights */}
              <Rule className="my-4" />
              <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400">
                {isProduct(item) ? "What's included" : 'Key deliverables'}
              </p>
              <ul className="space-y-2">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                    <span className="mt-0.5 shrink-0 text-[#2467AC] leading-none" aria-hidden>—</span>
                    {h}
                  </li>
                ))}
              </ul>

              {/* Push CTA to bottom */}
              <div className="flex-1" />

              {/* CTA */}
              <div className="mt-6 border-t border-zinc-200 pt-5 flex flex-col gap-3">
                <a
                  href={buyHref}
                  {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className={[
                    'flex items-center justify-center',
                    'bg-zinc-900 border border-zinc-900',
                    'px-4 py-3 text-[11px] font-semibold uppercase tracking-widest',
                    'text-white hover:bg-zinc-700',
                    'transition-colors duration-150',
                  ].join(' ')}
                >
                  {buyLabel}
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className={[
                    'border border-zinc-300',
                    'px-4 py-3 font-mono text-[11px] uppercase tracking-widest',
                    'text-zinc-600 hover:border-zinc-900 hover:text-zinc-900',
                    'transition-colors duration-150',
                  ].join(' ')}
                >
                  Close
                </button>
                {!isProduct(item) && (
                  <p className="text-center font-mono text-[9px] uppercase tracking-widest text-zinc-400">
                    Opens your email client
                  </p>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// PURCHASE BUTTON
// Self-contained — manages its own drawer state.
// The main CTA on product/service detail pages.
// ────────────────────────────────────────────────────────────────────────────
export function PurchaseButton({
  item,
  size = 'default',
}: {
  item: ShopItem;
  size?: 'default' | 'large';
}) {
  const [open, setOpen] = useState(false);
  const comingSoon = item.status === 'coming-soon';

  if (comingSoon) {
    return (
      <a
        href={`mailto:laudbouetoumoussa@gmail.com?subject=Notify me: ${encodeURIComponent(item.name)}`}
        className={[
          'inline-flex items-center gap-2',
          'border border-zinc-900 dark:border-zinc-100',
          size === 'large' ? 'px-6 py-4' : 'px-5 py-3',
          'font-mono text-[11px] uppercase tracking-widest',
          'text-zinc-900 dark:text-zinc-100',
          'hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-50 dark:hover:text-zinc-900',
          'transition-colors duration-150',
        ].join(' ')}
      >
        Notify me when available
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          'inline-flex items-center gap-2',
          'bg-zinc-900 dark:bg-zinc-50',
          'border border-zinc-900 dark:border-zinc-50',
          size === 'large' ? 'px-6 py-4' : 'px-5 py-3',
          'font-mono text-[11px] uppercase tracking-widest',
          'text-white dark:text-zinc-900',
          'hover:bg-zinc-700 dark:hover:bg-zinc-200',
          'transition-colors duration-150',
        ].join(' ')}
      >
        {isProduct(item) ? 'Buy now →' : 'Book now →'}
      </button>
      <PurchaseDrawer item={item} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// STICKY PURCHASE BAR
// Appears (fixed bottom) when the element with id="main-cta" scrolls out of view.
// Uses IntersectionObserver — zero scroll event listeners.
// ────────────────────────────────────────────────────────────────────────────
export function StickyPurchaseBar({ item }: { item: ShopItem }) {
  const [visible, setVisible] = useState(false);
  const [open, setOpen]       = useState(false);

  useEffect(() => {
    const el = document.getElementById('main-cta');
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ duration: 0.3, ease: EXPO }}
            className={[
              'fixed bottom-0 inset-x-0 z-40',
              'border-t border-zinc-200 dark:border-zinc-800',
              'bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm',
              'px-4 py-3',
            ].join(' ')}
          >
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
              <div>
                <p className="font-heading text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate max-w-[200px] sm:max-w-none">
                  {item.name}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  {getPrice(item)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className={[
                  'shrink-0 inline-flex items-center',
                  'bg-zinc-900 dark:bg-zinc-50',
                  'border border-zinc-900 dark:border-zinc-50',
                  'px-4 py-2 font-mono text-[11px] uppercase tracking-widest',
                  'text-white dark:text-zinc-900',
                  'hover:bg-zinc-700 dark:hover:bg-zinc-200',
                  'transition-colors duration-150',
                ].join(' ')}
              >
                {isProduct(item) ? 'Buy now →' : 'Book now →'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <PurchaseDrawer item={item} open={open} onClose={() => setOpen(false)} />
    </>
  );
}