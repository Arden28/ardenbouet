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
// Accepts both R2_* and CLOUDFLARE_R2_* names. The account id can also come from the S3 API
// endpoint (https://<account-id>.r2.cloudflarestorage.com).
export function getEnvR2Config(): R2Config | null {
  const env = process.env;
  const endpoint        = env.CLOUDFLARE_R2_URL || env.CLOUDFLARE_R2_ENDPOINT || '';
  const accountId       = env.R2_ACCOUNT_ID || env.CLOUDFLARE_R2_ACCOUNT_ID || env.CLOUDFLARE_ACCOUNT_ID || env.CLOUDFARE_ACCOUNT_ID || endpoint.match(/^https:\/\/([a-f0-9]{32})\.r2\.cloudflarestorage\.com/)?.[1];
  const accessKeyId     = env.R2_ACCESS_KEY_ID || env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY || env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
  const bucketName      = env.R2_BUCKET_NAME || env.CLOUDFLARE_R2_BUCKET_NAME;
  const publicUrl       = (env.R2_PUBLIC_URL || env.CLOUDFLARE_R2_PUBLIC_URL || env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/$/, '');
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

/** Recursive, paginated search by file name under a prefix (default: the whole library). */
export async function searchMedia(query: string, cfg: R2Config, prefix = 'media/', limit = 200): Promise<MediaFile[]> {
  const client = makeClient(cfg);
  const q = query.trim().toLowerCase();
  const out: MediaFile[] = [];
  let token: string | undefined;
  do {
    const res = await client.send(new ListObjectsV2Command({ Bucket: cfg.bucketName, Prefix: prefix, ContinuationToken: token, MaxKeys: 1000 }));
    for (const obj of res.Contents ?? []) {
      const key = obj.Key!;
      if (key.endsWith('.keep')) continue;
      const name = key.split('/').pop()!;
      if (q && !name.toLowerCase().includes(q)) continue;
      out.push({ key, url: `${cfg.publicUrl}/${key}`, name, size: obj.Size ?? 0, lastModified: obj.LastModified ?? new Date(), contentType: inferContentType(key) });
      if (out.length >= limit) break;
    }
    token = out.length < limit && res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return out.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
}

/** Every file under a prefix (recursive), newest first — powers Recent, type views and the storage meter. */
export function listAllMedia(cfg: R2Config, prefix = 'media/', limit = 10000): Promise<MediaFile[]> {
  return searchMedia('', cfg, prefix, limit);
}

/** Server-side copy next to the original ("name (copy).ext"). Returns the new key. */
export async function copyMediaFile(key: string, cfg: R2Config): Promise<string> {
  const dir = key.slice(0, key.lastIndexOf('/') + 1);
  const name = key.slice(dir.length);
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  const newKey = `${dir}${base}_copy-${Date.now().toString(36)}${ext}`;
  await makeClient(cfg).send(new CopyObjectCommand({ Bucket: cfg.bucketName, CopySource: `${cfg.bucketName}/${key}`, Key: newKey }));
  return newKey;
}

/** Renames / moves a whole folder: copies every object to the new prefix, then deletes the old one. */
export async function renamePrefix(oldPrefix: string, newPrefix: string, cfg: R2Config): Promise<number> {
  const client = makeClient(cfg);
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const res = await client.send(new ListObjectsV2Command({ Bucket: cfg.bucketName, Prefix: oldPrefix, ContinuationToken: token, MaxKeys: 1000 }));
    for (const obj of res.Contents ?? []) keys.push(obj.Key!);
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  for (const k of keys) {
    await client.send(new CopyObjectCommand({ Bucket: cfg.bucketName, CopySource: `${cfg.bucketName}/${k}`, Key: newPrefix + k.slice(oldPrefix.length) }));
  }
  for (const k of keys) await client.send(new DeleteObjectCommand({ Bucket: cfg.bucketName, Key: k }));
  if (!keys.length) await createVirtualFolder(newPrefix, cfg);
  return keys.length;
}

/** Deletes every object under a prefix (a folder and all its subfolders). Returns the count. */
export async function deletePrefix(prefix: string, cfg: R2Config): Promise<number> {
  const client = makeClient(cfg);
  let token: string | undefined;
  let count = 0;
  do {
    const res = await client.send(new ListObjectsV2Command({ Bucket: cfg.bucketName, Prefix: prefix, ContinuationToken: token, MaxKeys: 1000 }));
    for (const obj of res.Contents ?? []) {
      await client.send(new DeleteObjectCommand({ Bucket: cfg.bucketName, Key: obj.Key! }));
      count++;
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return count;
}
