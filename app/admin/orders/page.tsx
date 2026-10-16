'use client';
// /admin/orders — shop orders: status tabs, search, provider filter, detail drawer, CSV export
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Download, Mail } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { formatBreakdown, formatMoney, formatSummary, summarize } from '@/lib/money';
import { Badge, Button, Drawer, Empty, Field, PageIntro, SearchInput, Spinner, Tabs, inputCls } from '@/components/admin/ui';
import '@/app/blog/story.css';

type Order = {
  id: string; createdAt: string; updatedAt: string; customerName: string; customerEmail: string; productId: string; productTitle: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED'; amount: number; currency: string; paymentRef: string | null; paymentProvider: string | null; notes: string | null;
};
const TONE = { PAID: 'green', PENDING: 'amber', CANCELLED: 'neutral', REFUNDED: 'red' } as const;
const money = (n: number, c: string) => formatMoney(n, c);

function Orders() {
  const params = useSearchParams();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [tab, setTab] = useState<'ALL' | Order['status']>((params.get('status') as Order['status']) || 'ALL');
  const [q, setQ] = useState('');
  const [provider, setProvider] = useState('');
  const [open, setOpen] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => fetch('/api/admin/orders', { cache: 'no-store' }).then(r => r.json()).then(setOrders);
  useEffect(() => { load(); }, []);

  const providers = useMemo(() => Array.from(new Set((orders ?? []).map(o => o.paymentProvider).filter(Boolean))) as string[], [orders]);
  const shown = useMemo(() => (orders ?? []).filter(o =>
    (tab === 'ALL' || o.status === tab) && (!provider || o.paymentProvider === provider) &&
    (!q.trim() || `${o.customerName} ${o.customerEmail} ${o.productTitle} ${o.paymentRef ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()))), [orders, tab, provider, q]);
  const count = (s: Order['status']) => (orders ?? []).filter(o => o.status === s).length;
  // Summed per currency; the headline is converted to USD only when currencies are mixed.
  const paid = summarize((orders ?? []).filter(o => o.status === 'PAID'));

  const update = async (o: Order, data: Partial<Order>) => {
    setBusy(true);
    const res = await fetch(`/api/admin/orders/${o.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const next = await res.json();
    setBusy(false);
    if (res.ok) { setOrders(list => list && list.map(x => (x.id === o.id ? next : x))); setOpen(next); }
  };

  const exportCsv = () => {
    const rows = [['date', 'customer', 'email', 'product', 'amount', 'currency', 'status', 'provider', 'reference'],
      ...shown.map(o => [o.createdAt, o.customerName, o.customerEmail, o.productTitle, o.amount, o.currency, o.status, o.paymentProvider ?? '', o.paymentRef ?? ''])];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageIntro title="Orders" description={orders ? `${formatSummary(paid)} collected from ${count('PAID')} paid orders${paid.byCurrency.length > 1 ? ` (${formatBreakdown(paid)})` : ''}.` : undefined}
        actions={<Button onClick={exportCsv} disabled={!shown.length}><Download className="h-4 w-4" /> Export CSV</Button>} />
      <Tabs value={tab} onChange={setTab} items={[
        { key: 'ALL', label: 'All', count: orders?.length }, { key: 'PAID', label: 'Paid', count: count('PAID') },
        { key: 'PENDING', label: 'Pending', count: count('PENDING'), alert: true }, { key: 'REFUNDED', label: 'Refunded', count: count('REFUNDED') },
        { key: 'CANCELLED', label: 'Cancelled', count: count('CANCELLED') },
      ]} />
      <div className="my-4 flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder="Customer, email, product or reference" className="w-full sm:w-80" />
        {providers.length > 1 && (
          <select value={provider} onChange={e => setProvider(e.target.value)} className="rounded-full border border-[#e6e6e6] bg-white px-3 py-1.5 text-[13px] outline-none">
            <option value="">All providers</option>{providers.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        )}
      </div>

      {!orders ? <Spinner /> : shown.length === 0 ? <Empty title="No orders here" body="Orders appear when customers check out in the shop." /> : (
        <div className="overflow-x-auto rounded-2xl border border-[#f0f0f0] bg-white">
          <table className="w-full min-w-[720px] text-left text-[14px]">
            <thead className="border-b border-[#f2f2f2] text-[11px] uppercase tracking-[0.06em] text-[#9b9b9b]">
              <tr><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Customer</th><th className="px-4 py-3 font-medium">Product</th><th className="px-4 py-3 text-right font-medium">Amount</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Provider</th></tr>
            </thead>
            <tbody>
              {shown.map(o => (
                <tr key={o.id} onClick={() => setOpen(o)} className="cursor-pointer border-b border-[#f6f6f6] last:border-0 hover:bg-[#fcfcfc]">
                  <td className="whitespace-nowrap px-4 py-3 text-[#6b6b6b]">{new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td className="px-4 py-3"><span className="block text-[#242424]">{o.customerName}</span><span className="block text-[12px] text-[#9b9b9b]">{o.customerEmail}</span></td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-[#242424]">{o.productTitle}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#242424]">{money(o.amount, o.currency)}</td>
                  <td className="px-4 py-3"><Badge tone={TONE[o.status]}>{o.status.toLowerCase()}</Badge></td>
                  <td className="px-4 py-3 capitalize text-[#6b6b6b]">{o.paymentProvider ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open ? open.productTitle : ''} subtitle={open && `Order ${open.id.slice(-8)} · ${new Date(open.createdAt).toLocaleString()}`} width={520}>
        {open && (
          <div className="space-y-6">
            <div className="flex items-baseline justify-between">
              <span className="text-[32px] font-semibold tabular-nums tracking-[-0.02em]">{money(open.amount, open.currency)}</span>
              <Badge tone={TONE[open.status]}>{open.status.toLowerCase()}</Badge>
            </div>
            <dl className="divide-y divide-[#f6f6f6] rounded-xl border border-[#f0f0f0] text-[14px]">
              {[['Customer', open.customerName], ['Email', open.customerEmail], ['Provider', open.paymentProvider ?? ''], ['Reference', open.paymentRef ?? ''], ['Product id', open.productId]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-2.5"><dt className="text-[#9b9b9b]">{k}</dt><dd className="truncate text-right font-mono text-[13px] text-[#242424]">{v}</dd></div>
              ))}
            </dl>
            <a href={`mailto:${open.customerEmail}?subject=${encodeURIComponent(`Your order: ${open.productTitle}`)}`} className="inline-flex items-center gap-2 text-[14px] text-[#242424] underline underline-offset-4"><Mail className="h-4 w-4" /> Email the customer</a>
            <Field label="Status">
              <div className="flex flex-wrap gap-2">
                {(['PENDING', 'PAID', 'REFUNDED', 'CANCELLED'] as const).map(s => (
                  <button key={s} type="button" disabled={busy} onClick={() => s !== open.status && (s !== 'REFUNDED' || confirm('Mark as refunded? (This does not refund the payment provider.)')) && update(open, { status: s })}
                    className={`rounded-full px-3 py-1.5 text-[13px] ${open.status === s ? 'bg-[#242424] text-white' : 'border border-[#e6e6e6] hover:border-[#242424]'}`}>{s.toLowerCase()}</button>
                ))}
              </div>
            </Field>
            <Field label="Internal notes">
              <textarea defaultValue={open.notes ?? ''} rows={4} onBlur={e => e.target.value !== (open.notes ?? '') && update(open, { notes: e.target.value })} className={inputCls} />
            </Field>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default function OrdersPage() {
  return <AdminShell title="Orders"><Suspense><Orders /></Suspense></AdminShell>;
}
