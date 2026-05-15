'use client';
// app/checkout/CheckoutClient.tsx

import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock, ChevronLeft, AlertCircle, CreditCard, Tag, X } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import type { ShopProduct, DiscountCode } from '@/app/admin/types';
import { formatPrice, CURRENCIES, LS_KEY } from '@/lib/currency';
import type { CurrencyCode } from '@/lib/currency';

// ─── Stripe singleton ──────────────────────────────────────────────────────────
let _stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripe() {
  if (!_stripePromise) _stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');
  return _stripePromise;
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type MethodId = 'stripe' | 'paystack' | 'mpesa' | 'paypal';

const METHODS: { id: MethodId; name: string; detail: string; reach: string }[] = [
  // { id: 'stripe',   name: 'Card',     detail: 'Visa · Mastercard · Amex',      reach: 'Worldwide' },
  { id: 'paystack', name: 'Paystack', detail: 'Card · Bank Transfer · USSD',   reach: 'Africa'    },
  // { id: 'mpesa',    name: 'M-Pesa',   detail: 'STK Push · Lipa na M-Pesa',    reach: 'Kenya'     },
  { id: 'paypal',   name: 'PayPal',   detail: 'PayPal Balance · Bank · Card',  reach: 'Worldwide' },
];

// ─── Design atoms ──────────────────────────────────────────────────────────────
function Rule() {
  return <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800" />;
}

function SectionLabel({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <p className="mb-5 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600">
      {n} · {children}
    </p>
  );
}

function FieldInput({
  label, type = 'text', value, onChange, placeholder, autoComplete,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 font-mono text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors duration-150"
      />
    </div>
  );
}

function PayBtn({
  onClick, disabled, loading, children,
}: {
  onClick?: () => void; disabled?: boolean; loading?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="mt-4 flex w-full items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-50 px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {loading && (
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

function ErrMsg({ msg }: { msg: string }) {
  return (
    <div className="mt-3 flex items-start gap-2 border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 px-3 py-2.5">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
      <p className="text-sm leading-snug text-red-600 dark:text-red-400">{msg}</p>
    </div>
  );
}

function AmountNote({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-4 border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900 px-4 py-3">
      <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
        {label} <span className="font-bold text-zinc-900 dark:text-zinc-50">{value}</span>
      </p>
    </div>
  );
}

// ─── Payment provider logos ────────────────────────────────────────────────────
function ProviderLogo({ id }: { id: MethodId }) {
  if (id === 'stripe') {
    return <CreditCard className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />;
  }
  if (id === 'paystack') {
    return (
      <Image src="/images/paystack.png" alt="Paystack" width={120} height={20}
        className="w-auto object-contain" />
    );
  }
  if (id === 'mpesa') {
    return (
      <Image src="/images/mpesa.png" alt="M-Pesa" width={120} height={36}
        className="h-7 w-auto object-contain" />
    );
  }
  // PayPal
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" aria-label="PayPal" fill="none">
      <path fill="#003087" d="M7.5 3h5.6c2.5 0 4.1 1.7 3.6 4.1-.6 3-2.7 4.4-5.5 4.4H9.5l-1 6H5.3L7.5 3z" />
      <path fill="#009CDE" d="M9.8 5.5H15c2.3 0 3.8 1.5 3.3 3.8-.5 2.8-2.5 4.1-5 4.1h-1.5L10.7 20H7.5L9.8 5.5z" />
      <path fill="#012169" d="M12.1 8h4.7c2.1 0 3.5 1.4 3 3.5-.5 2.5-2.3 3.8-4.7 3.8h-1.3L12.9 22H10L12.1 8z" />
    </svg>
  );
}

// ─── Method card ───────────────────────────────────────────────────────────────
function MethodCard({ m, selected, onClick }: { m: typeof METHODS[0]; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative flex w-full items-center gap-4 border px-4 py-3.5 text-left transition-colors duration-150 focus-visible:outline-none',
        selected
          ? 'border-zinc-900 dark:border-zinc-50 bg-zinc-50 dark:bg-zinc-900'
          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600',
      ].join(' ')}
    >
      {selected && <span className="absolute inset-y-0 left-0 w-[3px] bg-[#2467AC]" />}

      {/* Logo — fixed-width container keeps alignment consistent */}
      <div className="flex w-20 shrink-0 items-center">
        <ProviderLogo id={m.id} />
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="font-heading text-sm font-bold leading-tight text-zinc-900 dark:text-zinc-50">{m.name}</p>
        <p className="mt-0.5 truncate font-mono text-[9px] leading-snug text-zinc-500 dark:text-zinc-500">{m.detail}</p>
      </div>

      {/* Reach badge — pinned right */}
      <span className="shrink-0 border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest text-zinc-400">
        {m.reach}
      </span>
    </button>
  );
}

