'use client';
// Client for the admin media API (/api/admin/media*). Keys always live under "media/".

export type MediaItem = {
  key: string;
  url: string;
  name: string;
  size: number;
  lastModified: string;
  contentType: string;
};
export type MediaFolderItem = { prefix: string; name: string };
export type MediaKind = 'image' | 'video' | 'audio' | 'document' | 'other';

export const ROOT = 'media/';

export function kindOf(ct: string, name = ''): MediaKind {
  if (ct.startsWith('image/') || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(name)) return 'image';
  if (ct.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(name)) return 'video';
  if (ct.startsWith('audio/')) return 'audio';
  if (/pdf|word|excel|sheet|presentation|text|zip|msword/.test(ct) || /\.(pdf|docx?|xlsx?|pptx?|txt|zip|csv)$/i.test(name)) return 'document';
  return 'other';
}

export function matchesAccept(item: { contentType: string; name: string }, accept?: string): boolean {
  if (!accept || accept === '*' || accept === '*/*') return true;
  return accept.split(',').some(a => {
    const t = a.trim();
    if (t.endsWith('/*')) return item.contentType.startsWith(t.slice(0, -1)) || kindOf(item.contentType, item.name) === t.slice(0, -2);
    if (t.startsWith('.')) return item.name.toLowerCase().endsWith(t.toLowerCase());
    return item.contentType === t;
  });
}

export function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  return `${(b / 1024 ** 3).toFixed(2)} GB`;
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status });
  return data as T;
}

export const mediaApi = {
  list: (prefix: string) =>
    call<{ files: MediaItem[]; folders: MediaFolderItem[] }>(`/api/admin/media?prefix=${encodeURIComponent(prefix)}`),
  search: (q: string) =>
    call<{ files: MediaItem[] }>(`/api/admin/media?prefix=${encodeURIComponent(ROOT)}&search=${encodeURIComponent(q)}`),
  /** Every file in the library (recursive). */
  all: () => call<{ files: MediaItem[] }>(`/api/admin/media?prefix=${encodeURIComponent(ROOT)}&all=1`),
  usage: () => call<{ usage: Record<string, string[]> }>('/api/admin/media/usage'),
  copy: (key: string) => call<{ key: string; url: string }>('/api/admin/media', { method: 'POST', body: JSON.stringify({ action: 'copy', key }) }),
  /** Rename or move a folder (and everything inside it). */
  moveFolder: (oldPrefix: string, newPrefix: string) =>
    call<{ moved: number }>('/api/admin/media', { method: 'PATCH', body: JSON.stringify({ oldPrefix, newPrefix }) }),
  createFolder: (prefix: string) =>
    call('/api/admin/media', { method: 'POST', body: JSON.stringify({ action: 'createFolder', prefix }) }),
  remove: (keys: string[]) => call('/api/admin/media', { method: 'DELETE', body: JSON.stringify({ keys }) }),
  removeFolder: (prefix: string) =>
    call<{ deleted: number }>('/api/admin/media', { method: 'DELETE', body: JSON.stringify({ prefix }) }),
  /** Rename in place (newName) or move (newKey). */
  rename: (oldKey: string, newName: string) =>
    call('/api/admin/media', { method: 'PATCH', body: JSON.stringify({ oldKey, newName }) }),
  move: (oldKey: string, newKey: string) =>
    call('/api/admin/media', { method: 'PATCH', body: JSON.stringify({ oldKey, newKey }) }),
  importUrl: (url: string, folder: string) =>
    call<{ url?: string; key?: string }>('/api/admin/media/import', { method: 'POST', body: JSON.stringify({ url, folder }) }),

  /** Presign + PUT with progress. `prefix` is the destination folder ("media/blog/"). */
  async upload(file: File, prefix: string, onProgress?: (pct: number) => void): Promise<MediaItem> {
    const folder = prefix.replace(/^media\//, '').replace(/\/$/, '');
    const { signedUrl, publicUrl, key } = await call<{ signedUrl: string; publicUrl: string; key: string }>('/api/admin/media/upload', {
      method: 'POST',
      body: JSON.stringify({ filename: file.name || 'file', contentType: file.type || 'application/octet-stream', folder: folder || undefined }),
    });
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', signedUrl);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
      xhr.onerror = () => reject(new Error('Network error during upload, check the bucket CORS settings'));
      xhr.send(file);
    });
    return {
      key, url: publicUrl, name: key.split('/').pop() ?? file.name, size: file.size,
      lastModified: new Date().toISOString(), contentType: file.type || 'application/octet-stream',
    };
  },
};

export function parentPrefix(prefix: string) {
  const parts = prefix.replace(/\/$/, '').split('/');
  return parts.length <= 1 ? ROOT : `${parts.slice(0, -1).join('/')}/`;
}

/** Uploaded files carry a "1712345678901-" timestamp prefix; hide it in the UI. */
export const displayName = (name: string) => name.replace(/^\d{13}-/, '');

export const folderOf = (key: string) => key.slice(0, key.lastIndexOf('/') + 1);

export function crumbs(prefix: string): { label: string; prefix: string }[] {
  const parts = prefix.replace(/^media\//, '').split('/').filter(Boolean);
  return [{ label: 'Library', prefix: ROOT }, ...parts.map((p, i) => ({ label: p, prefix: `${ROOT}${parts.slice(0, i + 1).join('/')}/` }))];
}
