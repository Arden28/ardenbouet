'use client';
// Shop catalogue: category pills, search, currency, featured product + grid, services list.
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Layers, Package, FileText, Wrench, ArrowRight, CalendarDays } from 'lucide-react';
import { useSite } from '@/components/site/SiteProviders';
import { CURRENCIES, formatPrice, LS_KEY, type CurrencyCode } from '@/lib/currency';
import type { UiKey } from '@/lib/i18n/ui';

export type ShopCard = {
  id: string; slug: string; title: string; tagline: string; category: 'platform' | 'app' | 'document' | 'service';
  price: number; currency: string; priceLabel: string; cover?: string; tags: string[]; features: string[];
};

const ICON = { platform: Layers, app: Package, document: FileText, service: Wrench } as const;

function useCurrency(): [CurrencyCode | null, (c: CurrencyCode) => void] {
  const [c, setC] = useState<CurrencyCode | null>(null);
  useEffect(() => {
    try { const s = localStorage.getItem(LS_KEY) as CurrencyCode | null; if (s && CURRENCIES.some(x => x.code === s)) setC(s); } catch { /* ignore */ }
  }, []);
  return [c, (v: CurrencyCode) => { setC(v); try { localStorage.setItem(LS_KEY, v); } catch { /* ignore */ } }];
}

