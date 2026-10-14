'use client';
// /me/earnings — Stripe Connect onboarding + donations received
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Check, Clock, ExternalLink, Wallet } from 'lucide-react';
import { useSite } from '@/components/site/SiteProviders';
import { fmtDate } from '@/lib/blog/strings';

type Status = {
  available: boolean; isWriter: boolean; connected: boolean; chargesEnabled: boolean; payoutsEnabled: boolean;
  totals: { currency: string; amount: number; count: number }[];
  recent: { id: string; amount: number; currency: string; feeAmount: number; donorName: string; message: string; createdAt: string; post: { title: string; slug: string } | null }[];
};

const money = (n: number, c: string, locale: string) => new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: c.toUpperCase() }).format(n / 100);

function Earnings() {
  const { ui, locale, href, refreshMe } = useSite();
  const returning = useSearchParams().get('stripe');
  const [s, setS] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/me/stripe', { cache: 'no-store' }).then(r => r.json()).then(d => { setS(d); if (returning) refreshMe(); });
  }, [returning, refreshMe]);

  const go = async (action: 'onboard' | 'dashboard') => {
    setBusy(true);
    setError('');
    const res = await fetch('/api/me/stripe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setBusy(false); setError(d.error || 'Stripe is unavailable'); return; }
    if (action === 'dashboard') { window.open(d.url, '_blank', 'noopener'); setBusy(false); } else window.location.assign(d.url);
  };

  if (!s) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#9b9b9b]" /></div>;

  return (
    <div>
      <h1 className="text-[32px] font-bold tracking-[-0.02em] text-[#242424] sm:text-[42px]">{ui('me.earn.title')}</h1>
      <p className="mt-3 max-w-[560px] text-[15px] leading-6 text-[#6b6b6b]">{ui('me.earn.body')}</p>

      {!s.isWriter ? (
        <p className="mt-10 rounded-lg bg-[#f6f6f6] p-5 text-[15px] text-[#6b6b6b]">{ui('me.earn.writerOnly')} <a href={href('/me/writer')} className="text-[#1a8917] underline">{ui('me.writer')}</a></p>
      ) : (
        <div className="mt-10 rounded-xl border border-[#f2f2f2] p-6">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#635bff]/10 text-[#635bff]"><Wallet className="h-6 w-6" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-[16px] font-medium text-[#242424]">Stripe</p>
              <p className="flex items-center gap-1.5 text-[13px] text-[#6b6b6b]">
                {s.chargesEnabled && s.payoutsEnabled ? <><Check className="h-3.5 w-3.5 text-[#1a8917]" /> {ui('me.earn.ready')}</>
                  : s.connected ? <><Clock className="h-3.5 w-3.5" /> {ui('me.earn.pending')}</> : '—'}
              </p>
            </div>
            {!s.available ? (
              <span className="text-[13px] text-[#9b9b9b]">Payments are not configured on this site yet.</span>
            ) : s.chargesEnabled ? (
              <button type="button" onClick={() => go('dashboard')} disabled={busy} className="flex items-center gap-2 rounded-full border border-[#242424] px-4 py-2 text-[14px] hover:bg-[#f9f9f9]">
                {ui('me.earn.dashboard')} <ExternalLink className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button type="button" onClick={() => go('onboard')} disabled={busy} className="flex items-center gap-2 rounded-full bg-[#635bff] px-5 py-2 text-[14px] text-white hover:bg-[#5249e0] disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}{s.connected ? ui('me.earn.continue') : ui('me.earn.connect')}
              </button>
            )}
          </div>
          {error && <p className="mt-3 text-[13px] text-[#c94a4a]">{error}</p>}
        </div>
      )}

      {s.totals.length > 0 && (
        <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-[#f2f2f2] bg-[#f2f2f2] sm:grid-cols-2">
          {s.totals.map(t => (
            <div key={t.currency} className="bg-white px-5 py-4">
              <p className="text-[28px] font-semibold tracking-[-0.02em] text-[#242424]">{money(t.amount, t.currency, locale)}</p>
              <p className="text-[13px] text-[#6b6b6b]">{ui('me.earn.total')} · {t.count} {ui('me.earn.count').toLowerCase()}</p>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-12 text-[18px] font-bold text-[#242424]">{ui('me.earn.recent')}</h2>
      {s.recent.length === 0 ? <p className="mt-4 text-[14px] text-[#6b6b6b]">{ui('me.earn.none')}</p> : (
        <ul className="mt-3">
          {s.recent.map(d => (
            <li key={d.id} className="flex items-start gap-4 border-b border-[#f2f2f2] py-4">
              <span className="w-24 shrink-0 text-[16px] font-semibold text-[#1a8917]">{money(d.amount - d.feeAmount, d.currency, locale)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] text-[#242424]">{d.donorName || ui('me.earn.anonymous')}{d.post && <span className="text-[#6b6b6b]"> · {d.post.title}</span>}</p>
                {d.message && <p className="mt-1 font-story text-[15px] italic text-[#6b6b6b]">“{d.message}”</p>}
              </div>
              <span className="shrink-0 text-[12px] text-[#9b9b9b]">{fmtDate(d.createdAt, locale)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function EarningsPage() {
  return <Suspense><Earnings /></Suspense>;
}
