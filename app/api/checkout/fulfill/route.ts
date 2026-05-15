import { NextRequest, NextResponse } from 'next/server';
import { fulfillOrder } from '@/lib/fulfillment';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { paymentRef, productId, productTitle, customerName, customerEmail, amount, currency } = body;

  if (!paymentRef || !productId || !customerEmail) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { downloadToken } = await fulfillOrder({
    paymentRef,
    productId,
    productTitle: productTitle ?? '',
    customerName: customerName ?? '',
    customerEmail,
    amount: Number(amount) || 0,
    currency: currency ?? 'USD',
  });

  return NextResponse.json({ ok: true, downloadToken });
}
