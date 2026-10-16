import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { sendPurchaseEmail } from '@/lib/mailer';
import type { ContentBundle } from '@/app/admin/types';

export type FulfillResult =
  | { status: 'fulfilled'; downloadToken: string | null }
  | { status: 'pending' }
  | { status: 'not_found' };

/** Resolves the DB order from a provider-prefixed paymentRef ("stripe_pi_…", "paypal_…", "paystack_…", "mpesa_…"). */
async function findOrder(paymentRef: string) {
  const i = paymentRef.indexOf('_');
  const provider = i === -1 ? paymentRef : paymentRef.slice(0, i);
  const ref = i === -1 ? '' : paymentRef.slice(i + 1);
  if (!ref) return null;
  if (provider === 'stripe') return prisma.order.findFirst({ where: { stripeId: ref } });
  if (provider === 'paypal') return prisma.order.findUnique({ where: { id: ref } });
  if (provider === 'paystack' || provider === 'mpesa') return prisma.order.findFirst({ where: { paymentRef: ref } });
  return null;
}

/** Stripe: confirm with Stripe that the intent succeeded for the full order amount before treating it as paid. */
async function confirmStripe(order: { id: string; stripeId: string | null; amount: number; currency: string }, paymentRef: string): Promise<boolean> {
  if (!order.stripeId || !process.env.STRIPE_SECRET_KEY) return false;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-04-22.dahlia' as const });
  const intent = await stripe.paymentIntents.retrieve(order.stripeId);
  const ok = intent.status === 'succeeded'
    && intent.currency.toUpperCase() === order.currency.toUpperCase()
    && intent.amount_received >= Math.round(order.amount * 100);
  if (ok) await prisma.order.update({ where: { id: order.id }, data: { status: 'PAID', paymentRef } });
  return ok;
}

/**
 * Issues the download link and receipt for a PAID order. Everything (product, customer, amount) comes from the
 * order as created by the payment routes; nothing from the caller except the payment reference.
 * Idempotent: an order that already has a download token gets that token back.
 */
export async function fulfillOrder(paymentRef: string): Promise<FulfillResult> {
  const order = await findOrder(paymentRef);
  if (!order) return { status: 'not_found' };

  if (order.status !== 'PAID') {
    const confirmed = paymentRef.startsWith('stripe_') ? await confirmStripe(order, paymentRef).catch(() => false) : false;
    if (!confirmed) return { status: 'pending' };
  }

  const existing = await prisma.downloadToken.findFirst({ where: { orderId: order.id }, orderBy: { createdAt: 'desc' } });
  if (existing) return { status: 'fulfilled', downloadToken: existing.id };

  const row = await prisma.content.findUnique({ where: { id: 1 } });
  const product = (row?.data as ContentBundle | null)?.products?.find(p => p.id === order.productId);
  const isService = product?.category === 'service';
  const fileUrl = product?.fileUrl ?? null;

  let downloadTokenId: string | null = null;
  if (!isService && fileUrl) {
    const token = await prisma.downloadToken.create({
      data: {
        orderId: order.id, productId: order.productId, productTitle: order.productTitle,
        customerEmail: order.customerEmail, customerName: order.customerName,
        fileUrl, expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });
    downloadTokenId = token.id;
  }

  try {
    await sendPurchaseEmail({
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      productTitle: order.productTitle,
      amount: order.amount,
      currency: order.currency,
      paymentRef,
      isService,
      downloadToken: downloadTokenId,
    });
  } catch (err) {
    console.error('[fulfillment] email failed (non-fatal):', err);
  }

  return { status: 'fulfilled', downloadToken: downloadTokenId };
}
