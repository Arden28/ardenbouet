import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { listMediaFiles, deleteMediaFile } from '@/lib/r2';
import { getR2Config } from '@/lib/getR2Config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'admin_session';

async function isAuthed() {
  try {
    const store = await cookies();
    return store.get(COOKIE_NAME)?.value === '1';
  } catch {
    return false;
  }
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cfg = await getR2Config();
  if (!cfg) {
    return NextResponse.json({ error: 'R2 not configured' }, { status: 503 });
  }

  const files = await listMediaFiles(cfg);
  return NextResponse.json(files);
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cfg = await getR2Config();
  if (!cfg) {
    return NextResponse.json({ error: 'R2 not configured' }, { status: 503 });
  }

  const { key } = await req.json();

  if (!key || typeof key !== 'string' || key.includes('..')) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
  }

  await deleteMediaFile(key, cfg);
  return NextResponse.json({ ok: true });
}
