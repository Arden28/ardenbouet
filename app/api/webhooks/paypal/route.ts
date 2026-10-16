// POST /api/webhooks/paypal — PayPal notifies a completed capture. The body is not trusted: the order is
// looked up with PayPal's API and only marked PAID if PayPal confirms a full capture of our stored amount.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { capturedAmount, coversOrder, getPayPalOrder } from '@/lib/paypal';

export async function POST(req: NextRequest) {
  const event = await req.json().catch(() => null);
  if (event?.event_type !== 'PAYMENT.CAPTURE.COMPLETED') return NextResponse.json({ received: true });

  const orderId = String(event.resource?.supplementary_data?.related_ids?.order_id ?? '');
  if (!orderId) return NextResponse.json({ received: true });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status === 'PAID') return NextResponse.json({ received: true });

  try {
    const remote = await getPayPalOrder(orderId);
    if (remote && coversOrder(capturedAmount(remote), order)) {
      await prisma.order.update({ where: { id: order.id }, data: { status: 'PAID' } });
    } else {
      console.warn('[webhooks/paypal] not confirmed by PayPal, ignored', { orderId });
    }
  } catch (err) {
    console.error('[webhooks/paypal] lookup failed', err);
    return NextResponse.json({ error: 'lookup failed' }, { status: 500 }); // PayPal retries
  }
  return NextResponse.json({ received: true });
}
