'use client';
// app/checkout/CheckoutClient.tsx — one-page checkout: details → payment method (accordion) → confirmation.
// Payment flows (Stripe Elements, Paystack inline, M-Pesa STK push + polling, PayPal buttons) all stay on-page.

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowLeft, CalendarDays, Check, ChevronDown, CreditCard, Download, Loader2, Lock, Mail, ShieldCheck, Smartphone, Tag, X } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import type { DiscountCode } from '@/app/admin/types';
import type { PublicProduct as ShopProduct } from '@/lib/publicContent';
import { formatPrice, CURRENCIES, LS_KEY, type CurrencyCode } from '@/lib/currency';
import { useSite } from '@/components/site/SiteProviders';
import type { UiKey, UiT } from '@/lib/i18n/ui';
import { OWNER } from '@/lib/site';

export type MethodId = 'stripe' | 'paystack' | 'mpesa' | 'paypal';
// finalPrice is for display; the server prices every charge itself from the product and `code`.
type PayProps = { product: ShopProduct; name: string; email: string; finalPrice: number; code?: string; display: CurrencyCode; ui: UiT; onSuccess: (ref: string) => void };

const EASE = [0.16, 1, 0.3, 1] as const;

let _stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripe() {
  if (!_stripePromise) _stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');
  return _stripePromise;
}

const isDark = () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

// ─── Atoms ─────────────────────────────────────────────────────────────────────
const inputCls = 'w-full rounded-xl border border-[#e6e6e6] bg-transparent px-4 py-3 text-[15px] text-[#242424] outline-none transition-colors placeholder:text-[#b3b3b3] focus:border-[#242424]';

function PayButton({ onClick, disabled, loading, children }: { onClick?: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled || loading}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#1a8917] px-6 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-[#156d12] disabled:cursor-not-allowed disabled:opacity-50">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
      {children}
    </button>
  );
}

function ErrorNote({ msg }: { msg: string }) {
  return (
    <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl bg-[#fdf1f1] px-3.5 py-3 text-[14px] leading-5 text-[#c94a4a]">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {msg}
    </p>
  );
}

function ChargeNote({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-[#fafafa] px-4 py-3 text-[14px] text-[#6b6b6b]">{children}</p>;
}

/** Brand marks sit on a fixed white chip so they read the same in light and dark mode. */
function ProviderMark({ id }: { id: MethodId }) {
  return (
    <span className="flex h-11 w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#ececec] bg-[#ffffff] sm:w-[132px]">
      {id === 'stripe' ? (
        <span className="flex items-center gap-1.5 text-[15px] font-semibold text-[#3c3c3c]"><CreditCard className="h-6 w-6" /> Card</span>
      ) : id === 'paystack' ? (
        // The source image is a padded square — crop to the wordmark band.
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/images/paystack.png" alt="Paystack" className="h-[124px] w-[124px] max-w-none object-cover" />
      ) : id === 'mpesa' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/images/mpesa.png" alt="M-Pesa" className="h-10 w-auto object-contain" />
      ) : (
        <span className="flex items-center gap-1 text-[17px] font-bold italic tracking-[-0.02em]">
          <PayPalGlyph /><span className="text-[#003087]">Pay</span><span className="-ml-1 text-[#009CDE]">Pal</span>
        </span>
      )}
    </span>
  );
}

function PayPalGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden fill="none">
      <path fill="#003087" d="M7.5 3h5.6c2.5 0 4.1 1.7 3.6 4.1-.6 3-2.7 4.4-5.5 4.4H9.5l-1 6H5.3L7.5 3z" />
      <path fill="#009CDE" d="M9.8 5.5H15c2.3 0 3.8 1.5 3.3 3.8-.5 2.8-2.5 4.1-5 4.1h-1.5L10.7 20H7.5L9.8 5.5z" />
      <path fill="#012169" d="M12.1 8h4.7c2.1 0 3.5 1.4 3 3.5-.5 2.5-2.3 3.8-4.7 3.8h-1.3L12.9 22H10L12.1 8z" />
    </svg>
  );
}

