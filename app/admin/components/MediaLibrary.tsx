'use client';

import {
  useCallback, useEffect, useRef, useState, useMemo,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check, Copy, ImageIcon, FileVideo, File as FileIcon, Trash2, Upload,
  AlertCircle, Loader2, ChevronLeft, ChevronRight, X,
  ArrowUpDown, FolderOpen, Link2, CheckSquare, Square,
} from 'lucide-react';
import type { MediaFile } from '@/lib/r2';

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterKind = 'all' | 'image' | 'video' | 'other';
type SortBy     = 'date-desc' | 'date-asc' | 'name' | 'size';

interface UploadEntry {
  id:       string;
  filename: string;
  progress: number;
  error?:   string;
}

const PRESET_FOLDERS = ['images', 'videos', 'docs', 'misc'];
const EXPO = [0.16, 1, 0.3, 1] as const;

// ─── Utilities ────────────────────────────────────────────────────────────────
function formatBytes(b: number) {
  if (b < 1024)        return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function getKind(ct: string): FilterKind {
  if (ct.startsWith('image/')) return 'image';
  if (ct.startsWith('video/')) return 'video';
  return 'other';
}

function sortFiles(files: MediaFile[], by: SortBy): MediaFile[] {
  const arr = [...files];
  if (by === 'date-desc') arr.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
  if (by === 'date-asc')  arr.sort((a, b) => new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime());
  if (by === 'name')      arr.sort((a, b) => a.name.localeCompare(b.name));
  if (by === 'size')      arr.sort((a, b) => b.size - a.size);
  return arr;
}

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1920;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width);  width = MAX; }
        else                { width  = Math.round(width  * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        if (!blob) { resolve(file); return; }
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

// ─── Preview Modal ────────────────────────────────────────────────────────────
function PreviewModal({
  file, files, onClose, onSelect,
}: {
  file:     MediaFile;
  files:    MediaFile[];
  onClose:  () => void;
  onSelect?: (url: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const idx  = files.findIndex(f => f.key === file.key);
  const prev = files[idx - 1] ?? null;
  const next = files[idx + 1] ?? null;

  const [current, setCurrent] = useState(file);
  useEffect(() => setCurrent(file), [file]);

  const go = (f: MediaFile | null) => { if (f) setCurrent(f); };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowLeft')   go(files[files.findIndex(f => f.key === current.key) - 1] ?? null);
      if (e.key === 'ArrowRight')  go(files[files.findIndex(f => f.key === current.key) + 1] ?? null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [current, files, onClose]);

  const copy = async () => {
    await navigator.clipboard.writeText(current.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const curIdx = files.findIndex(f => f.key === current.key);
  const curPrev = files[curIdx - 1] ?? null;
  const curNext = files[curIdx + 1] ?? null;
  const kind = getKind(current.contentType);

  return (
    <AnimatePresence>
      <motion.div
        key="preview-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-zinc-900/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        key="preview-panel"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: EXPO }}
        className="fixed inset-0 z-[71] flex items-center justify-center p-4 sm:p-8"
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="flex w-full max-w-4xl flex-col bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-hidden max-h-[90vh]"
          style={{ pointerEvents: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 gap-3">
            <p className="font-mono text-xs text-zinc-900 dark:text-zinc-100 truncate flex-1">{current.name}</p>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-[10px] text-zinc-400">{formatBytes(current.size)}</span>
              <span className="font-mono text-[10px] text-zinc-400">{current.contentType}</span>
              <button type="button" onClick={onClose} className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Media */}
          <div className="relative flex-1 min-h-0 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
            {kind === 'image' && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.url} alt={current.name} className="max-h-[60vh] max-w-full object-contain" />
            )}
            {kind === 'video' && (
              <video src={current.url} controls className="max-h-[60vh] max-w-full" />
            )}
            {kind === 'other' && (
              <div className="flex flex-col items-center gap-3 text-zinc-400">
                <FileIcon className="h-12 w-12" />
                <p className="font-mono text-[10px] uppercase tracking-widest">{current.contentType}</p>
              </div>
            )}

            {/* Prev/Next */}
            {curPrev && (
              <button type="button" onClick={() => go(curPrev)}
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {curNext && (
              <button type="button" onClick={() => go(curNext)}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-200 dark:border-zinc-800 px-4 py-3">
            <p className="font-mono text-[10px] text-zinc-400 truncate flex-1">{current.url}</p>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={copy}
                className="flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-zinc-500 hover:border-zinc-900 dark:hover:border-zinc-100 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy URL'}
              </button>
              {onSelect && (
                <button type="button" onClick={() => { onSelect(current.url); onClose(); }}
                  className="flex items-center gap-1.5 bg-zinc-900 dark:bg-zinc-100 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors">
                  Select
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── File Card ────────────────────────────────────────────────────────────────
function FileCard({
  file, pickerMode, isUsed, isSelected,
  onSelect, onCopy, onDelete, onPreview, onToggleSelect, onRename,
}: {
  file:          MediaFile;
  pickerMode:    boolean;
  isUsed:        boolean;
  isSelected:    boolean;
  onSelect:      (url: string) => void;
  onCopy:        (url: string) => void;
  onDelete:      (key: string) => void;
  onPreview:     (file: MediaFile) => void;
  onToggleSelect:(key: string) => void;
  onRename:      (key: string, newName: string) => void;
}) {
  const [copied,   setCopied]   = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameVal,  setNameVal]  = useState(file.name);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const kind = getKind(file.contentType);

  const handleCopy = async () => {
    await onCopy(file.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const commitRename = () => {
    setRenaming(false);
    if (nameVal.trim() && nameVal !== file.name) onRename(file.key, nameVal.trim());
    else setNameVal(file.name);
  };

  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  return (
    <div className={[
      'group relative flex flex-col border transition-colors duration-150',
      isSelected
        ? 'border-[#2467AC]'
        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600',
    ].join(' ')}>

      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggleSelect(file.key)}
        className={[
          'absolute left-1.5 top-1.5 z-10 transition-opacity duration-150',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        ].join(' ')}
      >
        {isSelected
          ? <CheckSquare className="h-4 w-4 text-[#2467AC]" />
          : <Square className="h-4 w-4 text-white drop-shadow" />}
      </button>

      {/* In-use badge */}
      {isUsed && (
        <span className="absolute right-1.5 top-1.5 z-10 bg-emerald-500 px-1 py-0.5 font-mono text-[8px] uppercase tracking-widest text-white">
          In use
        </span>
      )}

      {/* Thumbnail */}
      <button
        type="button"
        onClick={() => onPreview(file)}
        className="aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center"
      >
        {kind === 'image' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={file.url} alt={file.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        )}
        {kind === 'video' && (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            ref={videoRef}
            src={file.url}
            muted loop playsInline
            className="h-full w-full object-cover"
            onMouseEnter={() => videoRef.current?.play()}
            onMouseLeave={() => { videoRef.current?.pause(); if (videoRef.current) videoRef.current.currentTime = 0; }}
          />
        )}
        {kind === 'other' && (
          <FileIcon className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
        )}
      </button>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-2">
        {renaming ? (
          <input
            ref={inputRef}
            value={nameVal}
            onChange={e => setNameVal(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setRenaming(false); setNameVal(file.name); } }}
            className="w-full bg-transparent font-mono text-[10px] text-zinc-900 dark:text-zinc-100 outline-none border-b border-[#2467AC]"
          />
        ) : (
          <p
            className="truncate font-mono text-[10px] text-zinc-700 dark:text-zinc-300 cursor-text"
            title={`Double-click to rename\n${file.name}`}
            onDoubleClick={() => setRenaming(true)}
          >
            {file.name}
          </p>
        )}
        <p className="font-mono text-[9px] text-zinc-400 dark:text-zinc-600">{formatBytes(file.size)}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 border-t border-zinc-100 dark:border-zinc-900 px-2 py-1.5">
        {pickerMode ? (
          <button type="button" onClick={() => onSelect(file.url)}
            className="flex-1 bg-zinc-900 dark:bg-zinc-100 py-1 font-mono text-[9px] uppercase tracking-widest text-white dark:text-zinc-900 hover:bg-zinc-700 transition-colors text-center">
            Select
          </button>
        ) : (
          <button type="button" onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-1 py-1 font-mono text-[9px] uppercase tracking-widest text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
        <button type="button" onClick={() => onDelete(file.key)}
          className="p-1 text-zinc-300 dark:text-zinc-700 hover:text-red-500 transition-colors">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────
function DropZone({
  onFiles, folder, onFolderChange,
}: {
  onFiles:        (files: File[]) => void;
  folder:         string;
  onFolderChange: (f: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  };

  const handleNewFolder = () => {
    const name = window.prompt('Folder name (e.g. screenshots):')?.trim().replace(/[^a-zA-Z0-9_-]/g, '');
    if (name) onFolderChange(name);
  };

  return (
    <div className="space-y-2">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={[
          'flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed py-6 transition-colors duration-150',
          dragging
            ? 'border-[#2467AC] bg-blue-50/50 dark:bg-blue-950/20'
            : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-500',
        ].join(' ')}
      >
        <Upload className="h-5 w-5 text-zinc-400" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          Drop files or click to upload
        </p>
        <input ref={inputRef} type="file" multiple hidden onChange={e => { if (e.target.files?.length) { onFiles(Array.from(e.target.files)); e.target.value = ''; } }} />
      </div>

      {/* Folder picker */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <FolderOpen className="h-3 w-3 text-zinc-400 shrink-0" />
        {['', ...PRESET_FOLDERS].map(f => (
          <button key={f || 'root'} type="button"
            onClick={() => onFolderChange(f)}
            className={[
              'border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest transition-colors',
              folder === f
                ? 'border-[#2467AC] text-[#2467AC]'
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-zinc-500',
            ].join(' ')}>
            {f || 'root'}
          </button>
        ))}
        <button type="button" onClick={handleNewFolder}
          className="border border-dashed border-zinc-300 dark:border-zinc-700 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-400 hover:border-zinc-500 transition-colors">
          + new
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MediaLibrary({
  onSelect, usedUrls,
}: {
  onSelect?:  (url: string) => void;
  usedUrls?:  Set<string>;
}) {
  const pickerMode = !!onSelect;

  const [files,     setFiles]     = useState<MediaFile[]>([]);
  const [uploads,   setUploads]   = useState<UploadEntry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [r2Ok,      setR2Ok]      = useState<boolean | null>(null);
  const [filter,    setFilter]    = useState<FilterKind>('all');
  const [search,    setSearch]    = useState('');
  const [sortBy,    setSortBy]    = useState<SortBy>('date-desc');
  const [selected,  setSelected]  = useState<Set<string>>(new Set());
  const [preview,   setPreview]   = useState<MediaFile | null>(null);
  const [folder,    setFolder]    = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/media')
      .then(r => {
        if (r.status === 503) { setR2Ok(false); return []; }
        if (!r.ok) throw new Error(`${r.status}`);
        setR2Ok(true);
        return r.json();
      })
      .then((data: MediaFile[]) => setFiles(Array.isArray(data) ? data : []))
      .catch(() => setR2Ok(false))
      .finally(() => setLoading(false));
  }, []);

  // ── Clipboard paste ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) { e.preventDefault(); handleFiles(files); }
    };
    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder]);

  // ── Upload ────────────────────────────────────────────────────────────────
  const uploadFile = useCallback(async (file: File, uploadFolder: string): Promise<MediaFile | null> => {
    const compressed = await compressImage(file);
    const id = Math.random().toString(36).slice(2);
    setUploads(u => [...u, { id, filename: compressed.name, progress: 0 }]);

    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ filename: compressed.name, contentType: compressed.type, folder: uploadFolder }),
      });
      if (!res.ok) throw new Error('Presign failed');
      const { signedUrl, publicUrl, key } = await res.json();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedUrl);
        xhr.setRequestHeader('Content-Type', compressed.type);
        xhr.upload.onprogress = e => {
          if (e.lengthComputable) {
            setUploads(u => u.map(x => x.id === id ? { ...x, progress: Math.round(e.loaded / e.total * 100) } : x));
          }
        };
        xhr.onload  = () => xhr.status < 300 ? resolve() : reject(new Error(`R2 ${xhr.status}`));
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(compressed);
      });

      const newFile: MediaFile = {
        key, url: publicUrl, name: compressed.name,
        size: compressed.size, lastModified: new Date(), contentType: compressed.type,
      };
      setUploads(u => u.filter(x => x.id !== id));
      return newFile;
    } catch (err: any) {
      setUploads(u => u.map(x => x.id === id ? { ...x, error: err.message } : x));
      setTimeout(() => setUploads(u => u.filter(x => x.id !== id)), 3000);
      return null;
    }
  }, []);

  const handleFiles = useCallback(async (incoming: File[]) => {
    for (const file of incoming) {
      const result = await uploadFile(file, folder);
      if (result) setFiles(f => [result, ...f]);
    }
  }, [uploadFile, folder]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteFile = async (key: string) => {
    if (!confirm('Delete this file?')) return;
    setFiles(f => f.filter(x => x.key !== key));
    setSelected(s => { const n = new Set(s); n.delete(key); return n; });
    await fetch('/api/admin/media', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key }),
    });
  };

  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} file${selected.size > 1 ? 's' : ''}?`)) return;
    const keys = Array.from(selected);
    setFiles(f => f.filter(x => !keys.includes(x.key)));
    setSelected(new Set());
    await Promise.all(keys.map(key => fetch('/api/admin/media', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key }),
    })));
  };

  // ── Rename ────────────────────────────────────────────────────────────────
  const renameFile = async (oldKey: string, newName: string) => {
    const res = await fetch('/api/admin/media', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ oldKey, newName }),
    });
    if (!res.ok) return;
    const { newKey, newUrl } = await res.json();
    setFiles(f => f.map(x => x.key === oldKey ? { ...x, key: newKey, url: newUrl, name: newName } : x));
  };

  // ── URL Import ────────────────────────────────────────────────────────────
  const importFromUrl = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    try {
      const res = await fetch('/api/admin/media/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: importUrl.trim(), folder }),
      });
      if (!res.ok) { const b = await res.json(); alert(b.error ?? 'Import failed'); return; }
      const file: MediaFile = await res.json();
      setFiles(f => [file, ...f]);
      setImportUrl('');
    } finally {
      setImporting(false);
    }
  };

  // ── Copy ──────────────────────────────────────────────────────────────────
  const copyUrl = async (url: string) => { await navigator.clipboard.writeText(url); };

  // ── Derived state ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortFiles(
      files.filter(f => {
        if (filter !== 'all' && getKind(f.contentType) !== filter) return false;
        if (q && !f.name.toLowerCase().includes(q)) return false;
        return true;
      }),
      sortBy,
    );
  }, [files, filter, search, sortBy]);

  const counts = useMemo(() => ({
    all:   files.length,
    image: files.filter(f => getKind(f.contentType) === 'image').length,
    video: files.filter(f => getKind(f.contentType) === 'video').length,
    other: files.filter(f => getKind(f.contentType) === 'other').length,
  }), [files]);

  const totalSize = useMemo(() => files.reduce((s, f) => s + f.size, 0), [files]);

  const toggleSelect = (key: string) =>
    setSelected(s => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const selectAll   = () => setSelected(new Set(filtered.map(f => f.key)));
  const deselectAll = () => setSelected(new Set());

  // ── R2 not configured ─────────────────────────────────────────────────────
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

      {/* ── Header (library mode only) ──────────────────────────────────── */}
      {!pickerMode && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="h-4 w-4 text-zinc-400" />
            <h2 className="font-heading text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50">
              Media Library
            </h2>
            {r2Ok !== null && (
              <span className={`h-2 w-2 rounded-full ${r2Ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
            )}
          </div>
          {!loading && (
            <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
              <span>{formatBytes(totalSize)} total</span>
              <span>{counts.image} images</span>
              {counts.video > 0 && <span>{counts.video} videos</span>}
              {counts.other > 0 && <span>{counts.other} other</span>}
            </div>
          )}
        </div>
      )}

      {/* ── Drop zone ──────────────────────────────────────────────────── */}
      <DropZone onFiles={handleFiles} folder={folder} onFolderChange={setFolder} />

      {/* ── URL Import ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        <input
          type="url"
          value={importUrl}
          onChange={e => setImportUrl(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') importFromUrl(); }}
          placeholder="Paste an external URL to import…"
          className="flex-1 border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-1.5 font-mono text-[10px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
        />
        <button
          type="button"
          onClick={importFromUrl}
          disabled={!importUrl.trim() || importing}
          className="flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-zinc-500 hover:border-zinc-900 dark:hover:border-zinc-100 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          {importing ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Import
        </button>
      </div>

      {/* ── Upload progress ─────────────────────────────────────────────── */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map(u => (
            <div key={u.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 truncate max-w-[60%]">{u.filename}</span>
                {u.error
                  ? <span className="font-mono text-[10px] text-red-500">{u.error}</span>
                  : <span className="font-mono text-[10px] text-zinc-400">{u.progress}%</span>
                }
              </div>
              {!u.error && (
                <div className="h-0.5 w-full bg-zinc-100 dark:bg-zinc-800">
                  <div className="h-full bg-[#2467AC] transition-all duration-200" style={{ width: `${u.progress}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Filters + Sort ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filter chips */}
        {(['all', 'image', 'video', 'other'] as const).map(k => {
          const Icon = k === 'image' ? ImageIcon : k === 'video' ? FileVideo : k === 'other' ? FileIcon : null;
          return (
            <button key={k} type="button" onClick={() => setFilter(k)}
              className={[
                'flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest transition-colors',
                filter === k
                  ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-50'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-500',
              ].join(' ')}>
              {Icon && <Icon className="h-3 w-3" />}
              {k} ({counts[k]})
            </button>
          );
        })}

        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search…"
          className="ml-auto border border-zinc-200 dark:border-zinc-800 bg-transparent px-2.5 py-1 font-mono text-[9px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
        />

        {/* Sort */}
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-3 w-3 text-zinc-400" />
          {([
            ['date-desc', 'Newest'],
            ['date-asc',  'Oldest'],
            ['name',      'Name'],
            ['size',      'Size'],
          ] as [SortBy, string][]).map(([val, label]) => (
            <button key={val} type="button" onClick={() => setSortBy(val)}
              className={[
                'border px-2 py-1 font-mono text-[9px] uppercase tracking-widest transition-colors',
                sortBy === val
                  ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-50'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-500',
              ].join(' ')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-video animate-pulse bg-zinc-100 dark:bg-zinc-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
          {files.length === 0 ? 'No files yet — drop something above' : 'No files match'}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
          <AnimatePresence mode="popLayout">
            {filtered.map(file => (
              <motion.div
                key={file.key}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <FileCard
                  file={file}
                  pickerMode={pickerMode}
                  isUsed={usedUrls?.has(file.url) ?? false}
                  isSelected={selected.has(file.key)}
                  onSelect={onSelect ?? (() => {})}
                  onCopy={copyUrl}
                  onDelete={deleteFile}
                  onPreview={setPreview}
                  onToggleSelect={toggleSelect}
                  onRename={renameFile}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Bulk action bar ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.2, ease: EXPO }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 shadow-lg"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              {selected.size} selected
            </span>
            <button type="button" onClick={selectAll}
              className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
              All
            </button>
            <button type="button" onClick={deselectAll}
              className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
              None
            </button>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
            <button type="button" onClick={bulkDelete}
              className="font-mono text-[9px] uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors">
              Delete {selected.size}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Preview modal ────────────────────────────────────────────────── */}
      {preview && (
        <PreviewModal
          file={preview}
          files={filtered}
          onClose={() => setPreview(null)}
          onSelect={onSelect}
        />
      )}
    </div>
  );
}
