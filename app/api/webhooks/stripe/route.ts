import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getStripe, settleDonation, syncConnectedAccount } from '@/lib/stripe';

// Platform events use STRIPE_WEBHOOK_SECRET; Connect events (account.updated from writers'
// connected accounts) arrive on a separate Connect endpoint with STRIPE_CONNECT_WEBHOOK_SECRET.
// Both can point at this URL.
function verify(body: string, sig: string): Stripe.Event | null {
  const secrets = [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_CONNECT_WEBHOOK_SECRET].filter(Boolean) as string[];
  for (const secret of secrets) {
    try { return getStripe().webhooks.constructEvent(body, sig, secret); } catch { /* try next */ }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const event = verify(body, req.headers.get('stripe-signature') ?? '');
  if (!event) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });

  if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object as Stripe.PaymentIntent;
    if (intent.metadata?.kind === 'donation') {
      await settleDonation(intent);
    } else if (event.type === 'payment_intent.succeeded') {
      await prisma.order.updateMany({
        where: { stripeId: intent.id },
        data: { status: 'PAID' },
      });
    }
  }

  if (event.type === 'account.updated') {
    await syncConnectedAccount(event.data.object as Stripe.Account);
  }

  return NextResponse.json({ received: true });
}
