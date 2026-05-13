import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'admin_session';

async function isAuthed() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_NAME)?.value === '1';
  } catch {
    return false;
  }
}

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(orders);
  } catch (err) {
    console.error('GET /api/admin/orders failed', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { customerName, customerEmail, productId, productTitle, amount, currency, status, stripeId, notes } = body;

    if (!customerName || !customerEmail || !productId || !productTitle || amount == null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        customerName,
        customerEmail,
        productId,
        productTitle,
        amount: Number(amount),
        currency: currency || 'USD',
        status: status || 'PENDING',
        stripeId: stripeId || null,
        notes: notes || null,
      },
    });
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error('POST /api/admin/orders failed', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
