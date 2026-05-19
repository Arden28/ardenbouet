import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createUploadPresignedUrl } from '@/lib/r2';
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

export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cfg = await getR2Config();
  if (!cfg) {
    return NextResponse.json({ error: 'R2 not configured' }, { status: 503 });
  }

  const { filename, contentType, folder } = await req.json();

  if (!filename || typeof filename !== 'string' || filename.includes('..')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }
  if (!contentType || typeof contentType !== 'string') {
    return NextResponse.json({ error: 'Invalid contentType' }, { status: 400 });
  }
  const folderPrefix = folder && typeof folder === 'string' && !folder.includes('..')
    ? `${folder}/`
    : '';

  const result = await createUploadPresignedUrl(filename, contentType, cfg, folderPrefix);
  return NextResponse.json(result);
}
