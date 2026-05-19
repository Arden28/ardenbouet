'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, ImageIcon, FileVideo, File, Trash2, Upload, AlertCircle, Loader2 } from 'lucide-react';
import type { MediaFile } from '@/lib/r2';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type MediaKind = 'image' | 'video' | 'other';

function getKind(contentType: string): MediaKind {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  return 'other';
}

// ─── Upload via XHR (for progress tracking) ───────────────────────────────────

type UploadEntry = { id: string; name: string; progress: number; error?: string };

async function uploadFile(
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ publicUrl: string; key: string; contentType: string }> {
  const presignRes = await fetch('/api/admin/media/upload', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ filename: file.name, contentType: file.type || 'application/octet-stream' }),
  });

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({}));
    throw new Error(err.error ?? `Presign failed (${presignRes.status})`);
  }

  const { signedUrl, publicUrl, key } = await presignRes.json();

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload  = () => xhr.status < 300 ? resolve() : reject(new Error(`R2 upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(file);
  });

  return { publicUrl, key, contentType: file.type || 'application/octet-stream' };
}

// ─── File card ────────────────────────────────────────────────────────────────

function FileCard({
  file, onDelete, onSelect, pickerMode,
}: {
  file: MediaFile;
  onDelete: (key: string) => void;
  onSelect?: (url: string) => void;
  pickerMode: boolean;
}) {
  const [copied,   setCopied]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const kind = getKind(file.contentType);

  const handleCopy = () => {
    navigator.clipboard.writeText(file.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch('/api/admin/media', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ key: file.key }),
      });
      onDelete(file.key);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="group relative flex flex-col border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
        {kind === 'image' ? (
          <img
            src={file.url}
            alt={file.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : kind === 'video' ? (
          <FileVideo className="h-8 w-8 text-zinc-400" />
        ) : (
          <File className="h-8 w-8 text-zinc-400" />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-zinc-900/0 group-hover:bg-zinc-900/40 transition-colors duration-150" />

        {/* Delete button */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-red-700 disabled:opacity-50"
          title="Delete"
        >
          {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        </button>
      </div>

      {/* Meta */}
      <div className="px-2.5 py-2 flex-1 min-w-0">
        <p className="truncate font-mono text-[10px] text-zinc-700 dark:text-zinc-300" title={file.name}>
          {file.name}
        </p>
        <p className="font-mono text-[9px] text-zinc-400 dark:text-zinc-600 mt-0.5">
          {formatBytes(file.size)}
        </p>
      </div>

      {/* Action */}
      <div className="px-2.5 pb-2.5">
        {pickerMode ? (
          <button
            type="button"
            onClick={() => onSelect?.(file.url)}
            className="w-full bg-zinc-900 dark:bg-zinc-50 px-2 py-1.5 font-mono text-[9px] uppercase tracking-widest text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            Select
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center justify-center gap-1.5 border border-zinc-200 dark:border-zinc-700 px-2 py-1.5 font-mono text-[9px] uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-100 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy URL'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Drop zone ────────────────────────────────────────────────────────────────

function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={[
        'flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed py-8 transition-colors duration-150',
        dragging
          ? 'border-[#2467AC] bg-blue-50/50 dark:bg-blue-950/20'
          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600',
      ].join(' ')}
    >
      <Upload className={`h-6 w-6 ${dragging ? 'text-[#2467AC]' : 'text-zinc-400'}`} />
      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
        Drop files here or <span className="text-zinc-900 dark:text-zinc-100">click to upload</span>
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept="image/*,video/*,application/pdf"
        onChange={e => { const f = Array.from(e.target.files ?? []); if (f.length) onFiles(f); e.target.value = ''; }}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface MediaLibraryProps {
  onSelect?: (url: string) => void;
}

type FilterKind = 'all' | 'image' | 'video' | 'other';

export default function MediaLibrary({ onSelect }: MediaLibraryProps) {
  const pickerMode = !!onSelect;

  const [files,   setFiles]   = useState<MediaFile[]>([]);
  const [uploads, setUploads] = useState<UploadEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [r2Ok,    setR2Ok]    = useState<boolean | null>(null);
  const [filter,  setFilter]  = useState<FilterKind>('all');
  const [search,  setSearch]  = useState('');

  // ── Fetch file list ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/media')
      .then(r => {
        if (r.status === 503) { setR2Ok(false); return []; }
        if (!r.ok) throw new Error(`${r.status}`);
        setR2Ok(true);
        return r.json();
      })
      .then(setFiles)
      .catch(() => setR2Ok(false))
      .finally(() => setLoading(false));
  }, []);

  // ── Upload handler ──────────────────────────────────────────────────────────
  const handleFiles = useCallback(async (incoming: File[]) => {
    for (const file of incoming) {
      const id: string = `${Date.now()}-${Math.random()}`;
      setUploads(u => [...u, { id, name: file.name, progress: 0 }]);

      try {
        const { publicUrl, key, contentType } = await uploadFile(
          file,
          pct => setUploads(u => u.map(x => x.id === id ? { ...x, progress: pct } : x)),
        );
        // Optimistic prepend
        setFiles(f => [{
          key,
          url:          publicUrl,
          name:         file.name,
          size:         file.size,
          lastModified: new Date(),
          contentType,
        }, ...f]);
      } catch (err) {
        setUploads(u => u.map(x => x.id === id
          ? { ...x, error: err instanceof Error ? err.message : 'Upload failed' }
          : x,
        ));
        continue;
      }

      // Remove completed upload entry after brief delay
      setTimeout(() => setUploads(u => u.filter(x => x.id !== id)), 1200);
    }
  }, []);

  // ── Filtered view ───────────────────────────────────────────────────────────
  const visible = files.filter(f => {
    if (filter !== 'all' && getKind(f.contentType) !== filter) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts: Record<FilterKind, number> = {
    all:   files.length,
    image: files.filter(f => getKind(f.contentType) === 'image').length,
    video: files.filter(f => getKind(f.contentType) === 'video').length,
    other: files.filter(f => getKind(f.contentType) === 'other').length,
  };

  // ── R2 not configured banner ────────────────────────────────────────────────
  if (!loading && r2Ok === false) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <AlertCircle className="h-8 w-8 text-amber-500" />
        <div>
          <p className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-50">Storage not configured</p>
          <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            Add your Cloudflare R2 credentials in{' '}
            <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100">Settings → Media Storage</span>
            {' '}or via environment variables.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      {!pickerMode && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="h-4 w-4 text-zinc-400" />
            <h2 className="font-heading text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              Media Library
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {r2Ok !== null && (
              <span className={`h-2 w-2 rounded-full ${r2Ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
            )}
            {!loading && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                {files.length} {files.length === 1 ? 'file' : 'files'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Drop zone ──────────────────────────────────────────────────── */}
      <DropZone onFiles={handleFiles} />

      {/* ── Upload progress ────────────────────────────────────────────── */}
      {uploads.length > 0 && (
        <div className="flex flex-col gap-2">
          {uploads.map(u => (
            <div key={u.id} className="border border-zinc-200 dark:border-zinc-800 px-3 py-2">
              <div className="flex items-center justify-between">
                <p className="truncate font-mono text-[10px] text-zinc-700 dark:text-zinc-300">{u.name}</p>
                {u.error
                  ? <span className="font-mono text-[9px] text-red-500">{u.error}</span>
                  : <span className="font-mono text-[9px] text-zinc-400">{u.progress}%</span>
                }
              </div>
              {!u.error && (
                <div className="mt-1.5 h-0.5 w-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full bg-[#2467AC] transition-all duration-150"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Filters + search ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'image', 'video', 'other'] as FilterKind[]).map(k => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={[
              'border px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest transition-colors',
              filter === k
                ? 'border-zinc-900 dark:border-zinc-50 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900'
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-500 hover:border-zinc-500',
            ].join(' ')}
          >
            {k} ({counts[k]})
          </button>
        ))}

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search files…"
          className="ml-auto border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1 font-mono text-[10px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-900 dark:focus:border-zinc-100 focus:outline-none transition-colors"
        />
      </div>

      {/* ── Loading skeleton ────────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse border border-zinc-100 dark:border-zinc-800">
              <div className="aspect-video bg-zinc-100 dark:bg-zinc-800" />
              <div className="p-2.5 space-y-1.5">
                <div className="h-2 w-3/4 bg-zinc-100 dark:bg-zinc-800" />
                <div className="h-2 w-1/2 bg-zinc-100 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── File grid ───────────────────────────────────────────────────── */}
      {!loading && visible.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
          {visible.map(f => (
            <FileCard
              key={f.key}
              file={f}
              pickerMode={pickerMode}
              onSelect={onSelect}
              onDelete={key => setFiles(prev => prev.filter(x => x.key !== key))}
            />
          ))}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {!loading && visible.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <ImageIcon className="h-8 w-8 text-zinc-200 dark:text-zinc-700" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            {search || filter !== 'all' ? 'No files match' : 'No files uploaded yet'}
          </p>
        </div>
      )}
    </div>
  );
}
