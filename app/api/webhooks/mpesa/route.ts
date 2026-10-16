// POST /api/webhooks/mpesa — Daraja STK callback. Callbacks are unsigned, so a success is confirmed with
// Safaricom's STK query before the order is marked PAID; failures only ever cancel a still-pending order.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stkPaid } from '@/lib/mpesa';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const callback = body?.Body?.stkCallback;
  const requestId = String(callback?.CheckoutRequestID ?? '');
  if (!requestId) return NextResponse.json({ received: true });

  const order = await prisma.order.findFirst({ where: { paymentRef: requestId, paymentProvider: 'mpesa' } });
  if (!order || order.status !== 'PENDING') return NextResponse.json({ received: true });

  try {
    const paid = await stkPaid(requestId);
    if (paid === true) await prisma.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
    else if (paid === false) await prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
  } catch (err) {
    console.error('[webhooks/mpesa] STK query failed', err);
  }
  return NextResponse.json({ received: true });
}