const METHOD_KEY: Record<MethodId, string> = { stripe: 'card', paystack: 'paystack', mpesa: 'mpesa', paypal: 'paypal' };
const methodName = (ui: UiT, m: MethodId) => ui(`co.method.${METHOD_KEY[m]}` as UiKey);
const methodDetail = (ui: UiT, m: MethodId) => ui(`co.method.${METHOD_KEY[m]}Detail` as UiKey);

// ─── Stripe ────────────────────────────────────────────────────────────────────
function StripeCardForm({ product, name, email, finalPrice, code, display, ui, onSuccess }: PayProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dark = isDark();

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, code, customerName: name, customerEmail: email }),
      });
      const { clientSecret, error: serverErr } = await res.json();
      if (serverErr) throw new Error(serverErr);
      const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement)!, billing_details: { name, email } },
      });
      if (stripeErr) throw new Error(stripeErr.message);
      if (paymentIntent?.status === 'succeeded') onSuccess(`stripe_${paymentIntent.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : ui('co.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="rounded-xl border border-[#e6e6e6] px-4 py-3.5">
        <CardElement options={{
          style: {
            base: { fontSize: '15px', color: dark ? '#e6e6e6' : '#242424', '::placeholder': { color: dark ? '#6e6e6e' : '#b3b3b3' } },
            invalid: { color: '#c94a4a' },
          },
          hidePostalCode: true,
        }} />
      </div>
      {error && <ErrorNote msg={error} />}
      <PayButton onClick={handlePay} loading={loading} disabled={!stripe}>
        {ui('co.pay', { amount: formatPrice(finalPrice, product.currency, display) })}
      </PayButton>
    </div>
  );
}

// ─── Paystack ──────────────────────────────────────────────────────────────────
const PAYSTACK_CURRENCY = process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY ?? 'KES';
const PAYSTACK_RATES: Record<string, number> = {
  NGN: Number(process.env.NEXT_PUBLIC_PAYSTACK_USD_TO_NGN) || 1600,
  KES: Number(process.env.NEXT_PUBLIC_MPESA_USD_TO_KES) || 130,
};
const PAYSTACK_SYMBOLS: Record<string, string> = { NGN: '₦', KES: 'KSh', GHS: '₵', ZAR: 'R' };

type PaystackPopType = { setup: (o: object) => { openIframe: () => void } };

function waitForPaystack(maxMs = 6000): Promise<PaystackPopType | null> {
  return new Promise(resolve => {
    let elapsed = 0;
    const check = () => {
      const pop = (window as unknown as { PaystackPop?: PaystackPopType }).PaystackPop;
      if (pop) { resolve(pop); return; }
      if (elapsed >= maxMs) { resolve(null); return; }
      elapsed += 150;
      setTimeout(check, 150);
    };
    check();
  });
}

function PaystackForm({ product, name, email, finalPrice, code, display, ui, onSuccess }: PayProps) {
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rate = PAYSTACK_RATES[PAYSTACK_CURRENCY] ?? 1;
  const symbol = PAYSTACK_SYMBOLS[PAYSTACK_CURRENCY] ?? PAYSTACK_CURRENCY;
  const amountLocal = Math.round(finalPrice * rate);

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    const pop = await waitForPaystack();
    if (!pop) { setLoading(false); setError(ui('co.paystack.unavailable')); return; }

    const ref = `arden_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const fail = (reference: string) => { setVerifying(false); setLoading(false); setError(ui('co.pending', { ref: reference })); };

    // Paystack can lag behind its own callback — retry verification with backoff.
    const verifyWithRetry = (reference: string, attempt = 0): void => {
      const retry = () => (attempt < 2 ? setTimeout(() => verifyWithRetry(reference, attempt + 1), 1200 * (attempt + 1)) : fail(reference));
      fetch('/api/checkout/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, productId: product.id, code, customerName: name, customerEmail: email }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.ok) { setVerifying(false); setLoading(false); onSuccess(`paystack_${reference}`); } else retry();
        })
        .catch(retry);
    };

    try {
      pop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email, amount: amountLocal * 100, currency: PAYSTACK_CURRENCY, ref,
        metadata: { productId: product.id, productTitle: product.title, customerName: name },
        callback: (response: { reference: string }) => { setVerifying(true); verifyWithRetry(response.reference); },
        onClose: () => { setLoading(false); setVerifying(false); },
      }).openIframe();
    } catch (e: unknown) {
      setLoading(false);
      setError(e instanceof Error ? e.message : ui('co.failed'));
    }
  };

  return (
    <div>
      <ChargeNote>
        {ui('co.charged', { amount: `${symbol} ${amountLocal.toLocaleString()}` })}{' '}
        <span className="text-[#9b9b9b]">({ui('co.approx', { amount: formatPrice(finalPrice, product.currency, display) })})</span>
      </ChargeNote>
      {error && <ErrorNote msg={error} />}
      <PayButton onClick={handlePay} loading={loading}>
        {verifying ? ui('co.paystack.verifying') : loading ? ui('co.paystack.open') : ui('co.paystack.cta')}
      </PayButton>
    </div>
  );
}

