'use client';
// The admin file manager for the Cloudflare R2 bucket. Two modes:
//  - "manage": the Media page — browse, upload, organise, inspect usage, delete
//  - "pick":   inside MediaPicker — same browser, returns the chosen file(s)
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload, FolderPlus, Link2, Search, LayoutGrid, List as ListIcon, Folder, ChevronRight, X, Check, Copy, ExternalLink,
  Download, Trash2, FolderInput, Loader2, FileText, Film, Music, File as FileIcon, AlertCircle, Pencil, CloudOff, ArrowUpDown,
} from 'lucide-react';
import {
  ROOT, crumbs, formatBytes, kindOf, matchesAccept, mediaApi, parentPrefix,
  type MediaFolderItem, type MediaItem, type MediaKind,
} from './api';

type Mode = 'manage' | 'pick';
type Sort = 'newest' | 'oldest' | 'name' | 'size';
type Upload = { id: string; name: string; pct: number; status: 'uploading' | 'done' | 'error'; error?: string };

const KIND_FILTERS: { key: 'all' | MediaKind; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'image', label: 'Images' }, { key: 'video', label: 'Videos' },
  { key: 'document', label: 'Documents' }, { key: 'other', label: 'Other' },
];

const ext = (name: string) => (name.split('.').pop() ?? '').slice(0, 4).toUpperCase();
const dateLabel = (iso: string) => {
  const d = new Date(iso);
  const days = (Date.now() - d.getTime()) / 86_400_000;
  if (days < 1) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' });
};

function KindIcon({ kind, className = 'h-8 w-8' }: { kind: MediaKind; className?: string }) {
  const Icon = kind === 'video' ? Film : kind === 'audio' ? Music : kind === 'document' ? FileText : FileIcon;
  return <Icon className={className} strokeWidth={1.2} />;
}

function Thumb({ item, big = false }: { item: MediaItem; big?: boolean }) {
  const kind = kindOf(item.contentType, item.name);
  const [broken, setBroken] = useState(false);
  if (kind === 'image' && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.url}
        alt=""
        loading="lazy"
        draggable={false}
        onError={() => setBroken(true)}
        className={big ? 'max-h-[260px] w-full object-contain' : 'h-full w-full object-cover'}
      />
    );
  }
  if (kind === 'video' && big) return <video src={item.url} controls className="max-h-[260px] w-full bg-black" />;
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-[#9b9b9b]">
      {kind === 'video' ? <Film className="h-8 w-8" strokeWidth={1.2} /> : <KindIcon kind={kind} />}
      <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-[#6b6b6b] shadow-sm">{ext(item.name) || 'FILE'}</span>
    </div>
  );
}

// ─── Move dialog: browse folders, move here ──────────────────────────────────

