import { NextRequest, NextResponse } from 'next/server';
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
  // client sends orderId (lowercase d)
  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

  const token = await getPayPalToken();
  const captureRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const json = await captureRes.json();

  if (json.status !== 'COMPLETED') {
    return NextResponse.json({ error: 'Capture failed', details: json }, { status: 402 });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: 'PAID' },
  });

  return NextResponse.json({ ok: true });
}
