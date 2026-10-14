// app/shop/page.tsx — storefront (server-rendered catalogue, client filters)
import type { Metadata } from 'next';
import { getContentBundle } from '@/lib/blog/queries';
import { getLocale, alternates } from '@/lib/i18n/server';
import { localize, forLocale } from '@/lib/i18n/content';
import { uiT } from '@/lib/i18n/ui';
import { ShopBrowser, type ShopCard } from './ShopBrowser';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const ui = uiT(getLocale());
  return { title: `${ui('shop.title')} · Arden BOUET`, description: ui('shop.sub'), alternates: alternates('/shop') };
}

export default async function ShopPage() {
  const locale = getLocale();
  const bundle = await getContentBundle();
  const products: ShopCard[] = forLocale((bundle.products ?? []).filter(p => p.status === 'published'), locale).map(raw => {
    const p = localize(raw, locale);
    return {
      id: p.id, slug: p.slug, title: p.title, tagline: p.tagline, category: p.category, price: p.price, currency: p.currency,
      priceLabel: p.priceLabel, cover: p.cover || p.media?.find(m => m.kind === 'image')?.url, tags: p.tags ?? [], features: p.features ?? [],
    };
  });
  return <main><ShopBrowser products={products} /></main>;
}
