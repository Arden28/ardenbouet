// app/api/content/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const EMPTY = { projects: [], experiences: [], journey: [], notes: [] } as const;

export async function GET() {
  try {
    const { prisma } = await import('@/lib/prisma'); // lazy import so build doesn’t touch Prisma
    const row = await prisma.content.findUnique({ where: { id: 1 } });
    return NextResponse.json(row?.data ?? EMPTY, { status: 200 });
  } catch (err) {
    console.error('GET /api/content failed', err);
    // Still return a valid JSON shape so the app can render
    return NextResponse.json(EMPTY, { status: 200 });
  }
}