// ─── M-Pesa ────────────────────────────────────────────────────────────────────
function MpesaForm({ product, name, email, finalPrice, code, display, ui, onSuccess }: PayProps) {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rate = Number(process.env.NEXT_PUBLIC_MPESA_USD_TO_KES) || 130;
  const amountKes = Math.ceil(finalPrice * rate);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const normalize = (raw: string) => raw.replace(/\s/g, '').replace(/^\+/, '').replace(/^0/, '254');

  const handleInitiate = async () => {
    const normalized = normalize(phone);
    if (!/^254\d{9}$/.test(normalized)) { setError(ui('co.mpesa.invalid')); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout/mpesa/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized, productId: product.id, code, customerName: name, customerEmail: email }),
      });
      const { checkoutRequestId, error: initErr } = await res.json();
      if (initErr) throw new Error(initErr);

      setWaiting(true);
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        if (attempts > 40) {
          clearInterval(pollRef.current!);
          setWaiting(false);
          setError(ui('co.mpesa.timeout'));
          return;
        }
        const st = await fetch(`/api/checkout/mpesa/status?requestId=${checkoutRequestId}`).then(r => r.json()).catch(() => ({}));
        if (st.confirmed) { clearInterval(pollRef.current!); onSuccess(`mpesa_${checkoutRequestId}`); }
        else if (st.failed) { clearInterval(pollRef.current!); setWaiting(false); setError(ui('co.mpesa.failed')); }
      }, 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : ui('co.failed'));
    } finally {
      setLoading(false);
    }
  };

  if (waiting) {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <span className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#eef7ee]" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#eef7ee]"><Smartphone className="h-7 w-7 text-[#1a8917]" /></span>
        </span>
        <p className="mt-5 text-[17px] font-semibold text-[#242424]">{ui('co.mpesa.check')}</p>
        <p className="mt-1 max-w-xs text-[14px] text-[#6b6b6b]">{ui('co.mpesa.checkBody', { phone })}</p>
        <p className="mt-4 flex items-center gap-2 text-[13px] text-[#9b9b9b]"><Loader2 className="h-3.5 w-3.5 animate-spin" /> {ui('co.mpesa.waiting')}</p>
      </div>
    );
  }

  return (
    <div>
      <ChargeNote>
        {ui('co.charged', { amount: `KES ${amountKes.toLocaleString()}` })}{' '}
        <span className="text-[#9b9b9b]">({ui('co.approx', { amount: formatPrice(finalPrice, product.currency, display) })})</span>
      </ChargeNote>
      <label className="mt-4 block text-[13px] font-medium text-[#242424]">{ui('co.mpesa.phone')}</label>
      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="0712 345 678" autoComplete="tel" className={`mt-1.5 ${inputCls}`} />
      {error && <ErrorNote msg={error} />}
      <PayButton onClick={handleInitiate} loading={loading} disabled={!phone.trim()}>
        {loading ? ui('co.mpesa.sending') : ui('co.mpesa.send')}
      </PayButton>
    </div>
  );
}

