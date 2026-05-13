import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY ?? '';

export async function POST(req: NextRequest) {
  const { reference, productId, productTitle, amount, currency, customerName, customerEmail } = await req.json();
  if (!reference) return NextResponse.json({ error: 'Missing reference' }, { status: 400 });

  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });
  const json = await res.json();

  if (!json.status || json.data?.status !== 'success') {
    return NextResponse.json({ error: 'Payment not verified' }, { status: 402 });
  }

  const paidAmount = (json.data.amount ?? 0) / 100;
  const paidCurrency = (json.data.currency ?? currency ?? 'NGN').toUpperCase();

  await prisma.order.upsert({
    where: { id: reference },
    update: { status: 'PAID', paymentRef: reference, paymentProvider: 'paystack' },
    create: {
      id: reference,
      customerName: customerName ?? json.data.customer?.name ?? '',
      customerEmail: customerEmail ?? json.data.customer?.email ?? '',
      productId: productId ?? '',
      productTitle: productTitle ?? '',
      amount: paidAmount,
      currency: paidCurrency,
      paymentRef: reference,
      paymentProvider: 'paystack',
      status: 'PAID',
    },
  });

  return NextResponse.json({ ok: true });
}
