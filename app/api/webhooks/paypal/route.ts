import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const event = await req.json();

  if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const orderId: string = event.resource?.supplementary_data?.related_ids?.order_id ?? '';
    if (orderId) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' },
      }).catch(() => null);
    }
  }

  return NextResponse.json({ received: true });
}
