import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { localCharge, quote } from '@/lib/checkoutPrice';
import { darajaBase, getDarajaToken, stkPassword, stkTimestamp } from '@/lib/mpesa';

const { MPESA_SHORTCODE = '', MPESA_CALLBACK_URL = '' } = process.env;

export async function POST(req: NextRequest) {
  const { phone, productId, code, customerName, customerEmail } = await req.json();
  if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 });

  // The price comes from the server (product + optional promo code), never from the request body.
  const q = await quote(productId, code);
  if (!q) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  const { product } = q;

  const token = await getDarajaToken();
  const timestamp = stkTimestamp();
  const password = stkPassword(timestamp);
  const chargeKes = Math.ceil(localCharge(q, 'KES'));

  const stkRes = await fetch(`${darajaBase()}/mpesa/stkpush/v1/processrequest`, {
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
      TransactionDesc: product.title,
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
      productId: product.id,
      productTitle: product.title,
      amount: chargeKes, // recorded in the currency actually charged
      currency: 'KES',
      paymentRef: checkoutRequestId,
      paymentProvider: 'mpesa',
      status: 'PENDING',
    },
  });

  return NextResponse.json({ checkoutRequestId });
}
