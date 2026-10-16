// POST /api/checkout/fulfill { paymentRef } — after a successful payment, returns the download link.
// Only paid orders are fulfilled (Stripe is confirmed with Stripe), and every detail comes from the stored
// order, so a caller can't obtain a file, or send a receipt, without having paid.
import { NextRequest, NextResponse } from 'next/server';
import { fulfillOrder } from '@/lib/fulfillment';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const paymentRef = typeof body?.paymentRef === 'string' ? body.paymentRef.slice(0, 200) : '';
  if (!paymentRef) return NextResponse.json({ error: 'Missing paymentRef' }, { status: 400 });

  try {
    const r = await fulfillOrder(paymentRef);
    if (r.status === 'not_found') return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (r.status === 'pending') return NextResponse.json({ pending: true }, { status: 202 });
    return NextResponse.json({ ok: true, downloadToken: r.downloadToken });
  } catch (err) {
    console.error('[fulfill] unhandled error:', err);
    return NextResponse.json({ error: 'Could not complete the order' }, { status: 500 });
  }
}
