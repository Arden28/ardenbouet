import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { quote } from '@/lib/checkoutPrice';

let _stripe: Stripe | null = null;
function getStripeClient() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' as const });
  return _stripe;
}

export async function POST(req: NextRequest) {
  // The price comes from the server (product + optional promo code), never from the request body.
  const { productId, code, customerName, customerEmail } = await req.json();
  const q = await quote(productId, code);
  if (!q) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  const { product } = q;

  const amountCents = Math.round(q.amount * 100);
  const curr = q.currency.toLowerCase();

  const intent = await getStripeClient().paymentIntents.create({
    amount: amountCents,
    currency: curr,
    metadata: { productId, customerName, customerEmail, ...(q.discount ? { promo: q.discount.code } : {}) },
    receipt_email: customerEmail,
  });

  await prisma.order.create({
    data: {
      customerName,
      customerEmail,
      productId,
      productTitle: product.title,
      amount: q.amount,
      currency: curr.toUpperCase(),
      stripeId: intent.id,
      paymentProvider: 'stripe',
      status: 'PENDING',
    },
  });

  return NextResponse.json({ clientSecret: intent.client_secret });
}
