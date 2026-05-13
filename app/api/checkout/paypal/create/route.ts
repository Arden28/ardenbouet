import { NextRequest, NextResponse } from 'next/server';
import type { ContentBundle } from '@/app/admin/types';
import { prisma } from '@/lib/prisma';

const {
  PAYPAL_CLIENT_ID = '',
  PAYPAL_CLIENT_SECRET = '',
  PAYPAL_BASE = 'https://api-m.sandbox.paypal.com',
} = process.env;

async function getPayPalToken(): Promise<string> {
  const creds = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const json = await res.json();
  return json.access_token as string;
}

export async function POST(req: NextRequest) {
  const { amount, currency, productTitle, productId, customerName, customerEmail } = await req.json();

  const row = await prisma.content.findUnique({ where: { id: 1 } });
  const bundle = row?.data as ContentBundle | null;
  const product = bundle?.products?.find(p => p.id === productId && p.status === 'published');

  const curr = (currency ?? product?.currency ?? 'USD').toUpperCase();
  const value = (amount ?? product?.price ?? 0).toFixed(2);
  const title = productTitle ?? product?.title ?? '';

  const token = await getPayPalToken();
  const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `arden-${productId}-${Date.now()}`,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: curr, value },
        description: title,
        custom_id: `${productId}||${customerEmail}`,
      }],
    }),
  });

  const orderJson = await orderRes.json();
  if (!orderJson.id) return NextResponse.json({ error: 'PayPal order creation failed' }, { status: 502 });

  await prisma.order.create({
    data: {
      id: orderJson.id,
      customerName: customerName ?? '',
      customerEmail: customerEmail ?? '',
      productId: productId ?? '',
      productTitle: title,
      amount: Number(value),
      currency: curr,
      paymentRef: orderJson.id,
      paymentProvider: 'paypal',
      status: 'PENDING',
    },
  });

  return NextResponse.json({ id: orderJson.id });
}
