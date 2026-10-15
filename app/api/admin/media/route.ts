import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminSession';
import { cookies } from 'next/headers';
import { listFolderContents, deleteMediaFile, renameMediaFile, createVirtualFolder, searchMedia, deletePrefix, listAllMedia, copyMediaFile, renamePrefix } from '@/lib/r2';
import { getR2Config } from '@/lib/getR2Config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'admin_session';

async function isAuthed() {
  try {
    const store = await cookies();
    return verifyAdminToken(store.get(COOKIE_NAME)?.value);
  } catch {
    return false;
  }
}

function validPrefix(prefix: unknown): prefix is string {
  return (
    typeof prefix === 'string' &&
    prefix.startsWith('media/') &&
    prefix.endsWith('/') &&
    !prefix.includes('..')
  );
}

export async function GET(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cfg = await getR2Config();
  if (!cfg) {
    return NextResponse.json({ error: 'R2 not configured' }, { status: 503 });
  }

  const prefix = req.nextUrl.searchParams.get('prefix') ?? 'media/';

  if (!validPrefix(prefix)) {
    return NextResponse.json({ error: 'Invalid prefix' }, { status: 400 });
  }

  // ?search= looks through every folder below the prefix, not just the current level.
  const search = req.nextUrl.searchParams.get('search');
  if (search !== null) {
    return NextResponse.json({ files: await searchMedia(search, cfg, prefix), folders: [] });
  }

  // ?all=1 returns every file below the prefix (Recent, type views, storage meter).
  if (req.nextUrl.searchParams.get('all') === '1') {
    return NextResponse.json({ files: await listAllMedia(cfg, prefix), folders: [] });
  }

  const result = await listFolderContents(prefix, cfg);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cfg = await getR2Config();
  if (!cfg) {
    return NextResponse.json({ error: 'R2 not configured' }, { status: 503 });
  }

  const body = await req.json();

  if (body.action === 'createFolder') {
    const { prefix } = body;
    if (!validPrefix(prefix)) {
      return NextResponse.json({ error: 'Invalid prefix' }, { status: 400 });
    }
    await createVirtualFolder(prefix, cfg);
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'copy') {
    const { key } = body;
    if (typeof key !== 'string' || !key.startsWith('media/') || key.includes('..') || key.endsWith('/')) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }
    const newKey = await copyMediaFile(key, cfg);
    return NextResponse.json({ ok: true, key: newKey, url: `${cfg.publicUrl}/${newKey}` });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cfg = await getR2Config();
  if (!cfg) {
    return NextResponse.json({ error: 'R2 not configured' }, { status: 503 });
  }

  const { key, keys, prefix } = await req.json();

  // Whole folder (recursive)
  if (prefix !== undefined) {
    if (!validPrefix(prefix) || prefix === 'media/') {
      return NextResponse.json({ error: 'Invalid prefix' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, deleted: await deletePrefix(prefix, cfg) });
  }

  // One or many files
  const list: unknown[] = Array.isArray(keys) ? keys : [key];
  if (!list.length || list.some(k => typeof k !== 'string' || !k.startsWith('media/') || k.includes('..'))) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
  }
  for (const k of list as string[]) await deleteMediaFile(k, cfg);
  return NextResponse.json({ ok: true, deleted: list.length });
}

export async function PATCH(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cfg = await getR2Config();
  if (!cfg) {
    return NextResponse.json({ error: 'R2 not configured' }, { status: 503 });
  }

  const { oldKey, newKey, newName, oldPrefix, newPrefix } = await req.json();

  // Folder rename / move (recursive)
  if (oldPrefix !== undefined) {
    if (!validPrefix(oldPrefix) || !validPrefix(newPrefix) || oldPrefix === 'media/' || newPrefix.startsWith(oldPrefix)) {
      return NextResponse.json({ error: 'Invalid folder' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, moved: await renamePrefix(oldPrefix, newPrefix, cfg) });
  }

  if (!oldKey || typeof oldKey !== 'string' || oldKey.includes('..')) {
    return NextResponse.json({ error: 'Invalid oldKey' }, { status: 400 });
  }

  let targetKey: string;

  if (newKey) {
    // Full-path move: caller provides exact target key
    if (typeof newKey !== 'string' || newKey.includes('..') || !newKey.startsWith('media/')) {
      return NextResponse.json({ error: 'Invalid newKey' }, { status: 400 });
    }
    targetKey = newKey;
  } else if (newName) {
    // Rename in same folder: keep prefix, change basename
    if (typeof newName !== 'string' || newName.includes('..') || newName.includes('/')) {
      return NextResponse.json({ error: 'Invalid newName' }, { status: 400 });
    }
    const sanitized = newName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const parts = oldKey.split('/');
    parts[parts.length - 1] = sanitized;
    targetKey = parts.join('/');
  } else {
    return NextResponse.json({ error: 'Provide newKey or newName' }, { status: 400 });
  }

  const publicUrl = `${cfg.publicUrl}/${targetKey}`;
  await renameMediaFile(oldKey, targetKey, cfg);
  return NextResponse.json({ ok: true, newKey: targetKey, newUrl: publicUrl });
}
