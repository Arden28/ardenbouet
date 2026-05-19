import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { listMediaFiles, deleteMediaFile, renameMediaFile } from '@/lib/r2';
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

export async function PATCH(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cfg = await getR2Config();
  if (!cfg) {
    return NextResponse.json({ error: 'R2 not configured' }, { status: 503 });
  }

  const { oldKey, newName } = await req.json();

  if (!oldKey || typeof oldKey !== 'string' || oldKey.includes('..')) {
    return NextResponse.json({ error: 'Invalid oldKey' }, { status: 400 });
  }
  if (!newName || typeof newName !== 'string' || newName.includes('..') || newName.includes('/')) {
    return NextResponse.json({ error: 'Invalid newName' }, { status: 400 });
  }

  const sanitized = newName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const parts  = oldKey.split('/');
  parts[parts.length - 1] = sanitized;
  const newKey = parts.join('/');
  const newUrl = `${cfg.publicUrl}/${newKey}`;

  await renameMediaFile(oldKey, newKey, cfg);
  return NextResponse.json({ ok: true, newKey, newUrl });
}
