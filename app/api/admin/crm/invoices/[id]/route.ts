import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'admin_session';

async function isAuthed() {
  try {
    const store = await cookies();
    return store.get(COOKIE_NAME)?.value === '1';
  } catch { return false; }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { status, amount, currency, dueAt, notes, projectId, clientId } = body;

  // Auto-set paidAt when marking as PAID
  let paidAt: Date | null | undefined = undefined;
  if (status === 'PAID') {
    const existing = await prisma.crmInvoice.findUnique({ where: { id: params.id }, select: { paidAt: true } });
    if (existing && !existing.paidAt) paidAt = new Date();
  } else if (status && status !== 'PAID') {
    paidAt = null; // clear paidAt if moving away from PAID
  }

  const invoice = await prisma.crmInvoice.update({
    where: { id: params.id },
    data: {
      ...(status    !== undefined ? { status } : {}),
      ...(amount    !== undefined ? { amount: Number(amount) } : {}),
      ...(currency  !== undefined ? { currency } : {}),
      ...(dueAt     !== undefined ? { dueAt: dueAt ? new Date(dueAt) : null } : {}),
      ...(notes     !== undefined ? { notes: notes?.trim() || null } : {}),
      ...(projectId !== undefined ? { projectId: projectId || null } : {}),
      ...(clientId  !== undefined ? { clientId } : {}),
      ...(paidAt    !== undefined ? { paidAt } : {}),
    },
    include: {
      client:  { select: { id: true, name: true, company: true } },
      project: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(invoice);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.crmInvoice.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
