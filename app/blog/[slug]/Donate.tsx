'use client';
// "Support the writer" — one-time donation through Stripe (amount → payment → thanks).
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Heart, Loader2, X, Check } from 'lucide-react';
import { useReader, useSite } from '../_components/ReaderProvider';

type Info = { enabled: boolean; recipient?: string; publishableKey?: string; supporters?: number };

let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = (key: string) => (stripePromise ??= loadStripe(key));

const PRESETS = [300, 500, 1000, 2500];
const COPY = {
  en: { cta: 'Support {name}', lead: 'Enjoyed this story? Leave a one-time tip.', title: 'Support {name}', other: 'Other', message: 'Add a note (optional)', name: 'Your name (optional)', email: 'Email for the receipt', publicLabel: 'Show my name to the writer', next: 'Continue', pay: 'Send {amount}', thanks: 'Thank you!', thanksBody: '{name} will be glad to hear from you.', supporters: '{n} supporters', secure: 'Payments are processed securely by Stripe.', back: 'Back' },
  fr: { cta: 'Soutenir {name}', lead: 'Vous avez aimé cet article ? Laissez un pourboire.', title: 'Soutenir {name}', other: 'Autre', message: 'Ajouter un mot (facultatif)', name: 'Votre nom (facultatif)', email: 'E-mail pour le reçu', publicLabel: 'Montrer mon nom à l’auteur', next: 'Continuer', pay: 'Envoyer {amount}', thanks: 'Merci !', thanksBody: '{name} sera ravi de votre soutien.', supporters: '{n} soutiens', secure: 'Paiement sécurisé par Stripe.', back: 'Retour' },
};

function fill(s: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), s);
}

