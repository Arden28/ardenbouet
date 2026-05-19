import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
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

export type MediaFolder = {
  prefix: string; // full R2 prefix, e.g. 'media/images/'
  name:   string; // display name, e.g. 'images'
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
  zip:  'application/zip',
  doc:  'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls:  'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt:  'text/plain',
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

/**
 * Lists files and virtual subfolders at a given prefix level.
 * Uses Delimiter '/' so it behaves like a directory listing.
 */
export async function listFolderContents(
  prefix: string,
  cfg: R2Config,
): Promise<{ files: MediaFile[]; folders: MediaFolder[] }> {
  const client = makeClient(cfg);
  const res = await client.send(new ListObjectsV2Command({
    Bucket:    cfg.bucketName,
    Prefix:    prefix,
    Delimiter: '/',
    MaxKeys:   1000,
  }));

  const files: MediaFile[] = (res.Contents ?? [])
    .filter(obj => !obj.Key!.endsWith('.keep'))
    .map(obj => ({
      key:          obj.Key!,
      url:          `${cfg.publicUrl}/${obj.Key}`,
      name:         obj.Key!.split('/').pop()!,
      size:         obj.Size ?? 0,
      lastModified: obj.LastModified ?? new Date(),
      contentType:  inferContentType(obj.Key!),
    }))
    .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

  const folders: MediaFolder[] = (res.CommonPrefixes ?? [])
    .filter(p => p.Prefix)
    .map(p => ({
      prefix: p.Prefix!,
      name:   p.Prefix!.slice(prefix.length).replace(/\/$/, ''),
    }));

  return { files, folders };
}

/** Creates an empty .keep sentinel object so the folder appears in listings. */
export async function createVirtualFolder(prefix: string, cfg: R2Config): Promise<void> {
  await makeClient(cfg).send(new PutObjectCommand({
    Bucket:      cfg.bucketName,
    Key:         `${prefix}.keep`,
    Body:        Buffer.from(''),
    ContentType: 'application/octet-stream',
  }));
}

export async function deleteMediaFile(key: string, cfg: R2Config): Promise<void> {
  await makeClient(cfg).send(new DeleteObjectCommand({ Bucket: cfg.bucketName, Key: key }));
}

export async function renameMediaFile(oldKey: string, newKey: string, cfg: R2Config): Promise<void> {
  const client = makeClient(cfg);
  await client.send(new CopyObjectCommand({
    Bucket:     cfg.bucketName,
    CopySource: `${cfg.bucketName}/${oldKey}`,
    Key:        newKey,
  }));
  await client.send(new DeleteObjectCommand({ Bucket: cfg.bucketName, Key: oldKey }));
}

export async function createUploadPresignedUrl(
  filename: string,
  contentType: string,
  cfg: R2Config,
  folderPrefix = '',
): Promise<{ signedUrl: string; publicUrl: string; key: string }> {
  const safe = sanitizeFilename(filename);
  const key  = `media/${folderPrefix}${Date.now()}-${safe}`;
  const client = makeClient(cfg);

  const cmd = new PutObjectCommand({
    Bucket:      cfg.bucketName,
    Key:         key,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(client, cmd, { expiresIn: 60 });
  return { signedUrl, publicUrl: `${cfg.publicUrl}/${key}`, key };
}
