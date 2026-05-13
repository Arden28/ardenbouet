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

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { status, notes } = body;

    const VALID_STATUSES = ['PENDING', 'PAID', 'CANCELLED', 'REFUNDED'];
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
    });
    return NextResponse.json(order);
  } catch (err) {
    console.error('PUT /api/admin/orders/[id] failed', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await prisma.order.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/admin/orders/[id] failed', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
