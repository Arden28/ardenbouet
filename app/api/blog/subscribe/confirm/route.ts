// GET /api/blog/subscribe/confirm?token= — activates a subscriber, then redirects to /blog/subscribe
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') ?? '';
  const sub = token ? await prisma.subscriber.findUnique({ where: { token } }) : null;
  if (sub && sub.status !== 'UNSUBSCRIBED') {
    await prisma.subscriber.update({
      where: { id: sub.id },
      data: { status: 'ACTIVE', confirmedAt: sub.confirmedAt ?? new Date() },
    });
  }
  return NextResponse.redirect(new URL(`/blog/subscribe?status=${sub ? 'confirmed' : 'invalid'}`, url));
}
