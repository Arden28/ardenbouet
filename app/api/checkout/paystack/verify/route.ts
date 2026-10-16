import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { localCharge, quote } from '@/lib/checkoutPrice';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY ?? '';

export async function POST(req: NextRequest) {
  const { reference, productId, code, customerName, customerEmail } = await req.json();
  if (!reference) return NextResponse.json({ error: 'Missing reference' }, { status: 400 });

  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });
  const json = await res.json();

  if (!json.status || json.data?.status !== 'success') {
    return NextResponse.json({ error: 'Payment not verified' }, { status: 402 });
  }

  const paidAmount = (json.data.amount ?? 0) / 100;
  const paidCurrency = String(json.data.currency ?? '').toUpperCase();

  // What was paid must cover the server's price for this product (+ promo code) in the charged currency.
  const q = await quote(productId, code);
  if (!q) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  const expected = Math.round(localCharge(q, paidCurrency || 'NGN'));
  if (!paidCurrency || paidAmount + 1 < expected) {
    console.error('[paystack/verify] underpaid', { reference, paidAmount, paidCurrency, expected });
    return NextResponse.json({ error: 'Payment does not match the price' }, { status: 402 });
  }
  // A reference can only ever pay for one product.
  const existing = await prisma.order.findUnique({ where: { id: reference }, select: { productId: true } });
  if (existing && existing.productId !== q.product.id) return NextResponse.json({ error: 'Reference already used' }, { status: 409 });

  await prisma.order.upsert({
    where: { id: reference },
    update: { status: 'PAID', paymentRef: reference, paymentProvider: 'paystack' },
    create: {
      id: reference,
      customerName: customerName ?? json.data.customer?.name ?? '',
      customerEmail: customerEmail ?? json.data.customer?.email ?? '',
      productId: q.product.id,
      productTitle: q.product.title,
      amount: paidAmount,
      currency: paidCurrency,
      paymentRef: reference,
      paymentProvider: 'paystack',
      status: 'PAID',
    },
  });

  return NextResponse.json({ ok: true });
}
