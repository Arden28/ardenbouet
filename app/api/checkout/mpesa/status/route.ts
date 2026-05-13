import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const requestId = req.nextUrl.searchParams.get('requestId');
  if (!requestId) return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { paymentRef: requestId, paymentProvider: 'mpesa' },
    select: { status: true },
  });

  if (!order || order.status === 'PENDING') return NextResponse.json({});
  if (order.status === 'PAID') return NextResponse.json({ confirmed: true });
  return NextResponse.json({ failed: true });
}
