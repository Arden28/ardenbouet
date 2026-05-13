import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

let _stripe: Stripe | null = null;
function getStripeClient() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' as const });
  return _stripe;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET ?? '';
  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(body, sig, endpointSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object as Stripe.PaymentIntent;
    await prisma.order.updateMany({
      where: { stripeId: intent.id },
      data: { status: 'PAID' },
    });
  }

  return NextResponse.json({ received: true });
}