export function ShopBrowser({ products }: { products: ShopCard[] }) {
  const { ui, href, openBooking } = useSite();
  const [cat, setCat] = useState<'all' | ShopCard['category']>('all');
  const [q, setQ] = useState('');
  const [currency, setCurrency] = useCurrency();
  const price = (p: ShopCard) => (currency && p.price ? formatPrice(p.price, p.currency, currency) : p.priceLabel || (p.price ? formatPrice(p.price, p.currency, 'USD') : ''));

  const goods = products.filter(p => p.category !== 'service');
  const services = products.filter(p => p.category === 'service');
  const cats = useMemo(() => Array.from(new Set(goods.map(p => p.category))), [goods]);
  const shown = goods.filter(p => (cat === 'all' || p.category === cat) && (!q.trim() || `${p.title} ${p.tagline} ${p.tags.join(' ')}`.toLowerCase().includes(q.trim().toLowerCase())));
  const [featured, ...rest] = shown;

  return (
    <div className="blog-ui">
      <header className="mx-auto max-w-[1192px] px-6 pb-10 pt-12 sm:pt-16">
        <h1 className="font-story text-[52px] leading-none tracking-[-0.03em] text-[#242424] sm:text-[72px]">{ui('shop.title')}</h1>
        <p className="mt-5 max-w-[640px] font-story text-[20px] leading-[1.55] text-[#6b6b6b] sm:text-[22px]">{ui('shop.sub')}</p>
      </header>

      <div className="sticky top-[60px] z-20 border-y border-[#f2f2f2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1192px] flex-wrap items-center gap-3 px-6 py-3">
          <nav className="no-scrollbar flex gap-2 overflow-x-auto" aria-label="Categories">
            {(['all', ...cats] as const).map(c => (
              <button key={c} type="button" onClick={() => setCat(c)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-[14px] transition-colors ${cat === c ? 'bg-[#242424] text-white' : 'bg-[#f2f2f2] text-[#242424] hover:bg-[#e6e6e6]'}`}>
                {c === 'all' ? ui('shop.all') : ui(`shop.cat.${c}` as UiKey)}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <label className="flex items-center gap-2 rounded-full bg-[#f6f6f6] px-3 py-1.5">
              <Search className="h-4 w-4 text-[#9b9b9b]" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder={ui('shop.search')} className="w-40 bg-transparent text-[14px] outline-none sm:w-56" />
            </label>
            <select value={currency ?? ''} onChange={e => setCurrency(e.target.value as CurrencyCode)} aria-label={ui('shop.currency')}
              className="cursor-pointer rounded-full border border-[#e6e6e6] bg-white px-3 py-1.5 text-[13px] text-[#242424] outline-none">
              <option value="" disabled>{ui('shop.currency')}</option>
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1192px] px-6 pt-10">
        {!featured ? (
          <p className="py-20 text-center text-[16px] text-[#6b6b6b]">{ui('shop.empty')}</p>
        ) : (
          <>
            {/* Featured */}
            <Link href={href(`/shop/${featured.slug}`)} className="group grid items-center gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
              <div className="overflow-hidden rounded-3xl bg-[#f4f4f4]">
                {featured.cover
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={featured.cover} alt="" className="aspect-[16/10] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                  : <div className="flex aspect-[16/10] items-center justify-center text-[#c4c4c4]">{(() => { const I = ICON[featured.category]; return <I className="h-14 w-14" strokeWidth={1} />; })()}</div>}
              </div>
              <div>
                <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#1a8917]">{ui('shop.featured')} · {ui(`shop.catOne.${featured.category}` as UiKey)}</p>
                <h2 className="mt-3 text-[34px] font-bold leading-[40px] tracking-[-0.02em] text-[#242424] group-hover:underline group-hover:decoration-[#d4d4d4] group-hover:underline-offset-4">{featured.title}</h2>
                <p className="mt-3 font-story text-[20px] leading-[30px] text-[#6b6b6b]">{featured.tagline}</p>
                {featured.features.length > 0 && (
                  <ul className="mt-5 space-y-1.5 text-[15px] text-[#242424]">
                    {featured.features.slice(0, 3).map(f => <li key={f} className="flex gap-2"><span className="text-[#1a8917]">✓</span>{f}</li>)}
                  </ul>
                )}
                <div className="mt-7 flex items-center gap-5">
                  <span className="text-[24px] font-semibold tracking-[-0.01em] text-[#242424]">{price(featured)}</span>
                  <span className="flex items-center gap-2 rounded-full bg-[#242424] px-5 py-2.5 text-[14px] font-medium text-white">{ui('shop.view')} <ArrowRight className="h-4 w-4" /></span>
                </div>
              </div>
            </Link>

            {rest.length > 0 && (
              <div className="mt-16 grid gap-x-8 gap-y-12 border-t border-[#f2f2f2] pt-12 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map(p => {
                  const I = ICON[p.category];
                  return (
                    <Link key={p.id} href={href(`/shop/${p.slug}`)} className="group flex flex-col">
                      <div className="overflow-hidden rounded-2xl bg-[#f4f4f4]">
                        {p.cover
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={p.cover} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                          : <div className="flex aspect-[4/3] items-center justify-center text-[#c4c4c4]"><I className="h-10 w-10" strokeWidth={1} /></div>}
                      </div>
                      <p className="mt-4 text-[12px] font-medium uppercase tracking-[0.1em] text-[#9b9b9b]">{ui(`shop.catOne.${p.category}` as UiKey)}</p>
                      <h3 className="mt-1.5 text-[20px] font-bold leading-6 tracking-[-0.016em] text-[#242424]">{p.title}</h3>
                      <p className="mt-1.5 text-[15px] leading-[22px] text-[#6b6b6b] line-clamp-2">{p.tagline}</p>
                      <p className="mt-3 text-[16px] font-semibold text-[#242424]">{price(p)}</p>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}

        {services.length > 0 && (cat === 'all' || cat === 'service') && (
          <section className="mt-24 rounded-3xl bg-[#fafafa] px-6 py-12 sm:px-12">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-story text-[36px] leading-[1.1] tracking-[-0.02em] text-[#242424]">{ui('shop.services.title')}</h2>
                <p className="mt-2 text-[15px] text-[#6b6b6b]">{ui('shop.services.sub')}</p>
              </div>
              <button type="button" onClick={() => openBooking()} className="flex items-center gap-2 rounded-full border border-[#242424] px-4 py-2 text-[14px] hover:bg-white"><CalendarDays className="h-4 w-4" /> {ui('home.book.cta')}</button>
            </div>
            <ul className="mt-8 divide-y divide-[#ececec]">
              {services.map(s => (
                <li key={s.id}>
                  <Link href={href(`/shop/${s.slug}`)} className="group flex flex-wrap items-baseline gap-x-6 gap-y-1 py-5">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[19px] font-bold tracking-[-0.01em] text-[#242424] group-hover:underline group-hover:decoration-[#d4d4d4] group-hover:underline-offset-4">{s.title}</span>
                      <span className="mt-1 block text-[15px] text-[#6b6b6b]">{s.tagline}</span>
                    </span>
                    <span className="text-[16px] font-semibold text-[#242424]">{price(s)}</span>
                    <ArrowRight className="h-4 w-4 text-[#9b9b9b] transition-transform group-hover:translate-x-1 group-hover:text-[#242424]" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
