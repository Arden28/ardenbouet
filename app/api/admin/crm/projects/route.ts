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

export async function GET(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const clientId = searchParams.get('clientId');
  const status   = searchParams.get('status');
  const q        = searchParams.get('q')?.toLowerCase();

  const projects = await prisma.crmProject.findMany({
    where: {
      ...(clientId ? { clientId } : {}),
      ...(status   ? { status: status as any } : {}),
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
    },
    include: {
      client: { select: { id: true, name: true, company: true } },
      _count:  { select: { invoices: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { clientId, title, description, status, budget, currency, startDate, endDate, notes } = body;

  if (!clientId || typeof clientId !== 'string') return NextResponse.json({ error: 'clientId required' }, { status: 400 });
  if (!title    || typeof title    !== 'string') return NextResponse.json({ error: 'title required' },    { status: 400 });

  const project = await prisma.crmProject.create({
    data: {
      clientId,
      title:       title.trim(),
      description: description?.trim() || null,
      status:      status || 'DISCOVERY',
      budget:      budget != null ? Number(budget) : null,
      currency:    currency || 'USD',
      startDate:   startDate ? new Date(startDate) : null,
      endDate:     endDate   ? new Date(endDate)   : null,
      notes:       Array.isArray(notes) ? notes : [],
    },
    include: { client: { select: { id: true, name: true, company: true } } },
  });

  return NextResponse.json(project, { status: 201 });
}
