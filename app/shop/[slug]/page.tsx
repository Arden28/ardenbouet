// app/shop/[slug]/page.tsx — Header provided by layout.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import type { ContentBundle, ShopProduct } from '@/app/admin/types';
import { getLocale, makeT } from '@/lib/serverT';
import PriceTag from './PriceTag';
import MediaViewer from './MediaViewer';

export const dynamic = 'force-dynamic';

async function getProduct(slug: string): Promise<ShopProduct | null> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const row = await prisma.content.findUnique({ where: { id: 1 } });
    const bundle = row?.data as ContentBundle | null;
    return bundle?.products?.find(p => p.slug === slug && p.status === 'published') ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return {};
  return {
    title: `${product.title} · Shop · Arden BOUET`,
    description: product.tagline,
  };
}

function Rule({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}


export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const isService = product.category === 'service';
  const t = makeT(getLocale());

  return (
    <>
      {/* ── DARK HERO ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-zinc-950 text-white">
        {/* Lime left-edge accent */}
        <div className="absolute inset-y-0 left-0 w-[3px] bg-[#2467AC]" />

        <div className="mx-auto max-w-6xl px-6 pb-14 pt-10 sm:pt-16">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-600"
          >
            <Link href="/shop" className="transition-colors duration-150 hover:text-zinc-300">
              Shop
            </Link>
            <span aria-hidden>·</span>
            <span className="text-zinc-400">{product.title}</span>
          </nav>

          {/* Category + tags */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="border border-[#2467AC]/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[#2467AC]">
              {product.category}
            </span>
            {product.language && (
              <span className="border border-white/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                {product.language === 'fr' ? '🇫🇷 fr' : product.language === 'both' ? '🌐 en+fr' : '🇬🇧 en'}
              </span>
            )}
            {product.tags.slice(0, 4).map(tag => (
              <span
                key={tag}
                className="border border-zinc-700 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-500"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="mt-5 font-heading text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            {product.title}
          </h1>

          {/* Tagline */}
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-400">
            {product.tagline}
          </p>

          {/* CTA row */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <PriceTag
              price={product.price}
              baseCurrency={product.currency}
              fallback={product.priceLabel}
              className="font-mono text-2xl font-bold text-white"
            />

            <Link
              href={`/checkout?product=${product.slug}`}
              className="inline-flex items-center bg-[#2467AC] px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-zinc-950 transition-colors duration-150 hover:bg-white"
            >
              {isService ? t('shopDetail.bookNow') : t('shopDetail.buyNow')}
            </Link>

            {product.demoUrl && (
              <a
                href={product.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 transition-colors duration-150 hover:text-zinc-200"
              >
                {t('shopDetail.viewDemo')}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ── COVER IMAGE ──────────────────────────────────────────────────────── */}
      {product.cover && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="relative aspect-[16/9] overflow-hidden border-x border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
            <Image
              src={product.cover}
              alt={product.title}
              fill
              className="object-cover"
              sizes="(max-width:1024px) 100vw, 1152px"
              priority
            />
          </div>
        </div>
      )}

      {/* ── BODY ─────────────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-14 sm:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_320px] lg:gap-16">

          {/* Left: description + features */}
          <div>
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600">
              {t('shopDetail.about')}
            </p>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
              {product.description}
            </p>

            {product.features.length > 0 && (
              <div className="mt-12">
                <p className="mb-6 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600">
                  {t('shopDetail.included')}
                </p>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {product.features.map(f => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300"
                    >
                      <span
                        aria-hidden
                        className="mt-0.5 shrink-0 font-bold text-[#2467AC]"
                      >
                        ✓
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Media */}
            {product.media && product.media.length > 0 && (
              <div className="mt-14">
                <p className="mb-6 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600">
                  {t('shopDetail.media')}
                </p>
                <MediaViewer items={product.media} />
              </div>
            )}

            {/* Back link — mobile only */}
            <div className="mt-12 lg:hidden">
              <Link
                href="/shop"
                className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                {t('shopDetail.back')}
              </Link>
            </div>
          </div>

          {/* Right: sticky purchase card */}
          <div className="self-start space-y-4 lg:sticky lg:top-28">
            <div className="divide-y divide-zinc-200 border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {/* Price */}
              <div className="p-6">
                <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                  {t('shopDetail.price')}
                </p>
                <PriceTag
                  price={product.price}
                  baseCurrency={product.currency}
                  fallback={product.priceLabel}
                  className="mt-1 block font-mono text-3xl font-bold text-zinc-900 dark:text-zinc-50"
                />
              </div>

              {/* CTAs */}
              <div className="space-y-3 p-6">
                <Link
                  href={`/checkout?product=${product.slug}`}
                  className="flex w-full items-center justify-center bg-zinc-900 px-5 py-3 font-mono text-[11px] uppercase tracking-widest text-white transition-colors duration-150 hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  {isService ? t('shopDetail.bookNow') : t('shopDetail.buyNow')}
                </Link>

                {product.demoUrl && (
                  <a
                    href={product.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center border border-zinc-200 px-5 py-3 font-mono text-[11px] uppercase tracking-widest text-zinc-600 transition-colors duration-150 hover:border-zinc-900 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
                  >
                    {t('shopDetail.viewDemo')}
                  </a>
                )}
              </div>

              {/* Tags */}
              {product.tags.length > 0 && (
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map(tag => (
                      <span
                        key={tag}
                        className="border border-zinc-200 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-500 dark:border-zinc-700 dark:text-zinc-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Questions */}
            <div className="border border-dashed border-zinc-200 p-4 dark:border-zinc-800">
              <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                {t('shopDetail.questions')}
              </p>
              <a
                href="mailto:laudbouetoumoussa@gmail.com"
                className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                laudbouetoumoussa@gmail.com
              </a>
            </div>

            {/* Back link — desktop */}
            <Link
              href="/shop"
              className="hidden font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100 lg:block"
            >
              {t('shopDetail.back')}
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
