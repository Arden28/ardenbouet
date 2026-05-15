import { prisma } from '@/lib/prisma';
import { sendPurchaseEmail } from '@/lib/mailer';
import type { ContentBundle } from '@/app/admin/types';

interface FulfillParams {
  paymentRef: string;
  productId: string;
  productTitle: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
}

export async function fulfillOrder(params: FulfillParams): Promise<{ downloadToken: string | null }> {
  const { paymentRef, productId, productTitle, customerName, customerEmail, amount, currency } = params;

  // Resolve the DB order from the paymentRef (format: "<provider>_<ref>")
  const underscoreIdx = paymentRef.indexOf('_');
  const provider = underscoreIdx === -1 ? paymentRef : paymentRef.slice(0, underscoreIdx);
  const ref       = underscoreIdx === -1 ? ''         : paymentRef.slice(underscoreIdx + 1);

  let orderId: string | null = null;

  if (provider === 'stripe') {
    const order = await prisma.order.findFirst({ where: { stripeId: ref } });
    if (order) {
      orderId = order.id;
      if (order.status !== 'PAID') {
        await prisma.order.update({ where: { id: order.id }, data: { status: 'PAID', paymentRef } });
      }
    }
  } else if (provider === 'paypal') {
    const order = await prisma.order.findUnique({ where: { id: ref } });
    orderId = order?.id ?? null;
  } else {
    // paystack, mpesa
    const order = await prisma.order.findFirst({ where: { paymentRef: ref } });
    orderId = order?.id ?? null;
  }

  // Idempotency: if a token already exists for this order, skip creation and just re-send
  if (orderId) {
    const existing = await prisma.downloadToken.findFirst({ where: { orderId } });
    if (existing) return { downloadToken: existing.id };
  }

  // Resolve product metadata from content bundle
  const row    = await prisma.content.findUnique({ where: { id: 1 } });
  const bundle = row?.data as ContentBundle | null;
  const product = bundle?.products?.find(p => p.id === productId);

  const isService = product?.category === 'service';
  const fileUrl   = product?.fileUrl ?? null;

  let downloadTokenId: string | null = null;

  if (!isService && fileUrl && orderId) {
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const token = await prisma.downloadToken.create({
      data: { orderId, productId, productTitle, customerEmail, customerName, fileUrl, expiresAt },
    });
    downloadTokenId = token.id;
  }

  await sendPurchaseEmail({
    customerName,
    customerEmail,
    productTitle,
    amount,
    currency,
    paymentRef,
    isService,
    downloadToken: downloadTokenId,
  });

  return { downloadToken: downloadTokenId };
}