// ─── Stripe form ───────────────────────────────────────────────────────────────
function StripeCardForm({ product, name, email, currency, finalPrice, onSuccess }: {
  product: ShopProduct; name: string; email: string; currency: CurrencyCode;
  finalPrice: number; onSuccess: (ref: string) => void;
}) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id, productTitle: product.title,
          amount: finalPrice, currency: product.currency,
          customerName: name, customerEmail: email,
        }),
      });
      const { clientSecret, error: serverErr } = await res.json();
      if (serverErr) throw new Error(serverErr);

      const { error: stripeErr, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement)!, billing_details: { name, email } },
      });
      if (stripeErr) throw new Error(stripeErr.message);
      if (paymentIntent?.status === 'succeeded') onSuccess(`stripe_${paymentIntent.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-4">
        <CardElement options={{
          style: {
            base: { fontSize: '14px', fontFamily: 'monospace', color: '#18181b', '::placeholder': { color: '#a1a1aa' } },
            invalid: { color: '#ef4444' },
          },
          hidePostalCode: true,
        }} />
      </div>
      {error && <ErrMsg msg={error} />}
      <PayBtn onClick={handlePay} loading={loading} disabled={!stripe}>
        Pay {formatPrice(finalPrice, product.currency, currency)} →
      </PayBtn>
    </div>
  );
}

// ─── Paystack form ─────────────────────────────────────────────────────────────
const PAYSTACK_CURRENCY = process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY ?? 'KES';
const PAYSTACK_RATES: Record<string, number> = {
  NGN: Number(process.env.NEXT_PUBLIC_PAYSTACK_USD_TO_NGN) || 1600,
  KES: Number(process.env.NEXT_PUBLIC_MPESA_USD_TO_KES)    || 130,
};
const PAYSTACK_SYMBOLS: Record<string, string> = {
  NGN: '₦', KES: 'KSh', GHS: '₵', ZAR: 'R',
};

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

function PaystackForm({ product, name, email, finalPrice, onSuccess }: {
  product: ShopProduct; name: string; email: string; finalPrice: number; onSuccess: (ref: string) => void;
}) {
  const [loading,   setLoading]   = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const rate        = PAYSTACK_RATES[PAYSTACK_CURRENCY] ?? 1;
  const symbol      = PAYSTACK_SYMBOLS[PAYSTACK_CURRENCY] ?? PAYSTACK_CURRENCY;
  const amountLocal = Math.round(finalPrice * rate);

  const handlePay = async () => {
    setLoading(true);
    setError(null);

    const pop = await waitForPaystack();
    if (!pop) {
      setLoading(false);
      setError('Paystack could not be loaded. Please check your connection and try again.');
      return;
    }

    const ref = `arden_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Retry verify up to 3 times with increasing delay — Paystack can lag behind
    const verifyWithRetry = (reference: string, attempt = 0): void => {
      fetch('/api/checkout/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference,
          productId: product.id, productTitle: product.title,
          amount: product.price, currency: product.currency,
          customerName: name, customerEmail: email,
        }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.ok) {
            setVerifying(false);
            setLoading(false);
            onSuccess(`paystack_${reference}`);
          } else if (attempt < 2) {
            setTimeout(() => verifyWithRetry(reference, attempt + 1), 1200 * (attempt + 1));
          } else {
            setVerifying(false);
            setLoading(false);
            setError(`Verification pending — your ref is ${reference}. Contact us if you were charged.`);
          }
        })
        .catch(() => {
          if (attempt < 2) {
            setTimeout(() => verifyWithRetry(reference, attempt + 1), 1200 * (attempt + 1));
          } else {
            setVerifying(false);
            setLoading(false);
            setError(`Verification pending — your ref is ${reference}. Contact us if you were charged.`);
          }
        });
    };

    try {
      const handler = pop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email, amount: amountLocal * 100, currency: PAYSTACK_CURRENCY, ref,
        metadata: { productId: product.id, productTitle: product.title, customerName: name },
        callback: (response: { reference: string }) => {
          setVerifying(true);
          verifyWithRetry(response.reference);
        },
        onClose: () => { setLoading(false); setVerifying(false); },
      });
      handler.openIframe();
    } catch (e: unknown) {
      setLoading(false);
      setError(e instanceof Error ? e.message : 'Failed to open Paystack. Please try again.');
    }
  };

  const btnLabel = verifying ? 'Verifying payment…' : loading ? 'Opening Paystack…' : 'Pay with Paystack →';

  return (
    <div>
      <AmountNote label="You'll be charged:" value={`${symbol} ${amountLocal.toLocaleString()} (≈ ${product.priceLabel})`} />
      {error && <ErrMsg msg={error} />}
      <PayBtn onClick={handlePay} loading={loading}>
        {btnLabel}
      </PayBtn>
    </div>
  );
}

