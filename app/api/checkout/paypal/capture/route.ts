// POST /api/checkout/paypal/capture { orderId } — captures a PayPal order this site created, and marks it
// PAID only if PayPal captured the full stored amount in the stored currency.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { capturedAmount, coversOrder, getPayPalToken } from '@/lib/paypal';

export async function POST(req: NextRequest) {
  const { orderId } = await req.json().catch(() => ({}));
  if (!orderId || typeof orderId !== 'string') return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentProvider !== 'paypal') return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const token = await getPayPalToken();
  const captureRes = await fetch(`${process.env.PAYPAL_BASE || 'https://api-m.sandbox.paypal.com'}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  const json = await captureRes.json();

  if (!coversOrder(capturedAmount(json), order)) {
    console.error('[paypal/capture] not captured in full', { orderId, status: json?.status });
    return NextResponse.json({ error: 'Capture failed' }, { status: 402 });
  }

  await prisma.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
  return NextResponse.json({ ok: true });
}
