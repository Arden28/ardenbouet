// GET (link) / POST (RFC 8058 one-click) /api/blog/unsubscribe?token=
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function unsubscribe(token: string) {
  if (!token) return false;
  const res = await prisma.subscriber.updateMany({ where: { token }, data: { status: 'UNSUBSCRIBED' } });
  return res.count > 0;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ok = await unsubscribe(url.searchParams.get('token') ?? '');
  return NextResponse.redirect(new URL(`/blog/subscribe?status=${ok ? 'unsubscribed' : 'invalid'}`, url));
}

export async function POST(req: Request) {
  await unsubscribe(new URL(req.url).searchParams.get('token') ?? '');
  return NextResponse.json({ ok: true });
}