// ─── M-Pesa form ───────────────────────────────────────────────────────────────
function MpesaForm({ product, name, email, finalPrice, onSuccess }: {
  product: ShopProduct; name: string; email: string; finalPrice: number; onSuccess: (ref: string) => void;
}) {
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rate      = Number(process.env.NEXT_PUBLIC_MPESA_USD_TO_KES) || 130;
  const amountKes = Math.ceil(finalPrice * rate);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const normalize = (raw: string) => raw.replace(/\s/g, '').replace(/^\+/, '').replace(/^0/, '254');

  const handleInitiate = async () => {
    const normalized = normalize(phone);
    if (!/^254\d{9}$/.test(normalized)) {
      setError('Enter a valid Kenyan number (e.g. 0712 345 678 or +254 712 345 678)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/checkout/mpesa/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalized, productId: product.id, productTitle: product.title,
          amount: product.price, amountKes, currency: product.currency,
          customerName: name, customerEmail: email,
        }),
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
          setError('Payment timed out. If you entered your PIN, please contact us.');
          return;
        }
        const st = await fetch(`/api/checkout/mpesa/status?requestId=${checkoutRequestId}`).then(r => r.json());
        if (st.confirmed) { clearInterval(pollRef.current!); onSuccess(`mpesa_${checkoutRequestId}`); }
        else if (st.failed) {
          clearInterval(pollRef.current!);
          setWaiting(false);
          setError('Payment was not completed. Please try again.');
        }
      }, 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send STK push.');
    } finally {
      setLoading(false);
    }
  };

  if (waiting) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center border-2 border-[#2467AC]">
          <Image src="/images/mpesa.png" alt="M-Pesa" width={48} height={48} className="h-8 w-auto object-contain" />
        </div>
        <p className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-50">Check your phone</p>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          Enter your M-Pesa PIN on the prompt sent to <span className="font-mono">{phone}</span>
        </p>
        <p className="mt-5 font-mono text-[9px] uppercase tracking-widest text-zinc-400 animate-pulse">
          Waiting for confirmation…
        </p>
      </div>
    );
  }

  return (
    <div>
      <AmountNote label="Amount:" value={`KES ${amountKes.toLocaleString()} (≈ ${product.priceLabel})`} />
      <FieldInput
        label="M-Pesa phone number"
        type="tel"
        value={phone}
        onChange={setPhone}
        placeholder="0712 345 678"
        autoComplete="tel"
      />
      {error && <ErrMsg msg={error} />}
      <PayBtn onClick={handleInitiate} loading={loading} disabled={!phone.trim()}>
        {loading ? 'Sending prompt…' : 'Send M-Pesa prompt →'}
      </PayBtn>
    </div>
  );
}

