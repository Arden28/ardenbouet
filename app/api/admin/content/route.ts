import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { DEFAULT_CONTENT } from '@/lib/defaultContent';
import { prisma } from '@/lib/prisma'; // 1. Use static import

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'admin_session';

// 2. MUST be async in Next.js 15
async function isAuthed() {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_NAME)?.value === '1';
  } catch (err) {
    return false;
  }
}

export async function GET() {
  // 3. Await the auth check
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let row = await prisma.content.findUnique({ where: { id: 1 } });
    if (!row) {
      row = await prisma.content.create({
        data: { id: 1, data: DEFAULT_CONTENT }, 
      });
    }

    return NextResponse.json(row.data, { status: 200 });
  } catch (err) {
    console.error('GET /api/admin/content failed', err);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  // Await the auth check
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { projects, experiences, journey, notes, products } = body as Record<string, unknown>;
    if (!projects || !experiences || !journey || !notes) {
      return NextResponse.json({ error: 'Missing sections' }, { status: 400 });
    }
    // products is optional for backwards compat with old saved bundles
    if (products !== undefined && !Array.isArray(products)) {
      return NextResponse.json({ error: 'Invalid products' }, { status: 400 });
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