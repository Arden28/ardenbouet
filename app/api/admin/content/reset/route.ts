import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { DEFAULT_CONTENT } from '@/lib/defaultContent';

const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'admin_session';
const isAuthed = () => cookies().get(COOKIE_NAME)?.value === '1';

export async function POST() {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await prisma.content.upsert({
    where: { id: 1 },
    update: { data: DEFAULT_CONTENT },
    create: { id: 1, data: DEFAULT_CONTENT },
  });
  return NextResponse.json({ ok: true });
}