function MoveDialog({ count, from, onClose, onMove }: { count: number; from: string; onClose: () => void; onMove: (prefix: string) => void }) {
  const [prefix, setPrefix] = useState(ROOT);
  const [folders, setFolders] = useState<MediaFolderItem[] | null>(null);
  useEffect(() => { setFolders(null); mediaApi.list(prefix).then(r => setFolders(r.folders)).catch(() => setFolders([])); }, [prefix]);
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/30 p-4" onMouseDown={onClose}>
      <div className="w-full max-w-[420px] overflow-hidden rounded-xl bg-white shadow-2xl" onMouseDown={e => e.stopPropagation()}>
        <div className="border-b border-[#f2f2f2] px-5 py-4">
          <h3 className="text-[15px] font-semibold text-[#242424]">Move {count} file{count > 1 ? 's' : ''}</h3>
          <nav className="mt-2 flex flex-wrap items-center gap-1 text-[13px] text-[#6b6b6b]">
            {crumbs(prefix).map((c, i, all) => (
              <span key={c.prefix} className="flex items-center gap-1">
                <button type="button" onClick={() => setPrefix(c.prefix)} className={i === all.length - 1 ? 'font-medium text-[#242424]' : 'hover:text-[#242424]'}>{c.label}</button>
                {i < all.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
              </span>
            ))}
          </nav>
        </div>
        <ul className="max-h-[300px] min-h-[160px] overflow-y-auto p-2">
          {folders === null && <li className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[#9b9b9b]" /></li>}
          {folders?.length === 0 && <li className="py-10 text-center text-[13px] text-[#9b9b9b]">No subfolders</li>}
          {folders?.map(f => (
            <li key={f.prefix}>
              <button type="button" onClick={() => setPrefix(f.prefix)} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[14px] text-[#242424] hover:bg-[#f6f6f6]">
                <Folder className="h-4 w-4 text-[#9b9b9b]" /> {f.name} <ChevronRight className="ml-auto h-4 w-4 text-[#c4c4c4]" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-end gap-2 border-t border-[#f2f2f2] px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-[14px] hover:bg-[#f2f2f2]">Cancel</button>
          <button type="button" disabled={prefix === from} onClick={() => onMove(prefix)} className="rounded-full bg-[#242424] px-4 py-2 text-[14px] text-white disabled:opacity-30">
            Move here
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Details panel ───────────────────────────────────────────────────────────

function Details({ item, usedIn, onClose, onRename, onDelete, onMove, readOnly }: {
  item: MediaItem; usedIn: string[]; onClose: () => void; onRename: (name: string) => void; onDelete: () => void; onMove: () => void; readOnly: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [dims, setDims] = useState<string>('');
  useEffect(() => { setName(item.name); setEditing(false); setDims(''); }, [item.key, item.name]);
  useEffect(() => {
    if (kindOf(item.contentType, item.name) !== 'image') return;
    const img = new Image();
    img.onload = () => setDims(`${img.naturalWidth} × ${img.naturalHeight}`);
    img.src = item.url;
  }, [item.url, item.contentType, item.name]);

  const copy = async () => { await navigator.clipboard.writeText(item.url).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1400); };
  const row = (k: string, v: React.ReactNode) => (
    <div className="flex justify-between gap-4 py-1.5 text-[13px]"><dt className="text-[#9b9b9b]">{k}</dt><dd className="truncate text-right text-[#242424]">{v}</dd></div>
  );

  return (
    <aside className="flex w-full flex-col border-l border-[#f2f2f2] bg-white lg:w-[320px]">
      <div className="flex items-center justify-between px-5 py-3">
        <span className="text-[13px] font-medium text-[#6b6b6b]">Details</span>
        <button type="button" onClick={onClose} className="rounded p-1 text-[#9b9b9b] hover:bg-[#f2f2f2] hover:text-[#242424]" aria-label="Close details"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div className="checker flex min-h-[160px] items-center justify-center overflow-hidden rounded-lg border border-[#f2f2f2]"><Thumb item={item} big /></div>

        {editing ? (
          <form className="mt-4 flex gap-2" onSubmit={e => { e.preventDefault(); if (name.trim() && name !== item.name) onRename(name.trim()); setEditing(false); }}>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} className="min-w-0 flex-1 rounded-md border border-[#e6e6e6] px-2.5 py-1.5 text-[14px] outline-none focus:border-[#242424]" />
            <button type="submit" className="rounded-md bg-[#242424] px-2.5 text-white" aria-label="Save name"><Check className="h-4 w-4" /></button>
          </form>
        ) : (
          <div className="mt-4 flex items-start gap-2">
            <p className="min-w-0 flex-1 break-all text-[15px] font-semibold leading-5 text-[#242424]">{item.name}</p>
            {!readOnly && <button type="button" onClick={() => setEditing(true)} className="rounded p-1 text-[#9b9b9b] hover:text-[#242424]" aria-label="Rename"><Pencil className="h-3.5 w-3.5" /></button>}
          </div>
        )}

        <button type="button" onClick={copy} className="mt-3 flex w-full items-center gap-2 rounded-md bg-[#f6f6f6] px-3 py-2 text-left text-[12px] text-[#6b6b6b] hover:bg-[#f2f2f2]">
          <span className="min-w-0 flex-1 truncate font-mono">{item.url}</span>
          {copied ? <Check className="h-3.5 w-3.5 text-[#1a8917]" /> : <Copy className="h-3.5 w-3.5" />}
        </button>

        <dl className="mt-4 divide-y divide-[#f6f6f6]">
          {row('Type', item.contentType)}
          {row('Size', formatBytes(item.size))}
          {dims && row('Dimensions', dims)}
          {row('Uploaded', new Date(item.lastModified).toLocaleString())}
          {row('Folder', '/' + item.key.replace(/^media\//, '').split('/').slice(0, -1).join('/'))}
        </dl>

        <div className="mt-4">
          <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-[#9b9b9b]">Used in</p>
          {usedIn.length ? (
            <ul className="mt-2 space-y-1">{usedIn.map(u => <li key={u} className="rounded bg-[#eef7ee] px-2 py-1 text-[12px] text-[#1a6b17]">{u}</li>)}</ul>
          ) : (
            <p className="mt-1 text-[13px] text-[#9b9b9b]">Not referenced anywhere on the site.</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-[#f2f2f2] p-4">
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-full border border-[#e6e6e6] py-2 text-[13px] hover:border-[#242424]"><ExternalLink className="h-3.5 w-3.5" /> Open</a>
        <a href={item.url} download={item.name} className="flex items-center justify-center gap-1.5 rounded-full border border-[#e6e6e6] py-2 text-[13px] hover:border-[#242424]"><Download className="h-3.5 w-3.5" /> Download</a>
        {!readOnly && (
          <>
            <button type="button" onClick={onMove} className="flex items-center justify-center gap-1.5 rounded-full border border-[#e6e6e6] py-2 text-[13px] hover:border-[#242424]"><FolderInput className="h-3.5 w-3.5" /> Move</button>
            <button
              type="button"
              onClick={() => { if (confirm(usedIn.length ? `“${item.name}” is used in ${usedIn.length} place(s). Delete anyway? Those pages will show a broken image.` : `Delete “${item.name}”?`)) onDelete(); }}
              className="flex items-center justify-center gap-1.5 rounded-full border border-[#f3d4d4] py-2 text-[13px] text-[#c94a4a] hover:bg-[#fdf1f1]"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function MediaLibrary({
  mode = 'manage', accept, multiple = false, onPick, onCancel, initialPrefix = ROOT,
}: {
  mode?: Mode;
  accept?: string;
  multiple?: boolean;
  onPick?: (items: MediaItem[]) => void;
  onCancel?: () => void;
  initialPrefix?: string;
}) {
  const picking = mode === 'pick';
  const [prefix, setPrefix] = useState(initialPrefix);
  const [files, setFiles] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<MediaFolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);
  const [q, setQ] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[] | null>(null);
  const [kind, setKind] = useState<'all' | MediaKind>(() => (accept?.startsWith('image') ? 'image' : accept?.startsWith('video') ? 'video' : 'all'));
  const [sort, setSort] = useState<Sort>('newest');
  const [view, setView] = useState<'grid' | 'list'>(() => {
    try { return (localStorage.getItem('media_view') as 'grid' | 'list') || 'grid'; } catch { return 'grid'; }
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [focus, setFocus] = useState<string | null>(null);
  const [usage, setUsage] = useState<Record<string, string[]>>({});
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [dropFolder, setDropFolder] = useState<string | null>(null);
  const [moving, setMoving] = useState<string[] | null>(null);
  const [newFolder, setNewFolder] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [busy, setBusy] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  useEffect(() => { try { localStorage.setItem('media_view', view); } catch { /* ignore */ } }, [view]);

  const load = useCallback(async (p = prefix) => {
    setLoading(true);
    setError(null);
    try {
      const r = await mediaApi.list(p);
      setFiles(r.files);
      setFolders(r.folders);
    } catch (e) {
      const err = e as Error & { status?: number };
      setError({ status: err.status, message: err.message });
      setFiles([]);
      setFolders([]);
    }
    setLoading(false);
  }, [prefix]);

  useEffect(() => { load(prefix); setSelected([]); setFocus(null); }, [prefix]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { mediaApi.usage().then(r => setUsage(r.usage)).catch(() => {}); }, []);

  // Debounced global search
  useEffect(() => {
    const term = q.trim();
    if (!term) { setSearchResults(null); return; }
    const id = setTimeout(() => {
      mediaApi.search(term).then(r => setSearchResults(r.files)).catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  const source = searchResults ?? files;
  const shown = useMemo(() => {
    const list = source.filter(f => (kind === 'all' || kindOf(f.contentType, f.name) === kind) && (!picking || matchesAccept(f, accept)));
    const by: Record<Sort, (a: MediaItem, b: MediaItem) => number> = {
      newest: (a, b) => +new Date(b.lastModified) - +new Date(a.lastModified),
      oldest: (a, b) => +new Date(a.lastModified) - +new Date(b.lastModified),
      name: (a, b) => a.name.localeCompare(b.name),
      size: (a, b) => b.size - a.size,
    };
    return [...list].sort(by[sort]);
  }, [source, kind, sort, picking, accept]);

  const byKey = useMemo(() => new Map(source.map(f => [f.key, f])), [source]);
  const focused = focus ? byKey.get(focus) : undefined;

  // ── Selection ─────────────────────────────────────────────────────────
  const lastClicked = useRef<string | null>(null);
  const clickItem = (item: MediaItem, e: React.MouseEvent) => {
    const k = item.key;
    if (e.shiftKey && lastClicked.current && (multiple || !picking)) {
      const keys = shown.map(f => f.key);
      const [a, b] = [keys.indexOf(lastClicked.current), keys.indexOf(k)].sort((x, y) => x - y);
      setSelected(s => Array.from(new Set([...s, ...keys.slice(a, b + 1)])));
    } else if (e.metaKey || e.ctrlKey || (picking && multiple)) {
      setSelected(s => (s.includes(k) ? s.filter(x => x !== k) : [...s, k]));
    } else {
      setSelected([k]);
    }
    lastClicked.current = k;
    if (!picking) setFocus(k);
  };
  const toggleCheck = (k: string) => setSelected(s => (s.includes(k) ? s.filter(x => x !== k) : picking && !multiple ? [k] : [...s, k]));

  const pick = (items: MediaItem[]) => { if (items.length) onPick?.(multiple ? items : items.slice(0, 1)); };

  // ── Uploads ───────────────────────────────────────────────────────────
  const uploadFiles = useCallback(async (list: File[], target = prefix) => {
    const accepted = picking && accept ? list.filter(f => matchesAccept({ contentType: f.type, name: f.name }, accept)) : list;
    if (accepted.length < list.length) alert(`${list.length - accepted.length} file(s) skipped — this field only accepts ${accept}.`);
    const done: MediaItem[] = [];
    await Promise.all(accepted.map(async file => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setUploads(u => [...u, { id, name: file.name, pct: 0, status: 'uploading' }]);
      try {
        const item = await mediaApi.upload(file, target, pct => setUploads(u => u.map(x => (x.id === id ? { ...x, pct } : x))));
        done.push(item);
        setUploads(u => u.map(x => (x.id === id ? { ...x, pct: 100, status: 'done' } : x)));
        setTimeout(() => setUploads(u => u.filter(x => x.id !== id)), 2500);
      } catch (e) {
        setUploads(u => u.map(x => (x.id === id ? { ...x, status: 'error', error: (e as Error).message } : x)));
      }
    }));
    if (target === prefix) {
      setFiles(f => [...done, ...f.filter(x => !done.some(d => d.key === x.key))]);
      setSelected(picking && !multiple ? done.slice(0, 1).map(d => d.key) : done.map(d => d.key));
      if (!picking && done[0]) setFocus(done[0].key);
    }
    return done;
  }, [prefix, picking, accept, multiple]);

  // Whole-library drop zone (OS files only, not internal drags)
  const isFileDrag = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes('Files');
  const onDragEnter = (e: React.DragEvent) => { if (!isFileDrag(e)) return; dragDepth.current++; setDragOver(true); };
  const onDragLeave = (e: React.DragEvent) => { if (!isFileDrag(e)) return; dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragOver(false); };
  const onDrop = (e: React.DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    uploadFiles(Array.from(e.dataTransfer.files));
  };

  // ── Mutations ─────────────────────────────────────────────────────────
  const run = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(label);
    try { await fn(); } catch (e) { alert((e as Error).message); }
    setBusy('');
  };
  const removeKeys = (keys: string[]) => run('Deleting…', async () => {
    await mediaApi.remove(keys);
    setFiles(f => f.filter(x => !keys.includes(x.key)));
    setSearchResults(r => r && r.filter(x => !keys.includes(x.key)));
    setSelected([]);
    setFocus(null);
  });
  const moveKeys = (keys: string[], to: string) => run('Moving…', async () => {
    for (const k of keys) await mediaApi.move(k, to + k.split('/').pop());
    setMoving(null);
    setSelected([]);
    setFocus(null);
    await load();
  });
  const rename = (item: MediaItem, name: string) => run('Renaming…', async () => {
    await mediaApi.rename(item.key, name);
    await load();
  });
  const createFolder = (name: string) => run('Creating folder…', async () => {
    const clean = name.trim().replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '-');
    if (!clean) return;
    await mediaApi.createFolder(`${prefix}${clean}/`);
    setNewFolder(null);
    await load();
  });
  const removeFolder = (f: MediaFolderItem) => {
    if (!confirm(`Delete the folder “${f.name}” and everything inside it? This cannot be undone.`)) return;
    run('Deleting folder…', async () => { await mediaApi.removeFolder(f.prefix); await load(); });
  };
  const importUrl = (url: string) => run('Importing…', async () => {
    await mediaApi.importUrl(url, prefix.replace(/^media\//, '').replace(/\/$/, ''));
    setImporting(null);
    await load();
  });

  // ── Keyboard ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable="true"]')) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a' && (!picking || multiple)) { e.preventDefault(); setSelected(shown.map(f => f.key)); }
      if (e.key === 'Escape') { if (selected.length) setSelected([]); else if (picking) onCancel?.(); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && !picking && selected.length) {
        e.preventDefault();
        if (confirm(`Delete ${selected.length} file(s)?`)) removeKeys(selected);
      }
      if (e.key === 'Enter' && picking && selected.length) pick(selected.map(k => byKey.get(k)!).filter(Boolean));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── Render ────────────────────────────────────────────────────────────
  const notConfigured = error?.status === 503;
  const usedCount = (item: MediaItem) => usage[item.url]?.length ?? 0;

  return (
    <div
      className="relative flex h-full min-h-[480px] flex-col bg-white text-[#242424]"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={e => { if (isFileDrag(e)) e.preventDefault(); }}
      onDrop={onDrop}
    >
      <input ref={fileInput} type="file" multiple hidden accept={accept} onChange={e => { uploadFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }} />

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[#f2f2f2] px-5 py-3">
        <nav className="flex min-w-0 flex-1 items-center gap-1 text-[14px]" aria-label="Folder">
          {searchResults ? (
            <span className="truncate text-[#6b6b6b]">Search results for <b className="text-[#242424]">“{q}”</b> <span className="text-[#9b9b9b]">· all folders</span></span>
          ) : crumbs(prefix).map((c, i, all) => (
            <span key={c.prefix} className="flex min-w-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setPrefix(c.prefix)}
                onDragOver={e => { if (!isFileDrag(e) && selected.length) { e.preventDefault(); setDropFolder(c.prefix); } }}
                onDragLeave={() => setDropFolder(null)}
                onDrop={e => { if (!isFileDrag(e)) { e.preventDefault(); setDropFolder(null); moveKeys(JSON.parse(e.dataTransfer.getData('text/media-keys') || '[]'), c.prefix); } }}
                className={`truncate rounded px-1.5 py-0.5 ${i === all.length - 1 ? 'font-semibold text-[#242424]' : 'text-[#6b6b6b] hover:bg-[#f6f6f6] hover:text-[#242424]'} ${dropFolder === c.prefix ? 'bg-[#eef7ee] ring-1 ring-[#1a8917]' : ''}`}
              >
                {c.label}
              </button>
              {i < all.length - 1 && <ChevronRight className="h-4 w-4 shrink-0 text-[#c4c4c4]" />}
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-2 rounded-full bg-[#f6f6f6] px-3 py-1.5 focus-within:ring-1 focus-within:ring-[#242424]">
          <Search className="h-4 w-4 text-[#9b9b9b]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search all files" className="w-40 bg-transparent text-[13px] outline-none sm:w-52" aria-label="Search files" />
          {q && <button type="button" onClick={() => setQ('')} aria-label="Clear search"><X className="h-3.5 w-3.5 text-[#9b9b9b]" /></button>}
        </div>

        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setNewFolder('')} disabled={notConfigured} title="New folder" className="rounded-full p-2 text-[#6b6b6b] hover:bg-[#f2f2f2] hover:text-[#242424] disabled:opacity-30"><FolderPlus className="h-[18px] w-[18px]" /></button>
          <button type="button" onClick={() => setImporting('')} disabled={notConfigured} title="Import from URL" className="rounded-full p-2 text-[#6b6b6b] hover:bg-[#f2f2f2] hover:text-[#242424] disabled:opacity-30"><Link2 className="h-[18px] w-[18px]" /></button>
          <button type="button" onClick={() => setView(v => (v === 'grid' ? 'list' : 'grid'))} title={view === 'grid' ? 'List view' : 'Grid view'} className="rounded-full p-2 text-[#6b6b6b] hover:bg-[#f2f2f2] hover:text-[#242424]">
            {view === 'grid' ? <ListIcon className="h-[18px] w-[18px]" /> : <LayoutGrid className="h-[18px] w-[18px]" />}
          </button>
          <button type="button" onClick={() => fileInput.current?.click()} disabled={notConfigured} className="ml-1 flex items-center gap-2 rounded-full bg-[#1a8917] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#156d12] disabled:opacity-40">
            <Upload className="h-4 w-4" /> Upload
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-2 px-5 py-2.5">
        {KIND_FILTERS.map(f => (
          <button key={f.key} type="button" onClick={() => setKind(f.key)} className={`rounded-full px-3 py-1 text-[13px] ${kind === f.key ? 'bg-[#242424] text-white' : 'bg-[#f6f6f6] text-[#6b6b6b] hover:text-[#242424]'}`}>
            {f.label}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1.5 text-[12px] text-[#9b9b9b]">
          {shown.length} file{shown.length === 1 ? '' : 's'}
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
          <select value={sort} onChange={e => setSort(e.target.value as Sort)} className="bg-transparent text-[12px] text-[#242424] outline-none" aria-label="Sort">
            <option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name">Name</option><option value="size">Largest</option>
          </select>
        </span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* ── Content ── */}
        <div className="min-w-0 flex-1 overflow-y-auto px-5 pb-24" onClick={e => { if (e.target === e.currentTarget) { setSelected([]); setFocus(null); } }}>
          {notConfigured ? (
            <div className="mx-auto mt-16 max-w-[420px] text-center">
              <CloudOff className="mx-auto h-10 w-10 text-[#c4c4c4]" strokeWidth={1.2} />
              <h3 className="mt-4 text-[17px] font-semibold">Storage isn’t connected</h3>
              <p className="mt-2 text-[14px] leading-6 text-[#6b6b6b]">
                Set the Cloudflare R2 credentials (account id, access key, secret, bucket and <b>public URL</b>) in the environment or in Settings → Storage.
              </p>
            </div>
          ) : error ? (
            <div className="mt-10 flex items-center justify-center gap-2 text-[14px] text-[#c94a4a]"><AlertCircle className="h-4 w-4" /> {error.message}
              <button type="button" onClick={() => load()} className="ml-2 underline">Retry</button>
            </div>
          ) : (
            <>
              {/* Folders */}
              {!searchResults && (folders.length > 0 || newFolder !== null || prefix !== ROOT) && (
                <section className="mb-6">
                  <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.06em] text-[#9b9b9b]">Folders</p>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2">
                    {prefix !== ROOT && (
                      <button
                        type="button"
                        onClick={() => setPrefix(parentPrefix(prefix))}
                        onDragOver={e => { if (!isFileDrag(e)) { e.preventDefault(); setDropFolder('..'); } }}
                        onDragLeave={() => setDropFolder(null)}
                        onDrop={e => { e.preventDefault(); setDropFolder(null); moveKeys(JSON.parse(e.dataTransfer.getData('text/media-keys') || '[]'), parentPrefix(prefix)); }}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-[14px] text-[#6b6b6b] hover:bg-[#fafafa] ${dropFolder === '..' ? 'border-[#1a8917] bg-[#eef7ee]' : 'border-[#f2f2f2]'}`}
                      >
                        <Folder className="h-5 w-5 text-[#c4c4c4]" /> ..
                      </button>
                    )}
                    {folders.map(f => (
                      <div
                        key={f.prefix}
                        onDragOver={e => { if (!isFileDrag(e)) { e.preventDefault(); setDropFolder(f.prefix); } }}
                        onDragLeave={() => setDropFolder(null)}
                        onDrop={e => { if (!isFileDrag(e)) { e.preventDefault(); setDropFolder(null); moveKeys(JSON.parse(e.dataTransfer.getData('text/media-keys') || '[]'), f.prefix); } }}
                        className={`group flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors ${dropFolder === f.prefix ? 'border-[#1a8917] bg-[#eef7ee]' : 'border-[#f2f2f2] hover:bg-[#fafafa]'}`}
                      >
                        <button type="button" onDoubleClick={() => setPrefix(f.prefix)} onClick={() => setPrefix(f.prefix)} className="flex min-w-0 flex-1 items-center gap-3 text-left text-[14px]">
                          <Folder className="h-5 w-5 shrink-0 fill-[#e9eef5] text-[#8aa3c2]" />
                          <span className="truncate">{f.name}</span>
                        </button>
                        {!picking && (
                          <button type="button" onClick={() => removeFolder(f)} title="Delete folder" className="hidden rounded p-1 text-[#9b9b9b] hover:text-[#c94a4a] group-hover:block"><Trash2 className="h-3.5 w-3.5" /></button>
                        )}
                      </div>
                    ))}
                    {newFolder !== null && (
                      <form className="flex items-center gap-2 rounded-lg border border-[#242424] px-3 py-2" onSubmit={e => { e.preventDefault(); createFolder(newFolder); }}>
                        <Folder className="h-5 w-5 shrink-0 text-[#9b9b9b]" />
                        <input autoFocus value={newFolder} onChange={e => setNewFolder(e.target.value)} onBlur={() => !newFolder && setNewFolder(null)} onKeyDown={e => e.key === 'Escape' && setNewFolder(null)} placeholder="Folder name" className="min-w-0 flex-1 text-[14px] outline-none" />
                      </form>
                    )}
                  </div>
                </section>
              )}

              {importing !== null && (
                <form className="mb-6 flex items-center gap-2 rounded-lg border border-[#242424] px-3 py-2" onSubmit={e => { e.preventDefault(); if (importing.trim()) importUrl(importing.trim()); }}>
                  <Link2 className="h-4 w-4 text-[#9b9b9b]" />
                  <input autoFocus value={importing} onChange={e => setImporting(e.target.value)} onKeyDown={e => e.key === 'Escape' && setImporting(null)} placeholder="https://… — the file is copied into this folder" className="min-w-0 flex-1 text-[14px] outline-none" />
                  <button type="submit" className="rounded-full bg-[#242424] px-3 py-1 text-[13px] text-white">Import</button>
                  <button type="button" onClick={() => setImporting(null)} aria-label="Cancel"><X className="h-4 w-4 text-[#9b9b9b]" /></button>
                </form>
              )}

              {/* Files */}
              {loading ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
                  {Array.from({ length: 10 }).map((_, i) => <div key={i} className="aspect-square animate-pulse rounded-lg bg-[#f6f6f6]" />)}
                </div>
              ) : shown.length === 0 ? (
                <button type="button" onClick={() => fileInput.current?.click()} className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#e6e6e6] py-16 text-center hover:border-[#c4c4c4]">
                  <Upload className="h-8 w-8 text-[#c4c4c4]" strokeWidth={1.4} />
                  <span className="mt-3 text-[15px] font-medium">{searchResults ? 'No files match your search' : 'Drop files here or click to upload'}</span>
                  <span className="mt-1 text-[13px] text-[#9b9b9b]">{searchResults ? 'Try another name' : `Into /${prefix.replace(/^media\//, '')}`}</span>
                </button>
              ) : view === 'grid' ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4">
                  {shown.map(item => {
                    const sel = selected.includes(item.key);
                    const used = usedCount(item);
                    return (
                      <div
                        key={item.key}
                        draggable={!picking}
                        onDragStart={e => {
                          const keys = sel ? selected : [item.key];
                          if (!sel) setSelected([item.key]);
                          e.dataTransfer.setData('text/media-keys', JSON.stringify(keys));
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onClick={e => clickItem(item, e)}
                        onDoubleClick={() => (picking ? pick([item]) : window.open(item.url, '_blank', 'noopener'))}
                        className="group cursor-pointer select-none"
                      >
                        <div className={`checker relative aspect-square overflow-hidden rounded-lg transition-shadow ${sel ? 'ring-2 ring-[#1a8917] ring-offset-2' : 'ring-1 ring-[#f2f2f2] group-hover:ring-[#e6e6e6]'}`}>
                          <Thumb item={item} />
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); toggleCheck(item.key); }}
                            aria-label={sel ? 'Deselect' : 'Select'}
                            className={`absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-opacity ${sel ? 'border-[#1a8917] bg-[#1a8917] text-white opacity-100' : 'border-white bg-black/20 opacity-0 group-hover:opacity-100'}`}
                          >
                            {sel && <Check className="h-3 w-3" strokeWidth={3} />}
                          </button>
                          {used > 0 && <span className="absolute right-2 top-2 rounded-full bg-white/95 px-1.5 py-0.5 text-[10px] font-medium text-[#1a6b17] shadow-sm" title={usage[item.url].join('\n')}>In use</span>}
                        </div>
                        <p className="mt-2 truncate text-[13px] font-medium text-[#242424]" title={item.name}>{item.name.replace(/^\d{13}-/, '')}</p>
                        <p className="text-[12px] text-[#9b9b9b]">{formatBytes(item.size)} · {dateLabel(item.lastModified)}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <table className="w-full text-left text-[13px]">
                  <thead className="text-[11px] uppercase tracking-[0.06em] text-[#9b9b9b]">
                    <tr><th className="w-10 py-2" /><th className="py-2 font-medium">Name</th><th className="hidden py-2 font-medium sm:table-cell">Type</th><th className="py-2 text-right font-medium">Size</th><th className="hidden py-2 text-right font-medium md:table-cell">Uploaded</th></tr>
                  </thead>
                  <tbody>
                    {shown.map(item => {
                      const sel = selected.includes(item.key);
                      return (
                        <tr
                          key={item.key}
                          draggable={!picking}
                          onDragStart={e => e.dataTransfer.setData('text/media-keys', JSON.stringify(sel ? selected : [item.key]))}
                          onClick={e => clickItem(item, e)}
                          onDoubleClick={() => picking && pick([item])}
                          className={`cursor-pointer border-t border-[#f6f6f6] ${sel ? 'bg-[#eef7ee]' : 'hover:bg-[#fafafa]'}`}
                        >
                          <td className="py-1.5"><div className="checker h-9 w-9 overflow-hidden rounded"><Thumb item={item} /></div></td>
                          <td className="max-w-0 py-1.5 pr-3"><span className="block truncate font-medium">{item.name.replace(/^\d{13}-/, '')}</span>{usedCount(item) > 0 && <span className="text-[11px] text-[#1a8917]">In use · {usage[item.url][0]}</span>}</td>
                          <td className="hidden py-1.5 text-[#6b6b6b] sm:table-cell">{ext(item.name)}</td>
                          <td className="py-1.5 text-right text-[#6b6b6b]">{formatBytes(item.size)}</td>
                          <td className="hidden py-1.5 text-right text-[#6b6b6b] md:table-cell">{dateLabel(item.lastModified)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>

        {/* ── Details ── */}
        {!picking && focused && selected.length <= 1 && (
          <div className="hidden lg:flex">
            <Details
              item={focused}
              usedIn={usage[focused.url] ?? []}
              onClose={() => setFocus(null)}
              onRename={n => rename(focused, n)}
              onDelete={() => removeKeys([focused.key])}
              onMove={() => setMoving([focused.key])}
              readOnly={false}
            />
          </div>
        )}
      </div>

      {/* ── Bulk / pick bar ── */}
      {(picking || selected.length > 1) && (
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 border-t border-[#f2f2f2] bg-white/95 px-5 py-3 backdrop-blur">
          {picking ? (
            <>
              <span className="text-[13px] text-[#6b6b6b]">
                {selected.length ? `${selected.length} selected` : multiple ? 'Select one or more files' : 'Select a file'}
                <span className="hidden text-[#9b9b9b] sm:inline"> · double-click to insert · drop files to upload</span>
              </span>
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-[14px] hover:bg-[#f2f2f2]">Cancel</button>
                <button type="button" disabled={!selected.length} onClick={() => pick(selected.map(k => byKey.get(k)!).filter(Boolean))} className="rounded-full bg-[#1a8917] px-5 py-2 text-[14px] font-medium text-white hover:bg-[#156d12] disabled:opacity-40">
                  {multiple && selected.length > 1 ? `Insert ${selected.length}` : 'Insert'}
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="text-[13px] font-medium">{selected.length} selected</span>
              <button type="button" onClick={() => setMoving(selected)} className="flex items-center gap-1.5 rounded-full border border-[#e6e6e6] px-3 py-1.5 text-[13px] hover:border-[#242424]"><FolderInput className="h-3.5 w-3.5" /> Move</button>
              <button
                type="button"
                onClick={() => {
                  const inUse = selected.filter(k => usedCount(byKey.get(k)!)).length;
                  if (confirm(`Delete ${selected.length} files?${inUse ? ` ${inUse} of them are in use on the site.` : ''}`)) removeKeys(selected);
                }}
                className="flex items-center gap-1.5 rounded-full border border-[#f3d4d4] px-3 py-1.5 text-[13px] text-[#c94a4a] hover:bg-[#fdf1f1]"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
              <button type="button" onClick={() => setSelected([])} className="ml-auto text-[13px] text-[#6b6b6b] hover:text-[#242424]">Clear selection</button>
            </>
          )}
        </div>
      )}

      {/* ── Upload tray ── */}
      {(uploads.length > 0 || busy) && (
        <div className="absolute bottom-16 right-5 z-20 w-[300px] overflow-hidden rounded-lg border border-[#f2f2f2] bg-white shadow-xl">
          {busy && <p className="flex items-center gap-2 border-b border-[#f6f6f6] px-4 py-2.5 text-[13px]"><Loader2 className="h-3.5 w-3.5 animate-spin" /> {busy}</p>}
          {uploads.map(u => (
            <div key={u.id} className="border-b border-[#f6f6f6] px-4 py-2.5 last:border-0">
              <div className="flex items-center gap-2 text-[13px]">
                <span className="min-w-0 flex-1 truncate">{u.name}</span>
                {u.status === 'done' && <Check className="h-4 w-4 text-[#1a8917]" />}
                {u.status === 'error' && <button type="button" onClick={() => setUploads(x => x.filter(y => y.id !== u.id))} aria-label="Dismiss"><X className="h-4 w-4 text-[#c94a4a]" /></button>}
                {u.status === 'uploading' && <span className="text-[12px] text-[#9b9b9b]">{u.pct}%</span>}
              </div>
              {u.status === 'error'
                ? <p className="mt-1 text-[12px] text-[#c94a4a]">{u.error}</p>
                : <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#f2f2f2]"><div className="h-full rounded-full bg-[#1a8917] transition-[width]" style={{ width: `${u.pct}%` }} /></div>}
            </div>
          ))}
        </div>
      )}

      {/* ── Drop overlay ── */}
      {dragOver && (
        <div className="pointer-events-none absolute inset-2 z-30 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#1a8917] bg-[#eef7ee]/90">
          <Upload className="h-10 w-10 text-[#1a8917]" strokeWidth={1.4} />
          <p className="mt-3 text-[16px] font-semibold text-[#1a6b17]">Drop to upload</p>
          <p className="text-[13px] text-[#1a6b17]">into /{prefix.replace(/^media\//, '')}</p>
        </div>
      )}

      {moving && <MoveDialog count={moving.length} from={prefix} onClose={() => setMoving(null)} onMove={to => moveKeys(moving, to)} />}
    </div>
  );
}

