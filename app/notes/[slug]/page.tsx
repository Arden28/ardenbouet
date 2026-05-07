// app/shop/[slug]/page.tsx
// Note: <Header /> is provided by app/layout.tsx — do not add it here.

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ALL_ITEMS, PRODUCTS, SERVICES, getShopItem, type Product, type Service } from '@/app/shop/data';
import { PurchaseButton, StickyPurchaseBar } from '@/app/shop/ShopClient';
// import { PurchaseButton, StickyPurchaseBar } from '../ShopClient';

// ─── Static generation ───────────────────────────────────────────────────────
export function generateStaticParams() {
  return ALL_ITEMS.map(item => ({ slug: item.slug }));
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const item = getShopItem(params.slug);
  if (!item) return {};
  const price = item.category === 'product'
    ? `$${(item as Product).price}`
    : (item as Service).priceLabel;
  return {
    title: `${item.name} · Shop · Arden BOUET`,
    description: `${item.tagline} — ${price}`,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function ordinal(n: number) {
  return String(n).padStart(2, '0');
}

function Rule({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}

// ─── Product detail layout ────────────────────────────────────────────────────
/*
  Desktop: [sticky cover 50%] | [scrollable info 50%]
  The left image is sticky (top: 6rem) so it stays visible as you read features.
  Features are numbered with the 01/02/03 ordinal pattern from CaseModal.
  Main CTA has id="main-cta" — StickyPurchaseBar watches it with IntersectionObserver.
*/
function ProductDetail({ product }: { product: Product }) {
  const comingSoon = product.status === 'coming-soon';

  return (
    <>
      <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">

        {/* Cover — sticky on desktop */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative aspect-[4/3] overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
            {product.cover ? (
              <Image
                src={product.cover}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-widest text-zinc-300 dark:text-zinc-700">
                No preview
              </span>
            )}
            {comingSoon && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60">
                <span className="border border-white/30 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-white">
                  Coming soon
                </span>
              </div>
            )}
          </div>

          {/* Tech stack under image */}
          {product.stack && product.stack.length > 0 && (
            <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
              {product.stack.join(' · ')}
            </p>
          )}

          {/* Demo link under image */}
          {product.demoUrl && (
            <a
              href={product.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              View live demo →
            </a>
          )}
        </div>

        {/* Info column */}
        <div className="flex flex-col">

          {/* Type + tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {product.type}
            </span>
            {product.tags.map(tag => (
              <span key={tag} className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                {tag}
              </span>
            ))}
          </div>

          {/* Name */}
          <h1 className="mt-4 font-heading text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 lg:text-4xl">
            {product.name}
          </h1>

          <p className="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            {product.description}
          </p>

          {/* Features — numbered 01 / 02 / 03 */}
          <div className="mt-8">
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
              What's included
            </p>
            <Rule />
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {product.features.map((f, i) => (
                <li key={i} className="flex items-start gap-4 py-3">
                  <span className="shrink-0 font-mono text-[10px] font-bold text-zinc-300 dark:text-zinc-700 pt-0.5">
                    {ordinal(i + 1)}
                  </span>
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA — id="main-cta" watched by StickyPurchaseBar */}
          <Rule className="my-8" />
          <div id="main-cta" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="font-mono text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                ${product.price}
              </span>
              <p className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                One-time payment · Lifetime access
              </p>
            </div>
            <PurchaseButton item={product} size="large" />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Service detail layout ────────────────────────────────────────────────────
/*
  Full-width editorial header with large name + price.
  Process steps: inner-border grid (same system as Projects, Journey).
  Deliverables: full numbered list.
  CTA at bottom of process section + repeated in header (mobile-accessible).
*/
function ServiceDetail({ service }: { service: Service }) {
  return (
    <>
      {/* Hero section */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto]">
        <div>
          {/* Type + tags */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              {service.type}
            </span>
            {service.tags.map(tag => (
              <span key={tag} className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                {tag}
              </span>
            ))}
          </div>

          <h1 className="font-heading text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 lg:text-4xl">
            {service.name}
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            {service.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Duration: {service.duration}
            </span>
          </div>
        </div>

        {/* Price + CTA — right on desktop, stacks below on mobile */}
        <div id="main-cta" className="flex flex-col items-start gap-3 lg:items-end lg:justify-start lg:pt-1">
          <div className="lg:text-right">
            <p className="font-mono text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              {service.priceLabel}
            </p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
              Per engagement
            </p>
          </div>
          <PurchaseButton item={service} size="default" />
        </div>
      </div>

      {/* Process steps — inner-border grid (same as Projects) */}
      <div className="mt-14">
        <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
          How it works
        </p>
        <Rule />
        {/*
          Inner-border process grid:
          container: border-l border-t
          each cell:  border-r border-b
          Responsive: 1-col mobile, 2-col tablet, up to 4-col desktop.
        */}
        <ul className={[
          'grid grid-cols-1 border-l border-t border-zinc-200 dark:border-zinc-800',
          service.process.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4',
        ].join(' ')}>
          {service.process.map((step, i) => (
            <li
              key={i}
              className="group border-b border-r border-zinc-200 dark:border-zinc-800 p-5 relative"
            >
              {/* Step number */}
              <p className="mb-3 font-mono text-[9px] text-zinc-300 dark:text-zinc-700">
                {ordinal(i + 1)}
              </p>
              <p className="font-heading text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
                {step.step}
              </p>
              <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                {step.detail}
              </p>
              {/* Left-edge lime accent on hover */}
              <span
                aria-hidden
                className="absolute left-0 top-0 h-0 w-[2px] bg-[#CBFF4D] transition-[height] duration-300 group-hover:h-full"
              />
            </li>
          ))}
        </ul>
      </div>

      {/* Deliverables — full numbered list */}
      <div className="mt-14">
        <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
          Deliverables
        </p>
        <Rule />
        <ul className="mt-0 divide-y divide-zinc-100 dark:divide-zinc-900">
          {service.deliverables.map((d, i) => (
            <li key={i} className="flex items-start gap-4 py-3.5">
              <span className="shrink-0 font-mono text-[10px] font-bold text-zinc-300 dark:text-zinc-700 pt-0.5">
                {ordinal(i + 1)}
              </span>
              <span className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{d}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom CTA */}
      <Rule className="mt-10" />
      <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Ready to get started?
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            {service.priceLabel} · {service.duration}
          </p>
        </div>
        <PurchaseButton item={service} size="large" />
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ProductPage({ params }: { params: { slug: string } }) {
  const item = getShopItem(params.slug);
  if (!item) notFound();

  return (
    <>
      {/* Sticky bottom bar — appears when main CTA scrolls out of view */}
      <StickyPurchaseBar item={item} />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:pt-16">

        {/* Breadcrumb */}
        <nav
          className="mb-8 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600"
          aria-label="Breadcrumb"
        >
          <Link
            href="/shop"
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150"
          >
            Shop
          </Link>
          <span aria-hidden>—</span>
          <span className="text-zinc-900 dark:text-zinc-50">{item.name}</span>
        </nav>

        <Rule />

        {/* Render product or service layout */}
        {item.category === 'product' ? (
          <ProductDetail product={item as Product} />
        ) : (
          <ServiceDetail service={item as Service} />
        )}

      </main>
    </>
  );
}