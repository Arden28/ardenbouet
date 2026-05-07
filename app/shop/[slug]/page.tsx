import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { Header } from '../../components/Header';
import { PRODUCTS, getProduct } from '../data';

export function generateStaticParams() {
  return PRODUCTS.map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = getProduct(params.slug);
  if (!product) return {};
  return {
    title: `${product.name} · Shop · Arden BOUET`,
    description: product.tagline,
  };
}

function Rule({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug);
  if (!product) notFound();

  const comingSoon = product.status === 'coming-soon';

  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:pt-16">

        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600" aria-label="Breadcrumb">
          <Link href="/shop" className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150">
            Shop
          </Link>
          <span aria-hidden>—</span>
          <span className="text-zinc-900 dark:text-zinc-50">{product.name}</span>
        </nav>

        <Rule />

        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">

          {/* Cover */}
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

          {/* Info */}
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

            <h1 className="mt-4 font-heading text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 lg:text-4xl">
              {product.name}
            </h1>
            <p className="mt-2 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              {product.description}
            </p>

            {/* Features */}
            <div className="mt-8">
              <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
                What&apos;s included
              </p>
              <ul className="space-y-2">
                {product.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <span className="mt-0.5 shrink-0 text-[#2467AC]" aria-hidden>—</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <Rule className="my-8" />

            {/* Price + CTA */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                ${product.price}
              </span>

              {comingSoon ? (
                <a
                  href={`mailto:laudbouetoumoussa@gmail.com?subject=Notify me: ${product.name}`}
                  className={[
                    'inline-flex items-center gap-2',
                    'border border-zinc-900 dark:border-zinc-100',
                    'px-5 py-3',
                    'font-mono text-[11px] uppercase tracking-widest',
                    'text-zinc-900 dark:text-zinc-100',
                    'hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-50 dark:hover:text-zinc-900',
                    'transition-colors duration-150',
                  ].join(' ')}
                >
                  Notify me when available
                </a>
              ) : (
                <a
                  href={product.buyUrl ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={[
                    'inline-flex items-center gap-2',
                    'bg-zinc-900 dark:bg-zinc-50',
                    'border border-zinc-900 dark:border-zinc-100',
                    'px-5 py-3',
                    'font-mono text-[11px] uppercase tracking-widest',
                    'text-white dark:text-zinc-900',
                    'hover:bg-zinc-700 dark:hover:bg-zinc-200',
                    'transition-colors duration-150',
                  ].join(' ')}
                >
                  Buy now →
                </a>
              )}
            </div>

            {product.demoUrl && (
              <a
                href={product.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150"
              >
                View live demo →
              </a>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
