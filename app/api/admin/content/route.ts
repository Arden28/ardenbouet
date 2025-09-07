import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { DEFAULT_CONTENT } from '@/lib/defaultContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'admin_session';

function isAuthed() {
  return cookies().get(COOKIE_NAME)?.value === '1';
}

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    let row = await prisma.content.findUnique({ where: { id: 1 } });
    if (!row) {
      row = await prisma.content.create({
        data: { id: 1, data: DEFAULT_CONTENT }, // <-- seed-on-first-read
      });
    }
    return NextResponse.json(row.data, { status: 200 });
  } catch (err) {
    console.error('GET /api/admin/content failed', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const { projects, experiences, journey, notes } = body as Record<string, unknown>;
    if (!projects || !experiences || !journey || !notes) {
      return NextResponse.json({ error: 'Missing sections' }, { status: 400 });
    }

    await prisma.content.upsert({
      where: { id: 1 },
      update: { data: body },
      create: { id: 1, data: body },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error('PUT /api/admin/content failed', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
