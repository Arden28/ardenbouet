// app/api/content/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const EMPTY = { projects: [], experiences: [], journey: [], notes: [], products: [] } as const;

export async function GET() {
  try {
    const { prisma } = await import('@/lib/prisma');
    const row = await prisma.content.findUnique({ where: { id: 1 } });
    const data: Record<string, unknown> = (row?.data as Record<string, unknown>) ?? { ...EMPTY };

    // Strip fileUrl before sending to the public client.
    // R2/CDN file URLs must never be exposed — downloads go through /api/download/[token].
    if (Array.isArray(data.products)) {
      data.products = (data.products as Record<string, unknown>[]).map(
        ({ fileUrl: _f, ...rest }) => rest,
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error('GET /api/content failed', err);
    return NextResponse.json(EMPTY, { status: 200 });
  }
}
