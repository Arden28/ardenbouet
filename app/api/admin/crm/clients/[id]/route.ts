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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await prisma.crmClient.findUnique({
    where: { id: params.id },
    include: {
      projects: { orderBy: { createdAt: 'desc' } },
      invoices: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(client);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, email, company, phone, country, status, notes, tags } = body;

  const client = await prisma.crmClient.update({
    where: { id: params.id },
    data: {
      ...(name    !== undefined ? { name:    name.trim()    } : {}),
      ...(email   !== undefined ? { email:   email.trim()   } : {}),
      ...(company !== undefined ? { company: company?.trim() || null } : {}),
      ...(phone   !== undefined ? { phone:   phone?.trim()   || null } : {}),
      ...(country !== undefined ? { country: country?.trim() || null } : {}),
      ...(status  !== undefined ? { status  } : {}),
      ...(notes   !== undefined ? { notes:   notes?.trim()   || null } : {}),
      ...(tags    !== undefined ? { tags: Array.isArray(tags) ? tags : [] } : {}),
    },
  });

  return NextResponse.json(client);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.crmClient.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
