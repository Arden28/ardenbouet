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

export type R2Config = {
  accountId:       string;
  accessKeyId:     string;
  secretAccessKey: string;
  bucketName:      string;
  publicUrl:       string;
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

function makeClient(cfg: R2Config): S3Client {
  return new S3Client({
    region:   'auto',
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    // R2 does not support AWS SDK v3 automatic checksums — disable them
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

/** Returns R2 config from environment variables, or null if incomplete. */
export function getEnvR2Config(): R2Config | null {
  const accountId       = process.env.R2_ACCOUNT_ID;
  const accessKeyId     = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName      = process.env.R2_BUCKET_NAME;
  const publicUrl       = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) return null;
  return { accountId, accessKeyId, secretAccessKey, bucketName, publicUrl };
}

/** Kept for backwards compatibility — true when env vars are fully set. */
export function isR2Configured(): boolean {
  return getEnvR2Config() !== null;
}

export async function listMediaFiles(cfg: R2Config): Promise<MediaFile[]> {
  const client = makeClient(cfg);
  const res = await client.send(
    new ListObjectsV2Command({ Bucket: cfg.bucketName, MaxKeys: 1000 }),
  );
  return (res.Contents ?? [])
    .map(obj => ({
      key:          obj.Key!,
      url:          `${cfg.publicUrl}/${obj.Key}`,
      name:         obj.Key!.split('/').pop()!,
      size:         obj.Size ?? 0,
      lastModified: obj.LastModified ?? new Date(),
      contentType:  inferContentType(obj.Key!),
    }))
    .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
}

export async function deleteMediaFile(key: string, cfg: R2Config): Promise<void> {
  await makeClient(cfg).send(new DeleteObjectCommand({ Bucket: cfg.bucketName, Key: key }));
}

export async function createUploadPresignedUrl(
  filename: string,
  contentType: string,
  cfg: R2Config,
): Promise<{ signedUrl: string; publicUrl: string; key: string }> {
  const safe = sanitizeFilename(filename);
  const key  = `media/${Date.now()}-${safe}`;
  const client = makeClient(cfg);

  const cmd = new PutObjectCommand({
    Bucket:      cfg.bucketName,
    Key:         key,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(client, cmd, { expiresIn: 60 });
  return { signedUrl, publicUrl: `${cfg.publicUrl}/${key}`, key };
}
