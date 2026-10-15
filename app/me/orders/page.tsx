'use client';
// /me/orders — the reader's shop orders, with downloads through the existing /download/[token] page.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, CalendarDays, Download, Loader2, Package, RefreshCw } from 'lucide-react';
import { useSite } from '@/components/site/SiteProviders';
import { fmtDate } from '@/lib/blog/strings';
import type { UiKey } from '@/lib/i18n/ui';
import { OWNER } from '@/lib/site';
import type { MeOrder } from '@/lib/meOrders';

const STATUS_CLS: Record<MeOrder['status'], string> = {
  PAID: 'bg-[#eef7ee] text-[#1a6b17]', PENDING: 'bg-[#fdf6e7] text-[#7a5a00]', CANCELLED: 'bg-[#f2f2f2] text-[#6b6b6b]', REFUNDED: 'bg-[#eef4fb] text-[#2467ac]',
};

function money(amount: number, currency: string, locale: string) {
  try { return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount); }
  catch { return `${amount} ${currency}`; }
}

function OrderCard({ o }: { o: MeOrder }) {
  const { ui, href, locale, openBooking } = useSite();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const cover = o.product?.cover;
  const isService = o.product?.category === 'service';
  const canDownload = o.status === 'PAID' && (o.product?.downloadable || !!o.download);
  const ready = o.download?.state === 'ready';

  // Valid link → straight to the download page; otherwise ask for a fresh one first.
  const download = async () => {
    if (ready && o.download) { router.push(`/download/${o.download.token}`); return; }
    setBusy(true);
    setError('');
    const res = await fetch(`/api/me/orders/${o.id}/download`, { method: 'POST' });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.token) router.push(`/download/${d.token}`);
    else { setBusy(false); setError(d.error ?? 'Something went wrong'); }
  };

  return (
    <li className="overflow-hidden rounded-2xl border border-[#ececec] bg-white">
      <div className="flex gap-4 p-5">
        {cover
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={cover} alt="" className="h-[72px] w-[96px] shrink-0 rounded-xl object-cover" />
          : <span className="flex h-[72px] w-[96px] shrink-0 items-center justify-center rounded-xl bg-[#f2f2f2]"><Package className="h-6 w-6 text-[#9b9b9b]" strokeWidth={1.5} /></span>}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
            <h2 className="min-w-0 flex-1 text-[16px] font-semibold leading-snug text-[#242424]">{o.productTitle}</h2>
            <span className="shrink-0 text-[16px] font-semibold tabular-nums text-[#242424]">{money(o.amount, o.currency, locale)}</span>
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#6b6b6b]">
            <span className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${STATUS_CLS[o.status]}`}>{ui(`me.orders.status.${o.status}` as UiKey)}</span>
            <span>{fmtDate(o.createdAt, locale)}</span>
            {o.paymentProvider && <><span>·</span><span className="capitalize">{o.paymentProvider}</span></>}
            {isService && <><span>·</span><span>{ui('me.orders.service')}</span></>}
          </p>
          <p className="mt-1 font-mono text-[11px] text-[#9b9b9b]">{ui('me.orders.ref', { id: o.id.slice(-10).toUpperCase() })}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#f2f2f2] bg-[#fafafa] px-5 py-3">
        {o.status === 'PENDING' ? (
          <span className="text-[13px] text-[#7a5a00]">{ui('me.orders.pendingNote')}</span>
        ) : isService && o.status === 'PAID' ? (
          <button type="button" onClick={() => openBooking()} className="inline-flex items-center gap-2 rounded-full bg-[#242424] px-4 py-2 text-[13px] font-medium text-white hover:bg-black">
            <CalendarDays className="h-4 w-4" /> {ui('me.orders.book')}
          </button>
        ) : canDownload ? (
          <>
            <button type="button" onClick={download} disabled={busy}
              className="inline-flex items-center gap-2 rounded-full bg-[#1a8917] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#156d12] disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : ready ? <Download className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
              {busy ? ui('me.orders.preparing') : ready ? ui('me.orders.download') : ui('me.orders.newLink')}
            </button>
            <span className="text-[12px] text-[#6b6b6b]">
              {ready && o.download ? ui('me.orders.left', { n: o.download.left, max: o.download.max, date: fmtDate(o.download.expiresAt, locale) })
                : o.download?.state === 'expired' ? ui('me.orders.expired')
                  : o.download?.state === 'exhausted' ? ui('me.orders.exhausted') : ui('me.orders.noLink')}
            </span>
          </>
        ) : <span />}
        {o.product && (
          <Link href={href(`/shop/${o.product.slug}`)} className="ml-auto inline-flex items-center gap-1 text-[13px] text-[#6b6b6b] hover:text-[#242424]">
            {ui('me.orders.view')} <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      {error && <p className="border-t border-[#f2f2f2] px-5 py-2.5 text-[13px] text-[#c94a4a]">{error}</p>}
    </li>
  );
}

export default function OrdersPage() {
  const { ui, href } = useSite();
  const [data, setData] = useState<{ email: string | null; orders: MeOrder[] } | null>(null);
  useEffect(() => { fetch('/api/me/orders', { cache: 'no-store' }).then(r => r.json()).then(setData).catch(() => setData({ email: null, orders: [] })); }, []);

  return (
    <div>
      <h1 className="text-[32px] font-bold tracking-[-0.02em] text-[#242424]">{ui('me.orders.title')}</h1>
      <p className="mt-2 text-[15px] text-[#6b6b6b]">{ui('me.orders.sub')}</p>

      {data === null ? (
        <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#9b9b9b]" /></div>
      ) : !data.email ? (
        <p className="mt-8 rounded-2xl bg-[#fafafa] p-6 text-[14px] leading-6 text-[#6b6b6b]">{ui('me.orders.noEmail')}</p>
      ) : data.orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#e6e6e6] px-6 py-14 text-center">
          <Package className="mx-auto h-8 w-8 text-[#c4c4c4]" strokeWidth={1.4} />
          <p className="mt-3 text-[16px] font-medium text-[#242424]">{ui('me.orders.empty')}</p>
          <p className="mt-1 text-[14px] text-[#6b6b6b]">{ui('me.orders.emptyBody')}</p>
          <Link href={href('/shop')} className="mt-5 inline-flex rounded-full bg-[#242424] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-black">{ui('me.orders.browse')}</Link>
        </div>
      ) : (
        <>
          <p className="mt-6 text-[13px] text-[#9b9b9b]">{ui('me.orders.matched', { email: data.email })}</p>
          <ul className="mt-3 space-y-4">{data.orders.map(o => <OrderCard key={o.id} o={o} />)}</ul>
          <p className="mt-8 text-[13px] text-[#9b9b9b]">{ui('me.orders.help', { email: OWNER.supportEmail })}</p>
        </>
      )}
    </div>
  );
}