// ─── PayPal section ────────────────────────────────────────────────────────────
function PayPalSection({ product, name, email, finalPrice, onSuccess }: {
  product: ShopProduct; name: string; email: string; finalPrice: number; onSuccess: (ref: string) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      {error && <ErrMsg msg={error} />}
      <div className="mt-1">
        <PayPalButtons
          style={{ layout: 'vertical', color: 'black', shape: 'rect', label: 'pay', height: 48 }}
          createOrder={async () => {
            const res = await fetch('/api/checkout/paypal/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                amount: finalPrice,
                currency: product.currency,
                productTitle: product.title,
                productId: product.id,
                customerName: name,
                customerEmail: email,
              }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            return data.id;
          }}
          onApprove={async (data: { orderID: string }) => {
            const res = await fetch('/api/checkout/paypal/capture', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.orderID,
                productId: product.id, productTitle: product.title,
                amount: product.price, currency: product.currency,
                customerName: name, customerEmail: email,
              }),
            });
            const result = await res.json();
            if (result.ok) onSuccess(`paypal_${data.orderID}`);
            else setError('Capture failed. Contact us with PayPal ref: ' + data.orderID);
          }}
          onError={() => setError('PayPal error. Please try a different payment method.')}
        />
      </div>
    </div>
  );
}

