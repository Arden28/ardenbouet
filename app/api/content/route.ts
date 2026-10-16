// app/api/content/route.ts — public, read-only view of the site content.
// Allow-list only: anything not listed here (storage credentials in settings, promo codes,
// downloadable file URLs, future private fields) never leaves the server.
import { NextResponse } from 'next/server';
import { publicProduct } from '@/lib/publicContent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const EMPTY = { projects: [], experiences: [], journey: [], notes: [], products: [], settings: {} } as const;

/** Settings that are safe to publish (identity, contact, social links). */
const PUBLIC_SETTINGS = ['siteTitle', 'siteTagline', 'contactEmail', 'contactPhone', 'location', 'github', 'twitter', 'linkedin', 'instagram', 'youtube'] as const;

type Obj = Record<string, unknown>;
const list = (v: unknown) => (Array.isArray(v) ? (v as Obj[]) : []);

export async function GET() {
  try {
    const { prisma } = await import('@/lib/prisma');
    const row = await prisma.content.findUnique({ where: { id: 1 } });
    const data = (row?.data as Obj | null) ?? {};
    const settings = (data.settings && typeof data.settings === 'object' ? data.settings : {}) as Obj;

    return NextResponse.json({
      projects: list(data.projects),
      experiences: list(data.experiences),
      journey: list(data.journey),
      notes: list(data.notes),
      products: list(data.products).filter(p => p.status === 'published').map(p => publicProduct(p)),
      settings: Object.fromEntries(PUBLIC_SETTINGS.filter(k => settings[k] !== undefined).map(k => [k, settings[k]])),
    }, { status: 200 });
  } catch (err) {
    console.error('GET /api/content failed', err);
    return NextResponse.json(EMPTY, { status: 200 });
  }
}
