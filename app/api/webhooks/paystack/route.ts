import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY ?? '';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('x-paystack-signature') ?? '';
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(body).digest('hex');

  if (hash !== sig) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });

  const event = JSON.parse(body);
  if (event.event === 'charge.success') {
    const ref: string = event.data?.reference;
    if (ref) {
      await prisma.order.updateMany({
        where: { paymentRef: ref, paymentProvider: 'paystack' },
        data: { status: 'PAID' },
      });
    }
  }

  return NextResponse.json({ received: true });
}