// ─── Success state ─────────────────────────────────────────────────────────────
function SuccessState({
  product, email, paymentRef, downloadToken,
}: {
  product: ShopProduct; email: string; paymentRef: string; downloadToken: string | null;
}) {
  const isService = product.category === 'service';

  return (
    <main className="flex min-h-[65vh] flex-col items-center justify-center px-4 py-24 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex h-20 w-20 items-center justify-center border-2 border-[#2467AC]"
      >
        <Check className="h-9 w-9 text-[#2467AC]" />
      </motion.div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 max-w-sm mx-auto"
      >
        <h2 className="font-heading text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Payment confirmed
        </h2>

        {isService ? (
          <p className="mt-3 text-zinc-500 dark:text-zinc-400">
            We&apos;ll reach out to <strong className="text-zinc-700 dark:text-zinc-300">{email}</strong> within 24 hours to schedule your session.
          </p>
        ) : downloadToken ? (
          <>
            <p className="mt-3 text-zinc-500 dark:text-zinc-400">
              Your file is ready. A copy has also been sent to <strong className="text-zinc-700 dark:text-zinc-300">{email}</strong>.
            </p>
            <Link
              href={`/download/${downloadToken}`}
              className="mt-6 flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-50 px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
            >
              Download now →
            </Link>
            <p className="mt-2 font-mono text-[9px] text-zinc-400 dark:text-zinc-600">
              Link valid 48 h · 3 downloads max
            </p>
          </>
        ) : (
          <p className="mt-3 text-zinc-500 dark:text-zinc-400">
            A confirmation and download link are on their way to <strong className="text-zinc-700 dark:text-zinc-300">{email}</strong>.
          </p>
        )}

        <p className="mt-4 font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
          Ref: {paymentRef}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/shop"
            className="border border-zinc-200 dark:border-zinc-800 px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-100 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            ← Back to shop
          </Link>
          <Link
            href="/"
            className="bg-zinc-900 dark:bg-zinc-50 px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            Home →
          </Link>
        </div>
      </motion.div>
    </main>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────
export default function CheckoutClient() {
  const params = useSearchParams();
  const slug   = params.get('product');

  const [product,  setProduct]  = useState<ShopProduct | null>(null);
  const [fetching, setFetching] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [name,   setName]   = useState('');
  const [email,  setEmail]  = useState('');
  const [method, setMethod] = useState<MethodId>('stripe');

  const [success,       setSuccess]       = useState(false);
  const [paymentRef,    setPaymentRef]    = useState('');
  const [downloadToken, setDownloadToken] = useState<string | null>(null);

  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY) as CurrencyCode | null;
    if (saved && CURRENCIES.some(c => c.code === saved)) setCurrency(saved);
  }, []);

  // ── Discount state ──────────────────────────────────────────────────────────
  const [discountInput,    setDiscountInput]    = useState('');
  const [appliedDiscount,  setAppliedDiscount]  = useState<DiscountCode | null>(null);
  const [discountError,    setDiscountError]    = useState<string | null>(null);

  const applyDiscount = () => {
    const code = discountInput.trim().toUpperCase();
    if (!code) return;
    const match = product?.discountCodes?.find(d => d.code.toUpperCase() === code);
    if (match) {
      setAppliedDiscount(match);
      setDiscountError(null);
    } else {
      setAppliedDiscount(null);
      setDiscountError('Invalid code — please check and try again.');
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountInput('');
    setDiscountError(null);
  };

  const finalPrice = useMemo(() => {
    if (!product || !appliedDiscount) return product?.price ?? 0;
    if (appliedDiscount.type === 'percent') {
      return +(product.price * (1 - appliedDiscount.value / 100)).toFixed(2);
    }
    return +Math.max(0, product.price - appliedDiscount.value).toFixed(2);
  }, [product, appliedDiscount]);

  useEffect(() => {
    if (!slug) { setNotFound(true); setFetching(false); return; }
    fetch('/api/content')
      .then(r => r.json())
      .then(data => {
        const p = (data.products ?? []).find(
          (p: ShopProduct) => p.slug === slug && p.status === 'published',
        );
        if (p) {
          setProduct(p);
          // Auto-apply affiliate/promo code from URL (?ref=CODE or ?code=CODE)
          const refCode = (params.get('ref') ?? params.get('code') ?? '').toUpperCase();
          if (refCode) {
            const match = p.discountCodes?.find((d: DiscountCode) => d.code.toUpperCase() === refCode);
            if (match) { setAppliedDiscount(match); setDiscountInput(match.code); }
          }
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setFetching(false));
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSuccess = (ref: string) => {
    setPaymentRef(ref);
    setSuccess(true);
    fetch('/api/checkout/fulfill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentRef: ref,
        productId: product!.id,
        productTitle: product!.title,
        customerName: name,
        customerEmail: email,
        amount: finalPrice,
        currency: product!.currency,
      }),
    })
      .then(r => r.json())
      .then(data => { if (data.downloadToken) setDownloadToken(data.downloadToken); })
      .catch(() => {});
  };
  const isValid = name.trim().length >= 2 && /\S+@\S+\.\S+/.test(email);

  if (fetching) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 animate-pulse">Loading…</p>
      </main>
    );
  }

  if (notFound || !product) {
    return (
      <main className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">Product not found</p>
        <Link href="/shop" className="mt-4 font-mono text-sm underline underline-offset-4 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
          Back to shop
        </Link>
      </main>
    );
  }

  if (success) return <SuccessState product={product} email={email} paymentRef={paymentRef} downloadToken={downloadToken} />;

  return (
    <>
      <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />

      <main className="min-h-screen bg-white dark:bg-zinc-950">
        {/* Top bar */}
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
            <Link
              href={`/shop/${product.slug}`}
              className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <ChevronLeft className="h-3 w-3" /> Back
            </Link>
            <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-zinc-400">
              <Lock className="h-3 w-3" /> Secure Checkout
            </div>
          </div>
        </div>

        {/* Body grid */}
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_340px] lg:gap-14">

            {/* ── Left: form ─────────────────────────────────────────────── */}
            <div className="space-y-10">

              {/* Contact */}
              <div>
                <Rule />
                <div className="py-6">
                  <SectionLabel n={1}>Contact</SectionLabel>
                  <div className="space-y-4">
                    <FieldInput label="Full name" value={name} onChange={setName}
                      placeholder="Your name" autoComplete="name" />
                    <FieldInput label="Email address" type="email" value={email} onChange={setEmail}
                      placeholder="you@example.com" autoComplete="email" />
                  </div>
                </div>
                <Rule />
              </div>

              {/* Payment method */}
              <div>
                <SectionLabel n={2}>Payment method</SectionLabel>
                <div className="flex flex-col gap-2">
                  {METHODS.map(m => (
                    <MethodCard key={m.id} m={m} selected={method === m.id} onClick={() => setMethod(m.id)} />
                  ))}
                </div>
              </div>

              {/* Payment form (shown only when contact is valid) */}
              <AnimatePresence mode="wait">
                {isValid ? (
                  <motion.div
                    key={method}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Rule />
                    <div className="pt-6">
                      <SectionLabel n={3}>{METHODS.find(m => m.id === method)?.name}</SectionLabel>

                      {method === 'stripe' && (
                        <Elements stripe={getStripe()}>
                          <StripeCardForm product={product} name={name} email={email} currency={currency} finalPrice={finalPrice} onSuccess={handleSuccess} />
                        </Elements>
                      )}

                      {method === 'paystack' && (
                        <PaystackForm product={product} name={name} email={email} finalPrice={finalPrice} onSuccess={handleSuccess} />
                      )}

                      {method === 'mpesa' && (
                        <MpesaForm product={product} name={name} email={email} finalPrice={finalPrice} onSuccess={handleSuccess} />
                      )}

                      {method === 'paypal' && (
                        <PayPalScriptProvider
                          options={{
                            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? 'test',
                            currency: 'USD',
                            intent: 'capture',
                          }}
                        >
                          <PayPalSection product={product} name={name} email={email} finalPrice={finalPrice} onSuccess={handleSuccess} />
                        </PayPalScriptProvider>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.p
                    key="hint"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600"
                  >
                    Complete your contact details to continue.
                  </motion.p>
                )}
              </AnimatePresence>

              <p className="font-mono text-[9px] leading-relaxed text-zinc-400 dark:text-zinc-600">
                By completing this purchase you agree to our terms. Payments are processed securely by the selected provider.
                For support: laudbouetoumoussa@gmail.com
              </p>
            </div>

            {/* ── Right: order summary ────────────────────────────────────── */}
            <aside className="self-start lg:sticky lg:top-8 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">

              {/* Cover */}
              {product.cover && (
                <div className="relative aspect-[16/9] overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
                  <Image src={product.cover} alt={product.title} fill
                    className="object-cover" sizes="340px" />
                </div>
              )}

              {/* Product info */}
              <div className={product.cover ? 'px-5 pt-4 pb-4' : 'px-5 pt-5 pb-4'}>
                <span className="border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest text-zinc-400">
                  {product.category}
                </span>
                <h2 className="mt-2 font-heading text-base font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-snug">
                  {product.title}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {product.tagline}
                </p>
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800" />

              {/* Promo / affiliate code */}
              <div className="px-5 py-4">
                <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                  Promo or affiliate code
                </p>
                {appliedDiscount ? (
                  <div className="flex items-center gap-2 border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2.5">
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="flex-1 font-mono text-[10px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                      <strong>{appliedDiscount.code}</strong>
                      {appliedDiscount.type === 'percent'
                        ? ` — ${appliedDiscount.value}% off`
                        : ` — ${appliedDiscount.value} ${product.currency} off`}
                    </span>
                    <button type="button" onClick={removeDiscount}
                      className="text-emerald-500 hover:text-emerald-700 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={discountInput}
                        onChange={e => { setDiscountInput(e.target.value.toUpperCase()); setDiscountError(null); }}
                        onKeyDown={e => e.key === 'Enter' && applyDiscount()}
                        placeholder="SUMMER20"
                        className="flex-1 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-[#2467AC] focus:outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={applyDiscount}
                        className="flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:border-[#2467AC] hover:text-[#2467AC] transition-colors"
                      >
                        <Tag className="h-3 w-3" />
                        Apply
                      </button>
                    </div>
                    {discountError && (
                      <p className="mt-1.5 font-mono text-[10px] text-red-500">{discountError}</p>
                    )}
                  </>
                )}
              </div>

              {/* Divider */}
              <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800" />

              {/* Price breakdown */}
              <div className="px-5 py-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Subtotal
                  </span>
                  <span className={[
                    'font-mono text-sm',
                    appliedDiscount
                      ? 'text-zinc-400 dark:text-zinc-600 line-through'
                      : 'text-zinc-900 dark:text-zinc-100',
                  ].join(' ')}>
                    {formatPrice(product.price, product.currency, currency)}
                  </span>
                </div>
                {appliedDiscount && (
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                      Discount
                    </span>
                    <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                      −{formatPrice(product.price - finalPrice, product.currency, currency)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Tax / Fees
                  </span>
                  <span className="font-mono text-sm text-zinc-400 dark:text-zinc-600">Included</span>
                </div>
              </div>

              {/* Total */}
              <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Total</span>
                  <span className="font-mono text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    {formatPrice(finalPrice, product.currency, currency)}
                  </span>
                </div>
              </div>

              {/* Security */}
              <div className="h-px w-full bg-zinc-100 dark:bg-zinc-800" />
              <div className="px-5 py-3">
                <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-600">
                  <Lock className="h-3 w-3 shrink-0" />
                  <p className="font-mono text-[9px] uppercase tracking-widest">End-to-end encrypted</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
