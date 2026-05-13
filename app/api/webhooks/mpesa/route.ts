import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const callback = body?.Body?.stkCallback;
  if (!callback) return NextResponse.json({ received: true });

  const requestId: string = callback.CheckoutRequestID ?? '';
  const resultCode: number = callback.ResultCode;

  if (!requestId) return NextResponse.json({ received: true });

  const newStatus = resultCode === 0 ? 'PAID' : 'CANCELLED';
  await prisma.order.updateMany({
    where: { paymentRef: requestId, paymentProvider: 'mpesa' },
    data: { status: newStatus },
  });

  return NextResponse.json({ received: true });
}