function PayStep({ amountLabel, onDone, onBack, copy, paymentIntentId }: {
  amountLabel: string; onDone: () => void; onBack: () => void; copy: typeof COPY.en; paymentIntentId: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pay = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    setError('');
    const { error: e } = await stripe.confirmPayment({ elements, redirect: 'if_required', confirmParams: { return_url: window.location.href } });
    if (e) { setBusy(false); setError(e.message ?? 'Payment failed'); return; }
    await fetch('/api/blog/donations/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentIntentId }) }).catch(() => {});
    onDone();
  };
  return (
    <div>
      <PaymentElement options={{ layout: 'tabs' }} />
      {error && <p className="mt-3 text-[13px] text-[#c94a4a]">{error}</p>}
      <div className="mt-6 flex items-center gap-3">
        <button type="button" onClick={onBack} className="rounded-full px-4 py-2.5 text-[14px] text-[#242424] hover:bg-[#f2f2f2]">{copy.back}</button>
        <button type="button" onClick={pay} disabled={busy || !stripe} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#1a8917] py-2.5 text-[15px] font-medium text-white hover:bg-[#156d12] disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}{fill(copy.pay, { amount: amountLabel })}
        </button>
      </div>
    </div>
  );
}

export function DonateCard({ slug }: { slug: string }) {
  const { locale } = useSite();
  const { reader } = useReader();
  const copy = COPY[locale] ?? COPY.en;
  const [info, setInfo] = useState<Info | null>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'amount' | 'pay' | 'done'>('amount');
  const [amount, setAmount] = useState(500);
  const [custom, setCustom] = useState('');
  const [form, setForm] = useState({ name: '', email: '', message: '', isPublic: true });
  const [intent, setIntent] = useState<{ clientSecret: string; paymentIntentId: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetch(`/api/blog/posts/${encodeURIComponent(slug)}/donate`).then(r => r.json()).then(setInfo).catch(() => {}); }, [slug]);
  useEffect(() => { if (reader) setForm(f => ({ ...f, name: f.name || reader.name })); }, [reader]);

  const value = custom ? Math.round(parseFloat(custom.replace(',', '.')) * 100) || 0 : amount;
  const fmt = useMemo(() => new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: value % 100 ? 2 : 0 }), [locale, value]);

  if (!info?.enabled || !info.publishableKey) return null;
  const name = info.recipient ?? '';

  const start = async () => {
    setBusy(true);
    setError('');
    const res = await fetch(`/api/blog/posts/${encodeURIComponent(slug)}/donate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: value, ...form }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(d.error || 'Something went wrong'); return; }
    setIntent(d);
    setStep('pay');
  };
  const close = () => { setOpen(false); setTimeout(() => { setStep('amount'); setIntent(null); setError(''); }, 200); };

  return (
    <>
      <div className="mt-10 flex flex-col items-center gap-4 rounded-xl bg-[#f9f9f9] px-6 py-8 text-center">
        <p className="font-story text-[18px] text-[#242424]">{copy.lead}</p>
        <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-full bg-[#242424] px-5 py-2.5 text-[14px] text-white transition-colors hover:bg-black">
          <Heart className="h-4 w-4" /> {fill(copy.cta, { name })}
        </button>
        {!!info.supporters && <p className="text-[13px] text-[#6b6b6b]">{fill(copy.supporters, { n: info.supporters })}</p>}
      </div>

      {open && createPortal(
        <div className="blog-ui fixed inset-0 z-[150] flex items-center justify-center bg-black/30 p-4" onMouseDown={close}>
          <div role="dialog" aria-modal="true" className="relative max-h-[92vh] w-full max-w-[460px] overflow-y-auto rounded-xl bg-white p-7 shadow-2xl" onMouseDown={e => e.stopPropagation()}>
            <button type="button" onClick={close} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1.5 text-[#6b6b6b] hover:bg-[#f2f2f2]"><X className="h-5 w-5" /></button>

            {step === 'done' ? (
              <div className="py-6 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef7ee]"><Check className="h-7 w-7 text-[#1a8917]" /></span>
                <h2 className="mt-5 font-story text-[28px] text-[#242424]">{copy.thanks}</h2>
                <p className="mt-2 text-[15px] text-[#6b6b6b]">{fill(copy.thanksBody, { name })}</p>
              </div>
            ) : (
              <>
                <h2 className="font-story text-[26px] leading-8 text-[#242424]">{fill(copy.title, { name })}</h2>
                {step === 'amount' && (
                  <div className="mt-6">
                    <div className="grid grid-cols-4 gap-2">
                      {PRESETS.map(p => (
                        <button key={p} type="button" onClick={() => { setAmount(p); setCustom(''); }}
                          className={`rounded-lg border py-3 text-[16px] font-medium transition-colors ${!custom && amount === p ? 'border-[#1a8917] bg-[#eef7ee] text-[#1a6b17]' : 'border-[#e6e6e6] text-[#242424] hover:border-[#242424]'}`}>
                          ${p / 100}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center rounded-lg border border-[#e6e6e6] px-3 focus-within:border-[#242424]">
                      <span className="text-[16px] text-[#9b9b9b]">$</span>
                      <input inputMode="decimal" value={custom} onChange={e => setCustom(e.target.value.replace(/[^\d.,]/g, ''))} placeholder={copy.other} className="min-w-0 flex-1 bg-transparent px-2 py-3 text-[16px] outline-none" />
                    </div>
                    <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} maxLength={280} rows={2} placeholder={copy.message}
                      className="mt-4 w-full resize-none rounded-lg border border-[#e6e6e6] px-3 py-2.5 font-story text-[15px] outline-none focus:border-[#242424]" />
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={copy.name} className="rounded-lg border border-[#e6e6e6] px-3 py-2.5 text-[14px] outline-none focus:border-[#242424]" />
                      <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder={copy.email} className="rounded-lg border border-[#e6e6e6] px-3 py-2.5 text-[14px] outline-none focus:border-[#242424]" />
                    </div>
                    <label className="mt-3 flex items-center gap-2 text-[13px] text-[#6b6b6b]">
                      <input type="checkbox" checked={form.isPublic} onChange={e => setForm({ ...form, isPublic: e.target.checked })} className="accent-[#1a8917]" /> {copy.publicLabel}
                    </label>
                    {error && <p className="mt-3 text-[13px] text-[#c94a4a]">{error}</p>}
                    <button type="button" onClick={start} disabled={busy || value < 100} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#1a8917] py-3 text-[15px] font-medium text-white hover:bg-[#156d12] disabled:opacity-50">
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />}{copy.next} · {fmt.format(value / 100)}
                    </button>
                  </div>
                )}
                {step === 'pay' && intent && (
                  <div className="mt-6">
                    <Elements stripe={getStripe(info.publishableKey)} options={{ clientSecret: intent.clientSecret, appearance: { theme: 'stripe', variables: { colorPrimary: '#1a8917', borderRadius: '8px', fontFamily: 'Inter, system-ui, sans-serif' } } }}>
                      <PayStep amountLabel={fmt.format(value / 100)} copy={copy} paymentIntentId={intent.paymentIntentId} onBack={() => setStep('amount')} onDone={() => setStep('done')} />
                    </Elements>
                  </div>
                )}
                <p className="mt-5 text-center text-[12px] text-[#9b9b9b]">{copy.secure}</p>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
