import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { ContentBundle } from '@/app/admin/types';

const {
  MPESA_CONSUMER_KEY = '',
  MPESA_CONSUMER_SECRET = '',
  MPESA_SHORTCODE = '',
  MPESA_PASSKEY = '',
  MPESA_CALLBACK_URL = '',
} = process.env;

async function getDarajaToken(): Promise<string> {
  const creds = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
  const res = await fetch(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    { headers: { Authorization: `Basic ${creds}` } },
  );
  const json = await res.json();
  return json.access_token as string;
}

export async function POST(req: NextRequest) {
  const { phone, productId, productTitle, amount, amountKes, customerName, customerEmail } = await req.json();
  if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 });

  const row = await prisma.content.findUnique({ where: { id: 1 } });
  const bundle = row?.data as ContentBundle | null;
  const product = bundle?.products?.find(p => p.id === productId && p.status === 'published');
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  const token = await getDarajaToken();
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');
  const chargeKes = Math.round(amountKes ?? Math.ceil(product.price * 130));

  const stkRes = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: chargeKes,
      PartyA: phone,
      PartyB: MPESA_SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: MPESA_CALLBACK_URL,
      AccountReference: product.slug,
      TransactionDesc: productTitle ?? product.title,
    }),
  });

  const stkJson = await stkRes.json();
  if (stkJson.ResponseCode !== '0') {
    return NextResponse.json({ error: stkJson.ResponseDescription ?? 'STK push failed' }, { status: 502 });
  }

  const checkoutRequestId: string = stkJson.CheckoutRequestID;

  await prisma.order.create({
    data: {
      customerName,
      customerEmail,
      productId,
      productTitle: productTitle ?? product.title,
      amount: amount ?? product.price,
      currency: 'KES',
      paymentRef: checkoutRequestId,
      paymentProvider: 'mpesa',
      status: 'PENDING',
    },
  });

  return NextResponse.json({ checkoutRequestId });
}
