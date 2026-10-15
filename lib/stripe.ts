// lib/stripe.ts — shared Stripe client + donation helpers (server only).
import 'server-only';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { notifyEmail, notifyOwner } from '@/lib/notify';
import { SITE_URL } from '@/lib/mailer';

let client: Stripe | null = null;

export function stripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Stripe is not configured');
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-04-22.dahlia' as const });
  return client;
}

/** Platform fee taken from writer donations, in percent (0 by default). */
export function donationFeePercent() {
  const n = Number(process.env.DONATION_FEE_PERCENT ?? 0);
  return Number.isFinite(n) ? Math.min(30, Math.max(0, n)) : 0;
}

export const DONATION_LIMITS = { min: 100, max: 100_000 }; // $1 – $1,000 (minor units)

/** Sync a connected account's capability flags onto the reader. */
export async function syncConnectedAccount(account: Stripe.Account) {
  await prisma.reader.updateMany({
    where: { stripeAccountId: account.id },
    data: { stripeChargesEnabled: !!account.charges_enabled, stripePayoutsEnabled: !!account.payouts_enabled },
  });
}

const money = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);

/** Idempotently mark a donation as paid and tell the recipient. Safe to call from webhook and client confirm. */
export async function settleDonation(intent: Stripe.PaymentIntent) {
  const donation = await prisma.donation.findUnique({
    where: { stripePaymentIntentId: intent.id },
    include: { post: { select: { title: true, slug: true } }, recipient: { select: { email: true, name: true } } },
  });
  if (!donation) return null;
  if (intent.status === 'succeeded' && donation.status !== 'SUCCEEDED') {
    const updated = await prisma.donation.updateMany({
      where: { id: donation.id, status: { not: 'SUCCEEDED' } },
      data: { status: 'SUCCEEDED' },
    });
    if (updated.count) {
      const from = donation.isPublic && donation.donorName ? donation.donorName : 'A reader';
      const body = `${from} sent you ${money(donation.amount, donation.currency)}${donation.post ? ` for “${donation.post.title}”` : ''}.${donation.message ? `\n\n“${donation.message}”` : ''}`;
      if (donation.recipient) await notifyEmail(donation.recipient.email, 'You received a donation', body, { label: 'See your earnings', href: `${SITE_URL}/me/earnings` });
      else await notifyOwner('You received a donation', body, '/admin/users');
    }
  } else if (intent.status === 'canceled' || intent.status === 'requires_payment_method') {
    if (intent.last_payment_error && donation.status === 'PENDING') {
      await prisma.donation.update({ where: { id: donation.id }, data: { status: 'FAILED' } });
    }
  }
  return prisma.donation.findUnique({ where: { id: donation.id } });
}
