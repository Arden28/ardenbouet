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
  const status = searchParams.get('status');
  const q      = searchParams.get('q')?.toLowerCase();

  const clients = await prisma.crmClient.findMany({
    where: {
      ...(status ? { status: status as any } : {}),
      ...(q ? {
        OR: [
          { name:    { contains: q, mode: 'insensitive' } },
          { company: { contains: q, mode: 'insensitive' } },
          { email:   { contains: q, mode: 'insensitive' } },
        ],
      } : {}),
    },
    include: {
      _count: { select: { projects: true, invoices: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, email, company, phone, country, status, notes, tags } = body;

  if (!name || typeof name !== 'string') return NextResponse.json({ error: 'name required' }, { status: 400 });
  if (!email || typeof email !== 'string') return NextResponse.json({ error: 'email required' }, { status: 400 });

  const client = await prisma.crmClient.create({
    data: {
      name: name.trim(),
      email: email.trim(),
      company: company?.trim() || null,
      phone:   phone?.trim()   || null,
      country: country?.trim() || null,
      status:  status || 'LEAD',
      notes:   notes?.trim()   || null,
      tags:    Array.isArray(tags) ? tags : [],
    },
  });

  return NextResponse.json(client, { status: 201 });
}
