import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DEFAULT_CONTENT } from '@/lib/defaultContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
// (optional extra belt+suspenders)
export const fetchCache = 'force-no-store';

const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'admin_session';

function isAuthed() {
  // only call cookies() inside a request lifecycle
  return cookies().get(COOKIE_NAME)?.value === '1';
}

export async function GET() {
  if (!isAuthed()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Lazy import Prisma at request time to avoid build-time evaluation
    const { prisma } = await import('@/lib/prisma');

    let row = await prisma.content.findUnique({ where: { id: 1 } });
    if (!row) {
      row = await prisma.content.create({
        data: { id: 1, data: DEFAULT_CONTENT }, // seed-on-first-read (safe for prod)
      });
    }

    return NextResponse.json(row.data, { status: 200 });
  } catch (err) {
    console.error('GET /api/admin/content failed', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!isAuthed()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { projects, experiences, journey, notes } = body as Record<string, unknown>;
    if (!projects || !experiences || !journey || !notes) {
      return NextResponse.json({ error: 'Missing sections' }, { status: 400 });
    }

    const { prisma } = await import('@/lib/prisma');

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
