import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export type MediaFile = {
  key:          string;
  url:          string;
  name:         string;
  size:         number;
  lastModified: Date;
  contentType:  string;
};

const EXT_MAP: Record<string, string> = {
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  gif:  'image/gif',
  webp: 'image/webp',
  svg:  'image/svg+xml',
  avif: 'image/avif',
  mp4:  'video/mp4',
  webm: 'video/webm',
  mov:  'video/quicktime',
  pdf:  'application/pdf',
};

function inferContentType(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  return EXT_MAP[ext] ?? 'application/octet-stream';
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function makeClient() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKey = process.env.R2_ACCESS_KEY_ID;
  const secretKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKey || !secretKey) return null;
  return new S3Client({
    region:   'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });
}

const BUCKET     = process.env.R2_BUCKET_NAME   ?? '';
const PUBLIC_URL = (process.env.R2_PUBLIC_URL    ?? '').replace(/\/$/, '');

export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    BUCKET &&
    PUBLIC_URL
  );
}

export async function listMediaFiles(): Promise<MediaFile[]> {
  const client = makeClient();
  if (!client) return [];

  const res = await client.send(
    new ListObjectsV2Command({ Bucket: BUCKET, MaxKeys: 1000 }),
  );

  return (res.Contents ?? [])
    .map(obj => ({
      key:          obj.Key!,
      url:          `${PUBLIC_URL}/${obj.Key}`,
      name:         obj.Key!.split('/').pop()!,
      size:         obj.Size ?? 0,
      lastModified: obj.LastModified ?? new Date(),
      contentType:  inferContentType(obj.Key!),
    }))
    .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
}

export async function deleteMediaFile(key: string): Promise<void> {
  const client = makeClient();
  if (!client) throw new Error('R2 not configured');
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

export async function createUploadPresignedUrl(
  filename: string,
  contentType: string,
): Promise<{ signedUrl: string; publicUrl: string; key: string }> {
  const client = makeClient();
  if (!client) throw new Error('R2 not configured');

  const safe = sanitizeFilename(filename);
  const key  = `media/${Date.now()}-${safe}`;

  const cmd = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(client, cmd, { expiresIn: 60 });
  return { signedUrl, publicUrl: `${PUBLIC_URL}/${key}`, key };
}
