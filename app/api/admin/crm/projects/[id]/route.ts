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
  const { title, description, status, budget, currency, startDate, endDate, notes, clientId } = body;

  const project = await prisma.crmProject.update({
    where: { id: params.id },
    data: {
      ...(title       !== undefined ? { title: title.trim() } : {}),
      ...(description !== undefined ? { description: description?.trim() || null } : {}),
      ...(status      !== undefined ? { status } : {}),
      ...(budget      !== undefined ? { budget: budget != null ? Number(budget) : null } : {}),
      ...(currency    !== undefined ? { currency } : {}),
      ...(startDate   !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
      ...(endDate     !== undefined ? { endDate:   endDate   ? new Date(endDate)   : null } : {}),
      ...(notes       !== undefined ? { notes: Array.isArray(notes) ? notes : [] } : {}),
      ...(clientId    !== undefined ? { clientId } : {}),
    },
    include: { client: { select: { id: true, name: true, company: true } } },
  });

  return NextResponse.json(project);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.crmProject.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