// ─── PayPal ────────────────────────────────────────────────────────────────────
function PayPalSection({ product, name, email, code, ui, onSuccess }: PayProps) {
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      {error && <div className="mb-3"><ErrorNote msg={error} /></div>}
      <PayPalButtons
        style={{ layout: 'vertical', color: isDark() ? 'white' : 'black', shape: 'pill', label: 'pay', height: 48 }}
        createOrder={async () => {
          const res = await fetch('/api/checkout/paypal/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: product.id, code, customerName: name, customerEmail: email }),
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          return data.id;
        }}
        onApprove={async (data: { orderID: string }) => {
          const res = await fetch('/api/checkout/paypal/capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderID }),
          });
          const result = await res.json();
          if (result.ok) onSuccess(`paypal_${data.orderID}`);
          else setError(ui('co.paypal.capture', { ref: data.orderID }));
        }}
        onError={() => setError(ui('co.paypal.error'))}
      />
    </div>
  );
}

// ─── Order summary ─────────────────────────────────────────────────────────────
function Cover({ product, className }: { product: ShopProduct; className: string }) {
  const src = product.cover || product.media?.find(m => m.kind === 'image')?.url;
  const [broken, setBroken] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // The image may fail before hydration attaches onError — check once mounted.
  useEffect(() => { const i = ref.current; if (i?.complete && !i.naturalWidth) setBroken(true); }, []);
  return src && !broken
    // eslint-disable-next-line @next/next/no-img-element
    ? <img ref={ref} src={src} alt="" onError={() => setBroken(true)} className={`${className} object-cover`} />
    : <div className={`${className} flex items-center justify-center bg-[#f2f2f2] text-[22px] font-bold text-[#9b9b9b]`}>{product.title.slice(0, 1)}</div>;
}

