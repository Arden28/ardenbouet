'use client';
// Purchase card (sticky on desktop) + mobile bottom bar + "questions? book a call".
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Download, Lock, Clock, Tag } from 'lucide-react';
import { useSite } from '@/components/site/SiteProviders';
import { CURRENCIES, formatPrice, LS_KEY, type CurrencyCode } from '@/lib/currency';

export function BuyCard({ slug, price, currency, priceLabel, isService, demoUrl, hasDiscounts }: {
  slug: string; price: number; currency: string; priceLabel: string; isService: boolean; demoUrl?: string; hasDiscounts: boolean;
}) {
  const { ui, href, openBooking } = useSite();
  const [label, setLabel] = useState(priceLabel || (price ? formatPrice(price, currency, 'USD') : ''));
  useEffect(() => {
    try {
      const s = localStorage.getItem(LS_KEY) as CurrencyCode | null;
      if (s && price && CURRENCIES.some(c => c.code === s)) setLabel(formatPrice(price, currency, s));
    } catch { /* ignore */ }
  }, [price, currency]);
  const checkout = href(`/checkout?product=${encodeURIComponent(slug)}`);

  return (
    <>
      <div className="rounded-2xl border border-[#ececec] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
        <p className="text-[32px] font-semibold tracking-[-0.02em] text-[#242424]">{label}</p>
        <Link href={checkout} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#1a8917] py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#156d12]">
          {isService ? ui('shop.book') : ui('shop.buy')}
        </Link>
        {demoUrl && (
          <a href={demoUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full border border-[#242424] py-3 text-[15px] text-[#242424] hover:bg-[#f9f9f9]">
            {ui('shop.demo')} <ArrowUpRight className="h-4 w-4" />
          </a>
        )}
        <ul className="mt-5 space-y-2.5 text-[13px] text-[#6b6b6b]">
          <li className="flex items-center gap-2.5">{isService ? <Clock className="h-4 w-4" /> : <Download className="h-4 w-4" />} {isService ? ui('shop.serviceNote') : ui('shop.instant')}</li>
          <li className="flex items-center gap-2.5"><Lock className="h-4 w-4" /> {ui('shop.secure')}</li>
          {hasDiscounts && <li className="flex items-center gap-2.5"><Tag className="h-4 w-4" /> {ui('shop.discount')}</li>}
        </ul>
      </div>

      <div className="mt-4 rounded-2xl bg-[#fafafa] p-6">
        <p className="text-[15px] font-semibold text-[#242424]">{ui('shop.questions')}</p>
        <p className="mt-1 text-[14px] text-[#6b6b6b]">{ui('shop.questionsBody')}</p>
        <button type="button" onClick={() => openBooking()} className="mt-4 flex items-center gap-2 rounded-full border border-[#242424] px-4 py-2 text-[14px] text-[#242424] hover:bg-white">
          <CalendarDays className="h-4 w-4" /> {ui('home.book.cta')}
        </button>
      </div>

      {/* Mobile purchase bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-4 border-t border-[#ececec] bg-white/95 px-5 py-3 backdrop-blur lg:hidden">
        <span className="text-[18px] font-semibold text-[#242424]">{label}</span>
        <Link href={checkout} className="ml-auto rounded-full bg-[#1a8917] px-5 py-2.5 text-[14px] font-medium text-white">{isService ? ui('shop.book') : ui('shop.buy')}</Link>
      </div>
    </>
  );
}
