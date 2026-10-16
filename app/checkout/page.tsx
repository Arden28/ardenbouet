// app/checkout/page.tsx — loads the product server-side and decides which payment methods are live.
import type { Metadata } from 'next';
import Link from 'next/link';
import { getContentBundle } from '@/lib/blog/queries';
import { getLocale, lhref } from '@/lib/i18n/server';
import { localize } from '@/lib/i18n/content';
import { uiT } from '@/lib/i18n/ui';
import { findCode, publicProduct } from '@/lib/publicContent';
import CheckoutClient, { type MethodId } from './CheckoutClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Checkout · Arden BOUET', robots: { index: false } };

/** A method shows only when its keys are configured. CHECKOUT_METHODS (comma list) can narrow it further. */
function enabledMethods(): MethodId[] {
  const configured: Record<MethodId, boolean> = {
    stripe: !!(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && process.env.STRIPE_SECRET_KEY),
    paystack: !!(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY && process.env.PAYSTACK_SECRET_KEY),
    mpesa: !!(process.env.MPESA_CONSUMER_KEY && process.env.MPESA_CONSUMER_SECRET && process.env.MPESA_SHORTCODE),
    paypal: !!(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET),
  };
  const only = (process.env.CHECKOUT_METHODS ?? '').split(',').map(s => s.trim()).filter(Boolean);
  return (['stripe', 'paystack', 'mpesa', 'paypal'] as MethodId[]).filter(m => configured[m] && (!only.length || only.includes(m)));
}

export default async function CheckoutPage({ searchParams }: { searchParams: { product?: string; ref?: string; code?: string } }) {
  const locale = getLocale();
  const bundle = await getContentBundle();
  const raw = (bundle.products ?? []).find(p => p.slug === searchParams.product && p.status === 'published');

  if (!raw) {
    const ui = uiT(locale);
    return (
      <main className="blog-ui flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <p className="text-[22px] font-semibold text-[#242424]">{ui('co.notFound')}</p>
        <Link href={lhref('/shop')} className="mt-5 rounded-full bg-[#242424] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-black">{ui('co.backShop')}</Link>
      </main>
    );
  }

  // Only public fields reach the browser (no file URL, no promo codes). A ?code=/?ref= link is checked here.
  const initialDiscount = findCode(raw, searchParams.ref ?? searchParams.code ?? '');
  return <CheckoutClient product={publicProduct(localize(raw, locale))} methods={enabledMethods()} initialDiscount={initialDiscount} />;
}
