'use client';
// app/shop/page.tsx
// Note: <Header /> is provided by app/layout.tsx — do not add it here.

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PRODUCTS, SERVICES, type Product, type Service } from './data';

// ─── Filter types ─────────────────────────────────────────────────────────────
type CategoryFilter = 'all' | 'products' | 'services';
type StatusFilter   = 'all' | 'available' | 'coming-soon';

// ─── Motion ──────────────────────────────────────────────────────────────────
const EXPO = [0.16, 1, 0.3, 1] as const;

// ─── Design primitives ───────────────────────────────────────────────────────
function Rule({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}

// ─── Sidebar filter group ─────────────────────────────────────────────────────
// Same animated lime-dash pattern used in Projects, Journey, ExperienceReel.
function FilterGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600">
        {label}
      </p>
      <div className="flex flex-row flex-wrap gap-2 lg:flex-col lg:gap-0 lg:border-t lg:border-zinc-200 lg:dark:border-zinc-800">
        {options.map(({ key, label: optLabel }) => {
          const isActive = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={[
                'flex items-center gap-2 transition-colors duration-150 focus-visible:outline-none',
                'rounded-sm border px-3 py-1.5',
                'lg:rounded-none lg:border-0 lg:w-full',
                'lg:border-b lg:border-zinc-100 lg:dark:border-zinc-900 lg:px-0 lg:py-3',
                isActive
                  ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-50'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300',
              ].join(' ')}
            >
              <span
                aria-hidden
                className={[
                  'hidden lg:block h-px bg-[#CBFF4D] shrink-0',
                  'transition-[width,opacity] duration-300',
                  isActive ? 'w-5 opacity-100' : 'w-0 opacity-0',
                ].join(' ')}
              />
              <span className="font-mono text-[10px] uppercase tracking-widest">
                {optLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────
/*
  Inner-border card (same as Projects grid).
  On hover:
    — border turns dark
    — left-edge lime bar grows
    — tech stack panel slides up from the bottom of the cover image
*/
function ProductCard({ product }: { product: Product }) {
  const comingSoon = product.status === 'coming-soon';

  return (
    <Link
      href={`/shop/${product.slug}`}
      className={['group block', comingSoon ? 'opacity-60 pointer-events-none' : ''].join(' ')}
      aria-disabled={comingSoon}
      tabIndex={comingSoon ? -1 : undefined}
    >
      <article
        className={[
          'relative border border-zinc-200 dark:border-zinc-800',
          'transition-[border-color] duration-150',
          !comingSoon ? 'group-hover:border-zinc-900 dark:group-hover:border-zinc-100' : '',
        ].join(' ')}
      >
        {/* Cover + quick-look overlay */}
        <div className="relative aspect-[3/2] overflow-hidden border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          {product.cover ? (
            <Image
              src={product.cover}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 33vw"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-widest text-zinc-300 dark:text-zinc-700">
              No preview
            </span>
          )}

          {/* Coming-soon badge */}
          {comingSoon && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60">
              <span className="border border-white/30 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white">
                Coming soon
              </span>
            </div>
          )}

          {/*
            Quick-look stack panel — slides up from below the image on hover.
            Pure CSS — no JS state. Uses group-hover on the parent <Link>.
            Dark bg (#0A0A0A) echoes CaseModal / Footer panels.
          */}
          {!comingSoon && product.stack && product.stack.length > 0 && (
            <div
              className={[
                'absolute inset-x-0 bottom-0 bg-[#0A0A0A] px-4 py-3',
                'translate-y-full transition-transform duration-300',
                'group-hover:translate-y-0',
              ].join(' ')}
              aria-hidden
            >
              <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
                Stack
              </p>
              <p className="font-mono text-[10px] text-zinc-200">
                {product.stack.join(' · ')}
              </p>
            </div>
          )}
        </div>

        {/* Card content */}
        <div className="p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {product.type}
            </span>
            {product.tags.slice(0, 3).map(tag => (
              <span key={tag} className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                {tag}
              </span>
            ))}
          </div>

          <h2 className="font-heading text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {product.name}
          </h2>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {product.tagline}
          </p>

          <div className="mt-5 flex items-center justify-between">
            <span className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-50">
              ${product.price}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors duration-150 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
              {comingSoon ? 'Notify me →' : 'View →'}
            </span>
          </div>
        </div>

        {/* Left-edge lime accent on hover */}
        {!comingSoon && (
          <span
            aria-hidden
            className="absolute left-0 top-0 h-0 w-[2px] bg-[#CBFF4D] transition-[height] duration-300 group-hover:h-full"
          />
        )}
      </article>
    </Link>
  );
}

// ─── Service row ──────────────────────────────────────────────────────────────
/*
  Editorial list row (same archive pattern as blog/page.tsx).
  On hover:
    — title flashes lime
    — deliverables expand below via max-height transition (CSS, no JS)
*/
function ServiceRow({ service }: { service: Service }) {
  const comingSoon = service.status === 'coming-soon';

  return (
    <div className="group">
      <Link
        href={`/shop/${service.slug}`}
        className={comingSoon ? 'pointer-events-none opacity-60' : ''}
        aria-disabled={comingSoon}
        tabIndex={comingSoon ? -1 : undefined}
      >
        <div className="flex items-center gap-5 py-5 px-1 transition-colors duration-150 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40">

          {/* Type tag */}
          <span className="hidden shrink-0 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 sm:inline">
            {service.type}
          </span>

          {/* Name + tagline */}
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50 transition-colors duration-200 group-hover:text-[#CBFF4D]">
              {service.name}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-sm text-zinc-500 dark:text-zinc-400">
              {service.tagline}
            </p>
          </div>

          {/* Duration */}
          <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 sm:block">
            {service.duration}
          </span>

          {/* Price + CTA */}
          <div className="shrink-0 text-right">
            <p className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {service.priceLabel}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors duration-150 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
              {comingSoon ? 'Coming soon' : 'Learn more →'}
            </p>
          </div>
        </div>

        {/*
          Deliverables reveal — pure CSS max-height trick.
          First 3 deliverables shown as a monospace comma-separated line.
          No JS state needed.
        */}
        {!comingSoon && service.deliverables.length > 0 && (
          <div className="max-h-0 overflow-hidden transition-[max-height] duration-300 group-hover:max-h-16 px-1">
            <div className="border-t border-zinc-100 dark:border-zinc-900 py-3">
              <p className="font-mono text-[9px] text-zinc-400 dark:text-zinc-600 line-clamp-1">
                {service.deliverables.slice(0, 3).join(' · ')}
              </p>
            </div>
          </div>
        )}
      </Link>
      <Rule />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ShopPage() {
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [status,   setStatus]   = useState<StatusFilter>('all');

  const filteredProducts = useMemo(
    () =>
      category === 'services'
        ? []
        : PRODUCTS.filter(p => status === 'all' || p.status === status),
    [category, status]
  );

  const filteredServices = useMemo(
    () =>
      category === 'products'
        ? []
        : SERVICES.filter(s => status === 'all' || s.status === status),
    [category, status]
  );

  const totalCount = filteredProducts.length + filteredServices.length;

  return (
    
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:pt-16">

      {/* ── Section header ──────────────────────────────────────────── */}
      <Rule />
      <div className="flex items-baseline justify-between py-4">
        <h1 className="font-heading text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
          Shop
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
          {totalCount} item{totalCount !== 1 ? 's' : ''}
        </p>
      </div>
      <Rule />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[180px_1fr]">

        {/* ── SIDEBAR ──────────────────────────────────────────────── */}
        <aside className="self-start lg:sticky lg:top-28">
          <div className="flex flex-col gap-6">
            <FilterGroup
              label="Category"
              value={category}
              onChange={setCategory}
              options={[
                { key: 'all',      label: 'All'      },
                { key: 'products', label: 'Products' },
                { key: 'services', label: 'Services' },
              ]}
            />
            <FilterGroup
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { key: 'all',          label: 'All'          },
                { key: 'available',    label: 'Available'    },
                { key: 'coming-soon',  label: 'Coming soon'  },
              ]}
            />
          </div>

          {/* Custom work CTA — desktop only */}
          <div className="mt-8 hidden lg:block">
            <Rule />
            <div className="py-4">
              <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
                Need something custom?
              </p>
              <Link
                href="/#contact"
                className={[
                  'flex w-full items-center justify-between',
                  'border border-zinc-900 dark:border-zinc-100',
                  'px-3 py-2 text-[11px] font-semibold uppercase tracking-widest',
                  'text-zinc-900 dark:text-zinc-100',
                  'hover:bg-zinc-900 hover:text-white',
                  'dark:hover:bg-zinc-50 dark:hover:text-zinc-900',
                  'transition-colors duration-150',
                ].join(' ')}
              >
                Let's talk <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
        <div className="space-y-14">

          {/* Products section */}
          <AnimatePresence>
            {filteredProducts.length > 0 && (
              <motion.section
                key="products"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: EXPO }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600">
                    Digital Products
                  </p>
                  <span className="font-mono text-[9px] text-zinc-300 dark:text-zinc-700">
                    ({filteredProducts.length})
                  </span>
                </div>
                <Rule />
                {/* Inner-border 3-col grid (same as Projects section) */}
                <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map(product => (
                    <li key={product.slug}>
                      <ProductCard product={product} />
                    </li>
                  ))}
                </ul>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Services section */}
          <AnimatePresence>
            {filteredServices.length > 0 && (
              <motion.section
                key="services"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: EXPO, delay: 0.06 }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600">
                    Services
                  </p>
                  <span className="font-mono text-[9px] text-zinc-300 dark:text-zinc-700">
                    ({filteredServices.length})
                  </span>
                </div>
                <Rule />
                <div>
                  {filteredServices.map(service => (
                    <ServiceRow key={service.slug} service={service} />
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {totalCount === 0 && (
            <div className="border border-dashed border-zinc-200 dark:border-zinc-800 py-16 text-center">
              <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                No items match this filter.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}