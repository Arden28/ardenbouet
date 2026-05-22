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
  const clientId  = searchParams.get('clientId');
  const projectId = searchParams.get('projectId');
  const status    = searchParams.get('status');
  const q         = searchParams.get('q');

  const invoices = await prisma.crmInvoice.findMany({
    where: {
      ...(clientId  ? { clientId }  : {}),
      ...(projectId ? { projectId } : {}),
      ...(status    ? { status: status as any } : {}),
      ...(q ? { invoiceNumber: { contains: q, mode: 'insensitive' } } : {}),
    },
    include: {
      client:  { select: { id: true, name: true, company: true } },
      project: { select: { id: true, title: true } },
    },
    orderBy: { issuedAt: 'desc' },
  });

  return NextResponse.json(invoices);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { clientId, projectId, amount, currency, dueAt, notes } = body;

  if (!clientId || typeof clientId !== 'string') return NextResponse.json({ error: 'clientId required' }, { status: 400 });
  if (amount == null || isNaN(Number(amount)))   return NextResponse.json({ error: 'amount required' },   { status: 400 });

  // Auto-generate invoice number: INV-YYYY-NNN
  const year = new Date().getFullYear();
  const latest = await prisma.crmInvoice.findFirst({
    where:   { invoiceNumber: { startsWith: `INV-${year}-` } },
    orderBy: { invoiceNumber: 'desc' },
    select:  { invoiceNumber: true },
  });
  const seq = latest
    ? parseInt(latest.invoiceNumber.split('-')[2], 10) + 1
    : 1;
  const invoiceNumber = `INV-${year}-${String(seq).padStart(3, '0')}`;

  const invoice = await prisma.crmInvoice.create({
    data: {
      invoiceNumber,
      clientId,
      projectId: projectId || null,
      amount:    Number(amount),
      currency:  currency || 'USD',
      dueAt:     dueAt ? new Date(dueAt) : null,
      notes:     notes?.trim() || null,
    },
    include: {
      client:  { select: { id: true, name: true, company: true } },
      project: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(invoice, { status: 201 });
}
