// app/shop/[slug]/page.tsx — product page in the story layout, with a sticky purchase card
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Check } from 'lucide-react';
import { getContentBundle } from '@/lib/blog/queries';
import { getLocale, lhref, alternates } from '@/lib/i18n/server';
import { localize } from '@/lib/i18n/content';
import { uiT, type UiKey } from '@/lib/i18n/ui';
import { mdToSafeHtml } from '@/lib/mardown';
import { Gallery } from '@/components/gallery/Gallery';
import { BuyCard } from './BuyCard';

export const dynamic = 'force-dynamic';

async function getProduct(slug: string) {
  const bundle = await getContentBundle();
  const all = (bundle.products ?? []).filter(p => p.status === 'published');
  const raw = all.find(p => p.slug === slug);
  return raw ? { product: localize(raw, getLocale()), others: all.filter(p => p.id !== raw.id).slice(0, 3).map(p => localize(p, getLocale())) } : null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const r = await getProduct(params.slug);
  if (!r) return {};
  const cover = r.product.cover || r.product.media?.find(m => m.kind === 'image')?.url;
  return {
    title: `${r.product.title} · Shop · Arden BOUET`,
    description: r.product.tagline,
    alternates: alternates(`/shop/${r.product.slug}`),
    openGraph: { title: r.product.title, description: r.product.tagline, ...(cover ? { images: [{ url: cover }] } : {}) },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const r = await getProduct(params.slug);
  if (!r) notFound();
  const { product: p, others } = r;
  const ui = uiT(getLocale());
  const isService = p.category === 'service';
  const gallery = (p.media ?? []).map(m => ({ src: m.url, alt: m.label, caption: m.description || m.label, kind: m.kind === 'video' ? 'video' as const : 'image' as const }));
  const cover = p.cover || (gallery[0]?.kind === 'image' ? gallery[0].src : undefined);

  return (
    <main className="blog-ui pb-24">
      <div className="mx-auto max-w-[1192px] px-6 pt-8">
        <Link href={lhref('/shop')} className="inline-flex items-center gap-1.5 text-[14px] text-[#6b6b6b] hover:text-[#242424]"><ArrowLeft className="h-4 w-4" /> {ui('shop.back')}</Link>
      </div>

      <div className="mx-auto grid max-w-[1192px] gap-12 px-6 pt-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16">
        <article className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#1a8917]">{ui(`shop.catOne.${p.category}` as UiKey)}</p>
          <h1 className="mt-3 text-[38px] font-bold leading-[1.1] tracking-[-0.025em] text-[#242424] sm:text-[48px]">{p.title}</h1>
          <p className="mt-4 font-story text-[22px] leading-[1.5] text-[#6b6b6b]">{p.tagline}</p>
          {p.tags?.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">{p.tags.map(t => <span key={t} className="rounded-full bg-[#f2f2f2] px-3 py-1 text-[13px] text-[#242424]">{t}</span>)}</div>
          )}

          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="mt-10 aspect-[16/9] w-full rounded-3xl object-cover" />
          )}

          <section className="mt-12">
            <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-[#9b9b9b]">{ui('shop.about')}</h2>
            <div className="story mt-4 [&>*]:!mx-0 [&>*]:!max-w-none" dangerouslySetInnerHTML={{ __html: mdToSafeHtml(p.description ?? '') }} />
          </section>

          {p.features?.length > 0 && (
            <section className="mt-12">
              <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-[#9b9b9b]">{ui('shop.included')}</h2>
              <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {p.features.map(f => (
                  <li key={f} className="flex gap-3 text-[16px] leading-6 text-[#242424]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eef7ee]"><Check className="h-3 w-3 text-[#1a8917]" strokeWidth={3} /></span>{f}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {gallery.length > 0 && (
            <section className="mt-14">
              <h2 className="mb-5 text-[13px] font-medium uppercase tracking-[0.12em] text-[#9b9b9b]">{ui('shop.gallery')}</h2>
              <Gallery items={gallery} />
            </section>
          )}
        </article>

        <aside>
          <div className="lg:sticky lg:top-24">
            <BuyCard slug={p.slug} price={p.price} currency={p.currency} priceLabel={p.priceLabel} isService={isService} demoUrl={p.demoUrl} hasDiscounts={!!p.discountCodes?.length} />
          </div>
        </aside>
      </div>

      {others.length > 0 && (
        <section className="mx-auto mt-24 max-w-[1192px] border-t border-[#f2f2f2] px-6 pt-12">
          <h2 className="text-[20px] font-bold text-[#242424]">{ui('shop.more')}</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {others.map(o => (
              <Link key={o.id} href={lhref(`/shop/${o.slug}`)} className="group">
                <div className="overflow-hidden rounded-2xl bg-[#f4f4f4]">
                  {(o.cover || o.media?.find(m => m.kind === 'image')?.url)
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={o.cover || o.media?.find(m => m.kind === 'image')?.url} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                    : <div className="aspect-[4/3]" />}
                </div>
                <p className="mt-3 text-[17px] font-bold text-[#242424]">{o.title}</p>
                <p className="mt-1 text-[14px] text-[#6b6b6b] line-clamp-2">{o.tagline}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