function Summary({ product, display, setDisplay, finalPrice, discount, onApply, onRemove, ui }: {
  product: ShopProduct; display: CurrencyCode; setDisplay: (c: CurrencyCode) => void; finalPrice: number;
  discount: DiscountCode | null; onApply: (code: string) => Promise<boolean>; onRemove: () => void; ui: UiT;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [bad, setBad] = useState(false);
  const isService = product.category === 'service';
  const fmt = (n: number) => formatPrice(n, product.currency, display);
  const [checking, setChecking] = useState(false);
  const apply = async () => {
    if (!code.trim() || checking) return;
    setChecking(true);
    const ok = await onApply(code);
    setChecking(false);
    setBad(!ok);
    if (ok) setCode('');
  };
  const hasCodes = product.hasCodes;

  return (
    <div className="rounded-2xl border border-[#ececec] bg-white">
      <div className="flex items-center justify-between px-6 pt-5">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-[#9b9b9b]">{ui('co.summary')}</h2>
        <label className="flex items-center gap-1.5 text-[12px] text-[#9b9b9b]">
          <span className="sr-only">{ui('co.display')}</span>
          <select value={display} onChange={e => setDisplay(e.target.value as CurrencyCode)}
            className="cursor-pointer rounded-full border border-[#ececec] bg-transparent px-2.5 py-1 text-[12px] text-[#242424] outline-none hover:border-[#c4c4c4]">
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
          </select>
        </label>
      </div>

      <div className="flex gap-4 px-6 py-5">
        <Cover product={product} className="h-[72px] w-[72px] shrink-0 rounded-xl" />
        <div className="min-w-0">
          <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-[#1a8917]">{ui(`shop.catOne.${product.category}` as UiKey)}</p>
          <p className="mt-0.5 text-[16px] font-semibold leading-snug text-[#242424]">{product.title}</p>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-[#6b6b6b]">{product.tagline}</p>
        </div>
      </div>

      {hasCodes && (
        <div className="border-t border-[#f2f2f2] px-6 py-4">
          {discount ? (
            <div className="flex items-center gap-2 rounded-xl bg-[#eef7ee] px-3.5 py-2.5 text-[14px] text-[#1a6b17]">
              <Tag className="h-4 w-4 shrink-0" />
              <span className="flex-1"><strong className="font-semibold">{discount.code}</strong> · {ui('co.off', { value: discount.type === 'percent' ? `${discount.value}%` : fmt(discount.value) })}</span>
              <button type="button" onClick={onRemove} aria-label="Remove code" className="rounded-full p-0.5 hover:opacity-70"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <>
              <button type="button" onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between text-[14px] text-[#242424]">
                {ui('co.codeToggle')} <ChevronDown className={`h-4 w-4 text-[#9b9b9b] transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: EASE }} className="overflow-hidden">
                    <div className="mt-3 flex gap-2">
                      <input value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setBad(false); }} onKeyDown={e => e.key === 'Enter' && apply()}
                        placeholder={ui('co.codePh')} className="min-w-0 flex-1 rounded-full border border-[#e6e6e6] bg-transparent px-4 py-2 text-[14px] uppercase tracking-wide text-[#242424] outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-[#b3b3b3] focus:border-[#242424]" />
                      <button type="button" onClick={apply} className="rounded-full border border-[#242424] px-4 py-2 text-[14px] text-[#242424] hover:bg-[#f9f9f9]">{ui('co.apply')}</button>
                    </div>
                    {bad && <p className="mt-2 text-[13px] text-[#c94a4a]">{ui('co.codeInvalid')}</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      )}

      <dl className="space-y-2 border-t border-[#f2f2f2] px-6 py-4 text-[14px]">
        <div className="flex justify-between"><dt className="text-[#6b6b6b]">{ui('co.subtotal')}</dt><dd className="tabular-nums text-[#242424]">{fmt(product.price)}</dd></div>
        {discount && <div className="flex justify-between"><dt className="text-[#1a6b17]">{ui('co.discount')}</dt><dd className="tabular-nums text-[#1a6b17]">−{fmt(product.price - finalPrice)}</dd></div>}
        <div className="flex justify-between"><dt className="text-[#6b6b6b]">{ui('co.fees')}</dt><dd className="text-[#9b9b9b]">{ui('co.included')}</dd></div>
      </dl>
      <div className="flex items-end justify-between border-t border-[#f2f2f2] px-6 py-5">
        <div>
          <p className="text-[15px] font-semibold text-[#242424]">{ui('co.total')}</p>
          {display !== product.currency.toUpperCase() && <p className="text-[12px] text-[#9b9b9b]">{ui('co.chargedIn', { currency: product.currency.toUpperCase() })}</p>}
        </div>
        <motion.p key={`${finalPrice}-${display}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-[28px] font-semibold tracking-[-0.02em] tabular-nums text-[#242424]">{fmt(finalPrice)}</motion.p>
      </div>

      <ul className="space-y-2.5 rounded-b-2xl bg-[#fafafa] px-6 py-5 text-[13px] leading-5 text-[#6b6b6b]">
        <li className="flex gap-2.5">{isService ? <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" /> : <Download className="mt-0.5 h-4 w-4 shrink-0" />}{isService ? ui('co.trust.service') : ui('co.trust.instant')}</li>
        <li className="flex gap-2.5"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />{ui('co.trust.secure')}</li>
        <li className="flex gap-2.5"><Mail className="mt-0.5 h-4 w-4 shrink-0" /><span>{ui('co.trust.support')}<a href={`mailto:${OWNER.supportEmail}`} className="underline decoration-[#c4c4c4] underline-offset-2 hover:text-[#242424]">{OWNER.supportEmail}</a></span></li>
      </ul>
    </div>
  );
}

// ─── Confirmation ──────────────────────────────────────────────────────────────
function Confirmation({ product, name, email, paymentRef, method, amount, token, fulfilled, ui }: {
  product: ShopProduct; name: string; email: string; paymentRef: string; method: MethodId; amount: string;
  token: string | null; fulfilled: boolean; ui: UiT;
}) {
  const { href, openBooking } = useSite();
  const isService = product.category === 'service';
  const hasFile = product.hasFile;
  const first = name.trim().split(/\s+/)[0] || name;

  return (
    <main className="blog-ui px-6 pb-24 pt-16 sm:pt-20">
      <div className="mx-auto max-w-[560px] text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease: EASE }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#1a8917]">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="#ffffff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
            <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.45, ease: 'easeOut' }} />
          </svg>
        </motion.div>
        <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15, duration: 0.5, ease: EASE }}>
          <p className="mt-6 text-[13px] font-medium uppercase tracking-[0.12em] text-[#1a8917]">{ui('co.done.paid')}</p>
          <h1 className="mt-2 text-[34px] font-bold leading-tight tracking-[-0.02em] text-[#242424] sm:text-[40px]">{ui('co.done.title', { name: first })}</h1>
          <p className="mx-auto mt-3 max-w-md font-story text-[19px] leading-[1.55] text-[#6b6b6b]">
            {isService ? ui('co.done.service', { email }) : token ? ui('co.done.ready', { email }) : hasFile && !fulfilled ? ui('co.done.preparing') : ui('co.done.mailed', { email })}
          </p>
        </motion.div>
      </div>

      <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, duration: 0.5, ease: EASE }}
        className="mx-auto mt-10 max-w-[560px] rounded-2xl border border-[#ececec] bg-white">
        <div className="flex items-center gap-4 p-6">
          <Cover product={product} className="h-14 w-14 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold text-[#242424]">{product.title}</p>
            <p className="text-[13px] text-[#6b6b6b]">{ui(`shop.catOne.${product.category}` as UiKey)}</p>
          </div>
        </div>

        {hasFile && (
          <div className="px-6 pb-6">
            {token ? (
              <>
                <Link href={`/download/${token}`} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1a8917] py-3.5 text-[15px] font-medium text-white hover:bg-[#156d12]">
                  <Download className="h-4 w-4" /> {ui('co.done.download')}
                </Link>
                <p className="mt-2 text-center text-[12px] text-[#9b9b9b]">{ui('co.done.limits', { n: 3 })}</p>
              </>
            ) : !fulfilled ? (
              <p className="flex items-center justify-center gap-2 rounded-full bg-[#fafafa] py-3.5 text-[14px] text-[#6b6b6b]"><Loader2 className="h-4 w-4 animate-spin" /> {ui('co.done.preparing')}</p>
            ) : null}
          </div>
        )}
        {isService && (
          <div className="px-6 pb-6">
            <button type="button" onClick={() => openBooking()} className="flex w-full items-center justify-center gap-2 rounded-full bg-[#242424] py-3.5 text-[15px] font-medium text-white hover:bg-black">
              <CalendarDays className="h-4 w-4" /> {ui('co.done.book')}
            </button>
          </div>
        )}

        <dl className="grid grid-cols-1 gap-3 border-t border-[#f2f2f2] px-6 py-5 text-[14px] sm:grid-cols-3">
          <div><dt className="text-[12px] text-[#9b9b9b]">{ui('co.done.paidAmount')}</dt><dd className="mt-0.5 font-medium tabular-nums text-[#242424]">{amount}</dd></div>
          <div><dt className="text-[12px] text-[#9b9b9b]">{ui('co.done.method')}</dt><dd className="mt-0.5 font-medium text-[#242424]">{methodName(ui, method)}</dd></div>
          <div className="min-w-0"><dt className="text-[12px] text-[#9b9b9b]">{ui('co.done.ref')}</dt><dd className="mt-0.5 truncate font-mono text-[12px] text-[#242424]" title={paymentRef}>{paymentRef}</dd></div>
        </dl>
      </motion.div>

      <div className="mx-auto mt-8 flex max-w-[560px] flex-wrap items-center justify-center gap-3">
        <Link href={href('/shop')} className="rounded-full border border-[#242424] px-5 py-2.5 text-[14px] text-[#242424] hover:bg-[#f9f9f9]">{ui('co.done.continue')}</Link>
        <Link href={href('/')} className="rounded-full px-5 py-2.5 text-[14px] text-[#6b6b6b] hover:text-[#242424]">{ui('co.done.home')}</Link>
      </div>
    </main>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
function Step({ n, title, done, children }: { n: number; title: string; done?: boolean; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-semibold transition-colors ${done ? 'bg-[#1a8917] text-white' : 'bg-[#f2f2f2] text-[#242424]'}`}>
          {done ? <Check className="h-4 w-4" strokeWidth={3} /> : n}
        </span>
        <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-[#242424]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function CheckoutClient({ product, methods, initialDiscount }: { product: ShopProduct; methods: MethodId[]; initialDiscount: DiscountCode | null }) {
  const { ui, href, me, openBooking } = useSite();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [method, setMethod] = useState<MethodId | null>(methods[0] ?? null);
  const [display, setDisplayState] = useState<CurrencyCode>((CURRENCIES.find(c => c.code === product.currency.toUpperCase())?.code ?? 'USD') as CurrencyCode);
  const [discount, setDiscount] = useState<DiscountCode | null>(initialDiscount);
  const [done, setDone] = useState<{ ref: string; method: MethodId } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [fulfilled, setFulfilled] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY) as CurrencyCode | null;
      if (saved && CURRENCIES.some(c => c.code === saved)) setDisplayState(saved);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { if (me?.reader.name) setName(n => n || me.reader.name); }, [me]);

  const setDisplay = (c: CurrencyCode) => { setDisplayState(c); try { localStorage.setItem(LS_KEY, c); } catch { /* ignore */ } };

  const finalPrice = useMemo(() => {
    if (!discount) return product.price;
    if (discount.type === 'percent') return +(product.price * (1 - discount.value / 100)).toFixed(2);
    return +Math.max(0, product.price - discount.value).toFixed(2);
  }, [product, discount]);

  // Codes are checked on the server one at a time; the list never reaches the browser.
  const applyCode = async (raw: string) => {
    try {
      const res = await fetch('/api/checkout/promo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product.id, code: raw }) });
      if (!res.ok) return false;
      const d = await res.json();
      setDiscount(d.discount);
      return true;
    } catch { return false; }
  };

  const detailsValid = name.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(email.trim());

  const handleSuccess = (ref: string) => {
    setDone({ ref, method: method! });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // The server only fulfils confirmed payments; if a provider is still confirming, retry a few times.
    const fulfil = async (attempt = 0): Promise<void> => {
      try {
        const res = await fetch('/api/checkout/fulfill', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentRef: ref }) });
        const data = await res.json().catch(() => ({}));
        if (res.status === 202 && attempt < 5) { await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); return fulfil(attempt + 1); }
        if (data.downloadToken) setToken(data.downloadToken);
      } catch { /* the receipt email still carries the link */ }
      setFulfilled(true);
    };
    fulfil();
  };

  if (done) {
    return <Confirmation product={product} name={name} email={email.trim()} paymentRef={done.ref} method={done.method} amount={formatPrice(finalPrice, product.currency, display)} token={token} fulfilled={fulfilled} ui={ui} />;
  }

  const payProps = { product, name: name.trim(), email: email.trim(), finalPrice, code: discount?.code, display, ui, onSuccess: handleSuccess };

  return (
    <>
      {methods.includes('paystack') && <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />}

      <main className="blog-ui pb-24">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 pt-8">
          <Link href={href(`/shop/${product.slug}`)} className="inline-flex items-center gap-1.5 text-[14px] text-[#6b6b6b] hover:text-[#242424]"><ArrowLeft className="h-4 w-4" /> {ui('co.back')}</Link>
          <span className="inline-flex items-center gap-1.5 text-[13px] text-[#6b6b6b]"><Lock className="h-3.5 w-3.5" /> {ui('co.secure')}</span>
        </div>

        <div className="mx-auto grid max-w-[1100px] gap-10 px-6 pt-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
          <div className="min-w-0">
            <h1 className="text-[36px] font-bold tracking-[-0.025em] text-[#242424] sm:text-[44px]">{ui('co.title')}</h1>

            <div className="mt-10 space-y-12">
              <Step n={1} title={ui('co.step.details')} done={detailsValid}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[13px] font-medium text-[#242424]">{ui('co.name')}</span>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder={ui('co.namePh')} autoComplete="name" className={`mt-1.5 ${inputCls}`} />
                  </label>
                  <label className="block">
                    <span className="text-[13px] font-medium text-[#242424]">{ui('co.email')}</span>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={ui('co.emailPh')} autoComplete="email" className={`mt-1.5 ${inputCls}`} />
                  </label>
                </div>
                <p className="mt-2 text-[13px] text-[#9b9b9b]">{ui('co.emailHint')}</p>
              </Step>

              <Step n={2} title={ui('co.step.payment')}>
                {methods.length === 0 ? (
                  <div className="rounded-2xl bg-[#fafafa] p-6">
                    <p className="text-[15px] text-[#6b6b6b]">{ui('co.noMethods')}</p>
                    <button type="button" onClick={() => openBooking()} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#242424] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-black">
                      <CalendarDays className="h-4 w-4" /> {ui('home.book.cta')}
                    </button>
                  </div>
                ) : (
                  <div role="radiogroup" aria-label={ui('co.step.payment')} className="divide-y divide-[#ececec] overflow-hidden rounded-2xl border border-[#ececec]">
                    {methods.map(m => {
                      const selected = method === m;
                      return (
                        <div key={m} className={selected ? 'bg-[#fcfcfc]' : ''}>
                          <button type="button" role="radio" aria-checked={selected} onClick={() => setMethod(m)}
                            className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#fafafa]">
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${selected ? 'border-[#1a8917]' : 'border-[#d4d4d4]'}`}>
                              <motion.span initial={false} animate={{ scale: selected ? 1 : 0 }} className="h-2.5 w-2.5 rounded-full bg-[#1a8917]" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[15px] font-medium text-[#242424]">{methodName(ui, m)}</span>
                              <span className="block truncate text-[13px] text-[#6b6b6b]">{methodDetail(ui, m)}</span>
                            </span>
                            <ProviderMark id={m} />
                          </button>
                          <AnimatePresence initial={false}>
                            {selected && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
                                <div className="px-5 pb-5 pt-1">
                                  {!detailsValid ? (
                                    <p className="rounded-xl bg-[#fafafa] px-4 py-3 text-[14px] text-[#6b6b6b]">{ui('co.fillFirst')}</p>
                                  ) : m === 'stripe' ? (
                                    <Elements stripe={getStripe()}><StripeCardForm {...payProps} /></Elements>
                                  ) : m === 'paystack' ? (
                                    <PaystackForm {...payProps} />
                                  ) : m === 'mpesa' ? (
                                    <MpesaForm {...payProps} />
                                  ) : (
                                    <PayPalScriptProvider options={{ clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? 'test', currency: 'USD', intent: 'capture' }}>
                                      <PayPalSection {...payProps} />
                                    </PayPalScriptProvider>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="mt-5 text-[12px] leading-5 text-[#9b9b9b]">{ui('co.terms')}</p>
              </Step>
            </div>
          </div>

          <aside className="order-first lg:order-none">
            <div className="lg:sticky lg:top-24">
              <Summary product={product} display={display} setDisplay={setDisplay} finalPrice={finalPrice} discount={discount}
                onApply={applyCode} onRemove={() => setDiscount(null)} ui={ui} />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
