import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import type { ContentBundle } from '@/app/admin/types';

let _stripe: Stripe | null = null;
function getStripeClient() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' as const });
  return _stripe;
}

export async function POST(req: NextRequest) {
  const { productId, productTitle, amount, currency, customerName, customerEmail } = await req.json();

  const row = await prisma.content.findUnique({ where: { id: 1 } });
  const bundle = row?.data as ContentBundle | null;
  const product = bundle?.products?.find(p => p.id === productId && p.status === 'published');
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const amountCents = Math.round((amount ?? product.price) * 100);
  const curr = (currency ?? product.currency ?? 'usd').toLowerCase();

  const intent = await getStripeClient().paymentIntents.create({
    amount: amountCents,
    currency: curr,
    metadata: { productId, customerName, customerEmail },
    receipt_email: customerEmail,
  });

  await prisma.order.create({
    data: {
      customerName,
      customerEmail,
      productId,
      productTitle: productTitle ?? product.title,
      amount: amount ?? product.price,
      currency: curr.toUpperCase(),
      stripeId: intent.id,
      paymentProvider: 'stripe',
      status: 'PENDING',
    },
  });

  return NextResponse.json({ clientSecret: intent.client_secret });
}
