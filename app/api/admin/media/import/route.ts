import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getR2Config } from '@/lib/getR2Config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'admin_session';

const EXT_MAP: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
  pdf: 'application/pdf',
};

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

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

  const { url, folder } = await req.json();

  if (!url || typeof url !== 'string' || !url.startsWith('http') || url.includes('..')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const folderPrefix = folder && typeof folder === 'string' && !folder.includes('..')
    ? `${folder}/`
    : '';

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ error: `Fetch failed: ${res.status}` }, { status: 400 });
  }

  const contentType =
    res.headers.get('content-type')?.split(';')[0].trim() ??
    EXT_MAP[url.split('.').pop()?.toLowerCase() ?? ''] ??
    'application/octet-stream';

  const rawName  = url.split('/').pop()?.split('?')[0] ?? `import-${Date.now()}`;
  const safeName = sanitize(rawName);
  const key      = `media/${folderPrefix}${Date.now()}-${safeName}`;
  const publicUrl = `${cfg.publicUrl}/${key}`;

  const body   = Buffer.from(await res.arrayBuffer());
  const client = new S3Client({
    region:   'auto',
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });

  await client.send(new PutObjectCommand({
    Bucket:      cfg.bucketName,
    Key:         key,
    Body:        body,
    ContentType: contentType,
  }));

  return NextResponse.json({
    key,
    url:          publicUrl,
    name:         safeName,
    size:         body.byteLength,
    lastModified: new Date(),
    contentType,
  });
}
