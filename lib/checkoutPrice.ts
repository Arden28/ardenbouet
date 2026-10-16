// lib/checkoutPrice.ts — the server decides what a product costs. Checkout routes never trust an amount
// sent by the browser: they quote the product (and an optional promo code) here and charge that.
import 'server-only';
import type { DiscountCode, ShopProduct } from '@/app/admin/types';
import { getContentBundle } from '@/lib/blog/queries';
import { findCode } from '@/lib/publicContent';
import { FX } from '@/lib/currency';

export type Quote = { product: ShopProduct; amount: number; currency: string; discount: DiscountCode | null };

/** Price of a published product after an (optional) valid promo code, in the product's currency. */
export async function quote(productId: unknown, code?: unknown): Promise<Quote | null> {
  if (typeof productId !== 'string' || !productId) return null;
  const product = ((await getContentBundle()).products ?? []).find(p => p.id === productId && p.status === 'published');
  if (!product) return null;
  const discount = typeof code === 'string' && code ? findCode(product, code) : null;
  let amount = product.price;
  if (discount?.type === 'percent') amount = product.price * (1 - Math.min(100, Math.max(0, discount.value)) / 100);
  else if (discount?.type === 'fixed') amount = product.price - Math.max(0, discount.value);
  return { product, amount: Math.max(0, Math.round(amount * 100) / 100), currency: (product.currency || 'USD').toUpperCase(), discount };
}

/** Converts a quote to USD with the site's fixed rates (the same table the checkout displays). */
export function quoteInUsd(q: Pick<Quote, 'amount' | 'currency'>): number {
  const rate = (FX as Record<string, number>)[q.currency] ?? 1;
  return q.amount / rate;
}

/** Local-currency amount for providers that charge in KES/NGN (same rates the checkout shows). */
export function localCharge(q: Pick<Quote, 'amount' | 'currency'>, target: string): number {
  const t = target.toUpperCase();
  if (t === q.currency) return q.amount;
  const env: Record<string, number> = {
    NGN: Number(process.env.NEXT_PUBLIC_PAYSTACK_USD_TO_NGN) || 1600,
    KES: Number(process.env.NEXT_PUBLIC_MPESA_USD_TO_KES) || 130,
  };
  const rate = env[t] ?? (FX as Record<string, number>)[t] ?? 1;
  return quoteInUsd(q) * rate;
}
