'use client';
// app/shop/page.tsx — Header is provided by app/layout.tsx

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Package, FileText, Wrench } from 'lucide-react';
import type { ShopProduct } from '@/app/admin/types';

type CategoryFilter = 'all' | 'platform' | 'app' | 'document' | 'service';

const EXPO = [0.16, 1, 0.3, 1] as const;

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'All',
  platform: 'Platforms',
  app: 'Apps',
  document: 'Documents',
  service: 'Services',
};

const CATEGORY_ICON: Record<ShopProduct['category'], ReactNode> = {
  platform: <Layers className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />,
  app:      <Package className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />,
  document: <FileText className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />,
  service:  <Wrench className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />,
};

function Rule({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}

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
                  'hidden lg:block h-px bg-[#2467AC] shrink-0',
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

function ProductCard({ product }: { product: ShopProduct }) {
  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <article className="relative border border-zinc-200 dark:border-zinc-800 transition-[border-color] duration-150 group-hover:border-zinc-900 dark:group-hover:border-zinc-100">
        {/* Cover */}
        <div className="relative aspect-[3/2] overflow-hidden border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          {product.cover ? (
            <Image
              src={product.cover}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 33vw"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center">
              {CATEGORY_ICON[product.category]}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {product.category}
            </span>
            {product.tags.slice(0, 3).map(tag => (
              <span key={tag} className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                {tag}
              </span>
            ))}
          </div>

          <h2 className="font-heading text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {product.title}
          </h2>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {product.tagline}
          </p>

          <div className="mt-5 flex items-center justify-between">
            <span className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-50">
              {product.priceLabel}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors duration-150 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
              View →
            </span>
          </div>
        </div>

        {/* Left-edge lime accent */}
        <span
          aria-hidden
          className="absolute left-0 top-0 h-0 w-[2px] bg-[#2467AC] transition-[height] duration-300 group-hover:h-full"
        />
      </article>
    </Link>
  );
}

function ServiceRow({ product }: { product: ShopProduct }) {
  return (
    <div className="group">
      <Link href={`/shop/${product.slug}`}>
        <div className="flex items-center gap-5 px-1 py-5 transition-colors duration-150 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40">
          <span className="hidden shrink-0 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 sm:inline">
            Service
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50 transition-colors duration-200 group-hover:text-[#2467AC]">
              {product.title}
            </h3>
            <p className="mt-0.5 line-clamp-1 text-sm text-zinc-500 dark:text-zinc-400">
              {product.tagline}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-50">
              {product.priceLabel}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors duration-150 group-hover:text-zinc-900 dark:group-hover:text-zinc-100">
              Learn more →
            </p>
          </div>
        </div>

        {/* Feature preview on hover */}
        {product.features.length > 0 && (
          <div className="max-h-0 overflow-hidden transition-[max-height] duration-300 group-hover:max-h-16 px-1">
            <div className="border-t border-zinc-100 dark:border-zinc-900 py-3">
              <p className="font-mono text-[9px] text-zinc-400 dark:text-zinc-600 line-clamp-1">
                {product.features.slice(0, 3).join(' · ')}
              </p>
            </div>
          </div>
        )}
      </Link>
      <Rule />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 animate-pulse">
      <div className="aspect-[3/2] bg-zinc-100 dark:bg-zinc-900" />
      <div className="p-5 space-y-3">
        <div className="h-3 w-20 rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-4 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-3 w-full rounded bg-zinc-100 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

export default function ShopPage() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<CategoryFilter>('all');

  useEffect(() => {
    fetch('/api/content')
      .then(r => r.json())
      .then(data => {
        const all: ShopProduct[] = (data.products ?? []).filter(
          (p: ShopProduct) => p.status === 'published',
        );
        setProducts(all);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (category === 'all' ? products : products.filter(p => p.category === category)),
    [products, category],
  );

  const digital  = filtered.filter(p => p.category !== 'service');
  const services = filtered.filter(p => p.category === 'service');
  const total    = digital.length + services.length;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:pt-16">
      {/* Section header */}
      <Rule />
      <div className="flex items-baseline justify-between py-4">
        <h1 className="font-heading text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
          Shop
        </h1>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
          {loading ? '…' : `${total} item${total !== 1 ? 's' : ''}`}
        </p>
      </div>
      <Rule />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[180px_1fr]">
        {/* Sidebar */}
        <aside className="self-start lg:sticky lg:top-28">
          <div className="flex flex-col gap-6">
            <FilterGroup
              label="Category"
              value={category}
              onChange={setCategory}
              options={[
                { key: 'all',      label: 'All'       },
                { key: 'platform', label: 'Platforms' },
                { key: 'app',      label: 'Apps'      },
                { key: 'document', label: 'Documents' },
                { key: 'service',  label: 'Services'  },
              ]}
            />
          </div>

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
                  'px-3 py-2 font-mono text-[11px] uppercase tracking-widest',
                  'text-zinc-900 dark:text-zinc-100',
                  'hover:bg-zinc-900 hover:text-white',
                  'dark:hover:bg-zinc-50 dark:hover:text-zinc-900',
                  'transition-colors duration-150',
                ].join(' ')}
              >
                Let&apos;s talk <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="space-y-14">
          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Digital products */}
          <AnimatePresence>
            {!loading && digital.length > 0 && (
              <motion.section
                key="digital"
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
                    ({digital.length})
                  </span>
                </div>
                <Rule />
                <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {digital.map(p => (
                    <li key={p.slug}>
                      <ProductCard product={p} />
                    </li>
                  ))}
                </ul>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Services */}
          <AnimatePresence>
            {!loading && services.length > 0 && (
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
                    ({services.length})
                  </span>
                </div>
                <Rule />
                <div>
                  {services.map(p => (
                    <ServiceRow key={p.slug} product={p} />
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!loading && total === 0 && (
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
