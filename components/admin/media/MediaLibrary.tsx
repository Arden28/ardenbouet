'use client';
// The admin file manager for the Cloudflare R2 bucket — a small Google Drive.
//  - "manage": the Media page — browse, upload (files & folders), organise, preview, inspect usage, delete
//  - "pick":   inside MediaPicker — same browser, returns the chosen file(s)
// Right-click anything for a context menu; double-click (or Space) to preview; F2 renames; Delete deletes.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, ArrowDown, ArrowUp, Check, ChevronDown, ChevronRight, Clock, CloudOff, Copy, Download, ExternalLink, Eye, FileText,
  Film, FolderInput, FolderPlus, FolderUp, HardDrive, Image as ImageIcon, Info, LayoutGrid, Link2, List as ListIcon, Loader2,
  MoreVertical, Music, Pencil, Plus, RefreshCw, Search, SquareCheck, Trash2, Upload, X, Files,
} from 'lucide-react';
import {
  ROOT, crumbs, displayName, folderOf, formatBytes, kindOf, matchesAccept, mediaApi, parentPrefix,
  type MediaFolderItem, type MediaItem, type MediaKind,
} from './api';
import { Menu, anchorMenu, type MenuEntry, type MenuState } from './Menu';
import { Preview } from './Preview';
import { Details, type DetailsTarget } from './Details';
import { ConfirmDialog, FileGlyph, FolderGlyph, MoveDialog, PromptDialog, Thumb, dateLabel, downloadFile } from './shared';

type Mode = 'manage' | 'pick';
type Section = { type: 'folder'; prefix: string } | { type: 'recent' } | { type: 'kind'; kind: MediaKind };
type SortBy = 'name' | 'modified' | 'size';
type Modified = 'any' | 'today' | 'week' | 'month' | 'year';
type UploadJob = { id: string; name: string; pct: number; status: 'uploading' | 'done' | 'error'; error?: string };
type Dialog =
  | { type: 'newFolder' }
  | { type: 'import' }
  | { type: 'rename'; key: string; name: string; folder: boolean }
  | { type: 'delete'; keys: string[] }
  | { type: 'move'; keys: string[] }
  | null;

const STORAGE_QUOTA = 10 * 1024 ** 3; // R2 free tier — just a visual reference for the meter
const KINDS: { kind: MediaKind; label: string; icon: React.ReactNode }[] = [
  { kind: 'image', label: 'Images', icon: <ImageIcon className="h-[18px] w-[18px]" /> },
  { kind: 'video', label: 'Videos', icon: <Film className="h-[18px] w-[18px]" /> },
  { kind: 'audio', label: 'Audio', icon: <Music className="h-[18px] w-[18px]" /> },
  { kind: 'document', label: 'Documents', icon: <FileText className="h-[18px] w-[18px]" /> },
];
const MODIFIED: { key: Modified; label: string }[] = [
  { key: 'any', label: 'Any time' }, { key: 'today', label: 'Today' }, { key: 'week', label: 'Last 7 days' },
  { key: 'month', label: 'Last 30 days' }, { key: 'year', label: 'This year' },
];
const isFolderKey = (k: string) => k.endsWith('/');
const cleanSegment = (s: string) => s.trim().replace(/[^a-zA-Z0-9 _-]/g, '').replace(/\s+/g, '-');
const lsGet = (k: string, d: string) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const lsSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

function modifiedSince(m: Modified): number {
  const now = new Date();
  if (m === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (m === 'week') return Date.now() - 7 * 86_400_000;
  if (m === 'month') return Date.now() - 30 * 86_400_000;
  if (m === 'year') return new Date(now.getFullYear(), 0, 1).getTime();
  return 0;
}

// ─── Folder tree (left nav) ──────────────────────────────────────────────────

function TreeNode({ folder, depth, tree, expanded, active, dropTarget, onToggle, onOpen, onDropKeys, onDragTarget, onContext }: {
  folder: MediaFolderItem; depth: number; tree: Record<string, MediaFolderItem[]>; expanded: Set<string>; active: string | null;
  dropTarget: string | null; onToggle: (p: string) => void; onOpen: (p: string) => void; onDropKeys: (keys: string[], to: string) => void;
  onDragTarget: (p: string | null) => void; onContext: (e: React.MouseEvent, f: MediaFolderItem) => void;
}) {
  const open = expanded.has(folder.prefix);
  const children = tree[folder.prefix];
  const isActive = active === folder.prefix;
  return (
    <li>
      <div
        onContextMenu={e => onContext(e, folder)}
        onDragOver={e => { if (e.dataTransfer.types.includes('text/media-keys')) { e.preventDefault(); onDragTarget(folder.prefix); } }}
        onDragLeave={() => onDragTarget(null)}
        onDrop={e => { e.preventDefault(); onDragTarget(null); onDropKeys(JSON.parse(e.dataTransfer.getData('text/media-keys') || '[]'), folder.prefix); }}
        style={{ paddingLeft: 8 + depth * 14 }}
        className={`group flex h-8 items-center gap-1 rounded-full pr-3 text-[14px] ${isActive ? 'bg-[#d3e3fd] font-medium text-[#242424]' : 'text-[#242424] hover:bg-[#ececec]'} ${dropTarget === folder.prefix ? 'ring-2 ring-[#2467ac]' : ''}`}
      >
        <button type="button" onClick={() => onToggle(folder.prefix)} aria-label={open ? 'Collapse' : 'Expand'}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#6b6b6b] hover:bg-[rgba(0,0,0,0.06)] ${children && children.length === 0 ? 'invisible' : ''}`}>
          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-90' : ''}`} />
        </button>
        <button type="button" onClick={() => onOpen(folder.prefix)} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
          <FolderGlyph open={isActive} className="h-[18px] w-[18px] shrink-0" />
          <span className="truncate">{folder.name}</span>
        </button>
      </div>
      {open && children && children.length > 0 && (
        <ul>
          {children.map(c => (
            <TreeNode key={c.prefix} folder={c} depth={depth + 1} tree={tree} expanded={expanded} active={active} dropTarget={dropTarget}
              onToggle={onToggle} onOpen={onOpen} onDropKeys={onDropKeys} onDragTarget={onDragTarget} onContext={onContext} />
          ))}
        </ul>
      )}
      {open && !children && <p style={{ paddingLeft: 38 + depth * 14 }} className="py-1 text-[12px] text-[#9b9b9b]">Loading…</p>}
    </li>
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
  const [section, setSection] = useState<Section>({ type: 'folder', prefix: initialPrefix });
  const prefix = section.type === 'folder' ? section.prefix : null;
  const uploadTarget = prefix ?? ROOT;

  const [files, setFiles] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<MediaFolderItem[]>([]);
  const [all, setAll] = useState<MediaItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ status?: number; message: string } | null>(null);
  const [q, setQ] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[] | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | MediaKind>(() => (accept?.startsWith('image') ? 'image' : accept?.startsWith('video') ? 'video' : 'all'));
  const [modified, setModified] = useState<Modified>('any');
  const [sortBy, setSortBy] = useState<SortBy>('modified');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [layout, setLayoutState] = useState<'grid' | 'list'>('grid');
  const [showDetails, setShowDetailsState] = useState(false);
  // Persisted from the setters (not an effect) so the saved value is never overwritten before it's read.
  const setLayout = (v: 'grid' | 'list' | ((l: 'grid' | 'list') => 'grid' | 'list')) =>
    setLayoutState(l => { const n = typeof v === 'function' ? v(l) : v; lsSet('media_view', n); return n; });
  const setShowDetails = (v: boolean | ((s: boolean) => boolean)) =>
    setShowDetailsState(s => { const n = typeof v === 'function' ? v(s) : v; lsSet('media_details', n ? '1' : '0'); return n; });
  const [selected, setSelected] = useState<string[]>([]);
  const [usage, setUsage] = useState<Record<string, string[]>>({});
  const [uploads, setUploads] = useState<UploadJob[]>([]);
  const [trayOpen, setTrayOpen] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [menu, setMenu] = useState<MenuState>(null);
  const [preview, setPreview] = useState<number | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const [busy, setBusy] = useState('');
  const [tree, setTree] = useState<Record<string, MediaFolderItem[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([ROOT]));
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const lastClicked = useRef<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLayoutState(lsGet('media_view', 'grid') === 'list' ? 'list' : 'grid');
    setShowDetailsState(lsGet('media_details', '0') === '1');
  }, []);

  const toast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t.slice(-2), { id, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);

  // ── Data ──────────────────────────────────────────────────────────────
  const loadFolder = useCallback(async (p: string) => {
    setLoading(true);
    setError(null);
    try {
      const r = await mediaApi.list(p);
      setFiles(r.files);
      setFolders(r.folders);
      setTree(t => ({ ...t, [p]: r.folders }));
    } catch (e) {
      const err = e as Error & { status?: number };
      setError({ status: err.status, message: err.message });
      setFiles([]);
      setFolders([]);
    }
    setLoading(false);
  }, []);

  const loadAll = useCallback(async () => {
    try { setAll((await mediaApi.all()).files); } catch { setAll(a => a ?? []); }
  }, []);

  const loadTree = useCallback(async (p: string) => {
    try { const r = await mediaApi.list(p); setTree(t => ({ ...t, [p]: r.folders })); } catch { setTree(t => ({ ...t, [p]: [] })); }
  }, []);

  const refresh = useCallback(async () => {
    if (prefix) await loadFolder(prefix);
    loadAll();
    expanded.forEach(p => { if (p !== prefix) loadTree(p); });
  }, [prefix, loadFolder, loadAll, loadTree, expanded]);

  useEffect(() => { if (prefix) loadFolder(prefix); setSelected([]); }, [prefix, loadFolder]);
  useEffect(() => { if (section.type !== 'folder') setLoading(all === null); }, [section, all]);
  useEffect(() => { loadAll(); mediaApi.usage().then(r => setUsage(r.usage)).catch(() => {}); }, [loadAll]);

  // Expand the tree down to the open folder.
  useEffect(() => {
    if (!prefix) return;
    setExpanded(s => { const n = new Set(s); crumbs(prefix).forEach(c => n.add(c.prefix)); return n; });
  }, [prefix]);
  useEffect(() => { expanded.forEach(p => { if (!tree[p]) loadTree(p); }); }, [expanded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced global search
  useEffect(() => {
    const term = q.trim();
    if (!term) { setSearchResults(null); return; }
    const id = setTimeout(() => { mediaApi.search(term).then(r => setSearchResults(r.files)).catch(() => setSearchResults([])); }, 250);
    return () => clearTimeout(id);
  }, [q]);

  // ── What's on screen ──────────────────────────────────────────────────
  const searching = searchResults !== null;
  const shownFolders = useMemo(() => {
    if (searching || section.type !== 'folder' || typeFilter !== 'all' || modified !== 'any') return [];
    return [...folders].sort((a, b) => a.name.localeCompare(b.name) * (sortBy === 'name' && sortDir === 'desc' ? -1 : 1));
  }, [folders, searching, section, typeFilter, modified, sortBy, sortDir]);

  const shownFiles = useMemo(() => {
    let list: MediaItem[] =
      searching ? searchResults!
        : section.type === 'folder' ? files
          : section.type === 'recent' ? [...(all ?? [])].sort((a, b) => +new Date(b.lastModified) - +new Date(a.lastModified)).slice(0, 100)
            : (all ?? []).filter(f => kindOf(f.contentType, f.name) === section.kind);
    const since = modifiedSince(modified);
    list = list.filter(f =>
      (typeFilter === 'all' || kindOf(f.contentType, f.name) === typeFilter)
      && (!since || +new Date(f.lastModified) >= since)
      && (!picking || matchesAccept(f, accept)));
    if (section.type === 'recent' && !searching) return list;
    const dir = sortDir === 'asc' ? 1 : -1;
    const cmp: Record<SortBy, (a: MediaItem, b: MediaItem) => number> = {
      name: (a, b) => displayName(a.name).localeCompare(displayName(b.name)),
      modified: (a, b) => +new Date(a.lastModified) - +new Date(b.lastModified),
      size: (a, b) => a.size - b.size,
    };
    return [...list].sort((a, b) => cmp[sortBy](a, b) * dir);
  }, [searching, searchResults, section, files, all, typeFilter, modified, picking, accept, sortBy, sortDir]);

  const order = useMemo(() => [...shownFolders.map(f => f.prefix), ...shownFiles.map(f => f.key)], [shownFolders, shownFiles]);
  const fileByKey = useMemo(() => {
    const m = new Map<string, MediaItem>();
    for (const f of [...files, ...(all ?? []), ...(searchResults ?? [])]) m.set(f.key, f);
    return m;
  }, [files, all, searchResults]);
  const folderByKey = useMemo(() => new Map(folders.map(f => [f.prefix, f])), [folders]);
  const selFiles = selected.filter(k => !isFolderKey(k)).map(k => fileByKey.get(k)).filter(Boolean) as MediaItem[];
  const selFolders = selected.filter(isFolderKey);

  const storageUsed = useMemo(() => (all ?? []).reduce((s, f) => s + f.size, 0), [all]);

  // ── Navigation ────────────────────────────────────────────────────────
  const go = (s: Section) => { setSection(s); setQ(''); setSelected([]); setPreview(null); contentRef.current?.scrollTo({ top: 0 }); };
  const openFolder = (p: string) => go({ type: 'folder', prefix: p });
  const toggleTree = (p: string) => setExpanded(s => { const n = new Set(s); if (n.has(p)) n.delete(p); else n.add(p); return n; });

  // ── Selection ─────────────────────────────────────────────────────────
  const clickItem = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const canMulti = !picking || multiple;
    if (e.shiftKey && lastClicked.current && canMulti) {
      const [a, b] = [order.indexOf(lastClicked.current), order.indexOf(key)].sort((x, y) => x - y);
      if (a >= 0) { setSelected(s => Array.from(new Set([...s, ...order.slice(a, b + 1)]))); return; }
    }
    if ((e.metaKey || e.ctrlKey || (picking && multiple && !isFolderKey(key))) && canMulti) setSelected(s => (s.includes(key) ? s.filter(x => x !== key) : [...s, key]));
    else setSelected([key]);
    lastClicked.current = key;
  };
  const pick = (items: MediaItem[]) => { if (items.length) onPick?.(multiple ? items : items.slice(0, 1)); };
  const openItem = (key: string) => {
    if (isFolderKey(key)) return openFolder(key);
    const item = fileByKey.get(key);
    if (!item) return;
    if (picking) pick([item]);
    else setPreview(shownFiles.findIndex(f => f.key === key));
  };

  // ── Uploads ───────────────────────────────────────────────────────────
  const uploadFiles = useCallback(async (list: { file: File; dir?: string }[], target: string) => {
    const accepted = picking && accept ? list.filter(({ file }) => matchesAccept({ contentType: file.type, name: file.name }, accept)) : list;
    if (accepted.length < list.length) toast(`${list.length - accepted.length} file(s) skipped — this field only accepts ${accept}`);
    if (!accepted.length) return [];
    setTrayOpen(true);
    const done: MediaItem[] = [];
    const queue = [...accepted];
    const worker = async () => {
      for (let job = queue.shift(); job; job = queue.shift()) {
        const { file, dir } = job;
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setUploads(u => [...u, { id, name: file.name, pct: 0, status: 'uploading' }]);
        try {
          const dest = dir ? `${target}${dir.split('/').map(cleanSegment).filter(Boolean).join('/')}/` : target;
          const item = await mediaApi.upload(file, dest, pct => setUploads(u => u.map(x => (x.id === id ? { ...x, pct } : x))));
          done.push(item);
          setUploads(u => u.map(x => (x.id === id ? { ...x, pct: 100, status: 'done' } : x)));
        } catch (e) {
          setUploads(u => u.map(x => (x.id === id ? { ...x, status: 'error', error: (e as Error).message } : x)));
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, accepted.length) }, worker));
    if (done.length) {
      toast(`${done.length} upload${done.length > 1 ? 's' : ''} complete`);
      if (prefix === target) {
        await loadFolder(target);
        const direct = done.filter(d => folderOf(d.key) === target).map(d => d.key);
        setSelected(picking && !multiple ? direct.slice(0, 1) : direct);
      }
      loadAll();
      loadTree(target);
    }
    return done;
  }, [picking, accept, toast, prefix, multiple, loadFolder, loadAll, loadTree]);

  const isFileDrag = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes('Files');
  const onDragEnter = (e: React.DragEvent) => { if (!isFileDrag(e)) return; dragDepth.current++; setDragOver(true); };
  const onDragLeave = (e: React.DragEvent) => { if (!isFileDrag(e)) return; dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragOver(false); };
  const onDrop = async (e: React.DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    // Folders dropped from the OS: walk entries so the structure is preserved.
    const entries = Array.from(e.dataTransfer.items ?? []).map(i => i.webkitGetAsEntry?.()).filter(Boolean) as FileSystemEntry[];
    if (entries.some(en => en.isDirectory)) {
      const out: { file: File; dir?: string }[] = [];
      const walk = async (entry: FileSystemEntry, dir: string): Promise<void> => {
        if (entry.isFile) {
          const file = await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej));
          out.push({ file, dir: dir || undefined });
        } else if (entry.isDirectory) {
          const reader = (entry as FileSystemDirectoryEntry).createReader();
          const read = () => new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej));
          for (let batch = await read(); batch.length; batch = await read()) {
            for (const child of batch) await walk(child, dir ? `${dir}/${entry.name}` : entry.name);
          }
        }
      };
      for (const en of entries) await walk(en, '');
      uploadFiles(out, uploadTarget);
    } else {
      uploadFiles(Array.from(e.dataTransfer.files).map(file => ({ file })), uploadTarget);
    }
  };

  // ── Mutations ─────────────────────────────────────────────────────────
  const run = async (label: string, fn: () => Promise<unknown>, done?: string) => {
    setBusy(label);
    try { await fn(); if (done) toast(done); } catch (e) { toast((e as Error).message); }
    setBusy('');
  };
  const removeKeys = (keys: string[]) => run('Deleting…', async () => {
    const fileKeys = keys.filter(k => !isFolderKey(k));
    if (fileKeys.length) await mediaApi.remove(fileKeys);
    for (const p of keys.filter(isFolderKey)) await mediaApi.removeFolder(p);
    setSearchResults(r => r && r.filter(x => !keys.includes(x.key)));
    setSelected([]);
    await refresh();
  }, `${keys.length} item${keys.length > 1 ? 's' : ''} deleted`);
  const moveKeys = (keys: string[], to: string) => {
    const valid = keys.filter(k => (isFolderKey(k) ? !to.startsWith(k) && parentPrefix(k) !== to : folderOf(k) !== to));
    if (!valid.length) return;
    const label = to === ROOT ? 'My library' : crumbs(to).pop()!.label;
    return run('Moving…', async () => {
      for (const k of valid) {
        if (isFolderKey(k)) await mediaApi.moveFolder(k, `${to}${k.slice(parentPrefix(k).length)}`);
        else await mediaApi.move(k, to + k.split('/').pop());
      }
      setSelected([]);
      await refresh();
    }, `${valid.length} item${valid.length > 1 ? 's' : ''} moved to ${label}`);
  };
  const rename = (key: string, name: string) => run('Renaming…', async () => {
    if (isFolderKey(key)) {
      const clean = cleanSegment(name);
      if (!clean) throw new Error('Use letters, numbers, dashes or underscores');
      await mediaApi.moveFolder(key, `${parentPrefix(key)}${clean}/`);
    } else {
      await mediaApi.rename(key, name);
    }
    setSelected([]);
    await refresh();
  }, 'Renamed');
  const copyFile = (item: MediaItem) => run('Copying…', async () => { await mediaApi.copy(item.key); await refresh(); }, `Copy of “${displayName(item.name)}” created`);
  const createFolder = (name: string) => run('Creating folder…', async () => {
    const clean = cleanSegment(name);
    if (!clean) throw new Error('Use letters, numbers, dashes or underscores');
    await mediaApi.createFolder(`${uploadTarget}${clean}/`);
    await refresh();
    loadTree(uploadTarget);
  }, 'Folder created');
  const importUrl = (url: string) => run('Importing…', async () => {
    await mediaApi.importUrl(url, uploadTarget.replace(/^media\//, '').replace(/\/$/, ''));
    await refresh();
  }, 'File imported');
  const copyLinks = async (items: MediaItem[]) => {
    await navigator.clipboard.writeText(items.map(i => i.url).join('\n')).catch(() => {});
    toast(items.length > 1 ? `${items.length} links copied` : 'Link copied');
  };
  const downloadMany = async (items: MediaItem[]) => {
    for (const it of items) { await downloadFile(it); await new Promise(r => setTimeout(r, 250)); }
  };
  const askDelete = (keys: string[]) => setDialog({ type: 'delete', keys });
  const askRename = (key: string) => {
    const folder = isFolderKey(key);
    const name = folder ? (folderByKey.get(key)?.name ?? key.slice(parentPrefix(key).length, -1)) : displayName(fileByKey.get(key)?.name ?? '');
    setDialog({ type: 'rename', key, name, folder });
  };

  // ── Menus ─────────────────────────────────────────────────────────────
  const newMenu: MenuEntry[] = [
    { label: 'New folder', icon: <FolderPlus className="h-[18px] w-[18px]" />, onSelect: () => setDialog({ type: 'newFolder' }) },
    'sep',
    { label: 'File upload', icon: <Upload className="h-[18px] w-[18px]" />, onSelect: () => fileInput.current?.click() },
    { label: 'Folder upload', icon: <FolderUp className="h-[18px] w-[18px]" />, onSelect: () => folderInput.current?.click(), disabled: picking },
    { label: 'Import from URL', icon: <Link2 className="h-[18px] w-[18px]" />, onSelect: () => setDialog({ type: 'import' }) },
  ];

  const itemsMenu = (keys: string[]): MenuEntry[] => {
    const fs = keys.filter(k => !isFolderKey(k)).map(k => fileByKey.get(k)).filter(Boolean) as MediaItem[];
    const fd = keys.filter(isFolderKey);
    if (keys.length === 1 && fd.length === 1) {
      const p = fd[0];
      return [
        { label: 'Open', icon: <FolderGlyph open className="h-[18px] w-[18px]" />, onSelect: () => openFolder(p) },
        { label: 'Upload files here', icon: <Upload className="h-[18px] w-[18px]" />, onSelect: () => { openFolder(p); setTimeout(() => fileInput.current?.click(), 50); }, disabled: picking },
        'sep',
        ...(picking ? [] : [
          { label: 'Rename', icon: <Pencil className="h-[18px] w-[18px]" />, shortcut: 'F2', onSelect: () => askRename(p) },
          { label: 'Move to…', icon: <FolderInput className="h-[18px] w-[18px]" />, onSelect: () => setDialog({ type: 'move', keys: [p] }) },
          { label: 'Folder information', icon: <Info className="h-[18px] w-[18px]" />, onSelect: () => { setSelected([p]); setShowDetails(true); } },
          'sep' as const,
          { label: 'Delete folder', icon: <Trash2 className="h-[18px] w-[18px]" />, danger: true, onSelect: () => askDelete([p]) },
        ]),
      ];
    }
    if (keys.length === 1 && fs.length === 1) {
      const f = fs[0];
      return [
        ...(picking ? [{ label: 'Insert', icon: <Check className="h-[18px] w-[18px]" />, onSelect: () => pick([f]) }] : []),
        { label: 'Preview', icon: <Eye className="h-[18px] w-[18px]" />, shortcut: 'Space', onSelect: () => setPreview(shownFiles.findIndex(x => x.key === f.key)) },
        { label: 'Open in new tab', icon: <ExternalLink className="h-[18px] w-[18px]" />, onSelect: () => window.open(f.url, '_blank', 'noopener') },
        { label: 'Download', icon: <Download className="h-[18px] w-[18px]" />, onSelect: () => downloadFile(f) },
        'sep',
        { label: 'Copy link', icon: <Link2 className="h-[18px] w-[18px]" />, onSelect: () => copyLinks([f]) },
        ...(picking ? [] : [
          { label: 'Rename', icon: <Pencil className="h-[18px] w-[18px]" />, shortcut: 'F2', onSelect: () => askRename(f.key) },
          { label: 'Make a copy', icon: <Copy className="h-[18px] w-[18px]" />, onSelect: () => copyFile(f) },
          { label: 'Move to…', icon: <FolderInput className="h-[18px] w-[18px]" />, onSelect: () => setDialog({ type: 'move', keys: [f.key] }) },
          ...(section.type !== 'folder' || searching ? [{ label: 'Show file location', icon: <FolderGlyph className="h-[18px] w-[18px]" />, onSelect: () => { openFolder(folderOf(f.key)); setTimeout(() => setSelected([f.key]), 400); } }] : []),
          'sep' as const,
          { label: 'File information', icon: <Info className="h-[18px] w-[18px]" />, onSelect: () => { setSelected([f.key]); setShowDetails(true); } },
          'sep' as const,
          { label: 'Delete', icon: <Trash2 className="h-[18px] w-[18px]" />, shortcut: 'Del', danger: true, onSelect: () => askDelete([f.key]) },
        ]),
      ];
    }
    return [
      ...(picking && fs.length ? [{ label: `Insert ${fs.length}`, icon: <Check className="h-[18px] w-[18px]" />, onSelect: () => pick(fs) }] : []),
      ...(fs.length ? [
        { label: `Download ${fs.length} file${fs.length > 1 ? 's' : ''}`, icon: <Download className="h-[18px] w-[18px]" />, onSelect: () => downloadMany(fs) },
        { label: 'Copy links', icon: <Link2 className="h-[18px] w-[18px]" />, onSelect: () => copyLinks(fs) },
      ] : []),
      ...(picking ? [] : [
        { label: 'Move to…', icon: <FolderInput className="h-[18px] w-[18px]" />, onSelect: () => setDialog({ type: 'move', keys }) },
        'sep' as const,
        { label: `Delete ${keys.length} items`, icon: <Trash2 className="h-[18px] w-[18px]" />, danger: true, onSelect: () => askDelete(keys) },
      ]),
    ];
  };

  const backgroundMenu = (): MenuEntry[] => [
    ...(picking ? [] : newMenu),
    ...(picking ? [] : ['sep' as const]),
    { label: 'Select all', icon: <SquareCheck className="h-[18px] w-[18px]" />, shortcut: 'Ctrl+A', onSelect: () => setSelected(order), disabled: picking && !multiple },
    { label: layout === 'grid' ? 'Switch to list' : 'Switch to grid', icon: layout === 'grid' ? <ListIcon className="h-[18px] w-[18px]" /> : <LayoutGrid className="h-[18px] w-[18px]" />, onSelect: () => setLayout(l => (l === 'grid' ? 'list' : 'grid')) },
    { label: 'Refresh', icon: <RefreshCw className="h-[18px] w-[18px]" />, onSelect: () => refresh() },
  ];

  const onItemContext = (key: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const keys = selected.includes(key) ? selected : [key];
    if (!selected.includes(key)) setSelected([key]);
    setMenu({ x: e.clientX, y: e.clientY, items: itemsMenu(keys) });
  };
  const onKebab = (key: string, e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const keys = selected.includes(key) ? selected : [key];
    if (!selected.includes(key)) setSelected([key]);
    setMenu(anchorMenu(e.currentTarget, itemsMenu(keys), 'right'));
  };
  const onBackgroundContext = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelected([]);
    setMenu({ x: e.clientX, y: e.clientY, items: backgroundMenu() });
  };

  // ── Keyboard ──────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (menu || preview !== null || dialog) return;
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable="true"]')) return;
      const k = e.key;
      const current = lastClicked.current && selected.includes(lastClicked.current) ? lastClicked.current : selected[selected.length - 1];
      if ((e.metaKey || e.ctrlKey) && k.toLowerCase() === 'a' && (!picking || multiple)) { e.preventDefault(); setSelected(order); return; }
      if (k === 'Escape') { if (selected.length) setSelected([]); else if (picking) onCancel?.(); return; }
      if (!picking && (k === 'Delete' || (k === 'Backspace' && (e.metaKey || e.ctrlKey))) && selected.length) { e.preventDefault(); askDelete(selected); return; }
      if (!picking && k === 'F2' && selected.length === 1) { e.preventDefault(); askRename(selected[0]); return; }
      if (k === 'Enter' && selected.length) {
        e.preventDefault();
        if (picking && selFiles.length) pick(selFiles); else if (current) openItem(current);
        return;
      }
      if (k === ' ' && current && !isFolderKey(current)) { e.preventDefault(); setPreview(shownFiles.findIndex(f => f.key === current)); return; }
      if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(k) && order.length) {
        e.preventDefault();
        let cols = 1;
        if (layout === 'grid' && contentRef.current) {
          const cards = Array.from(contentRef.current.querySelectorAll<HTMLElement>('[data-file-card]'));
          const top = cards[0]?.offsetTop;
          cols = Math.max(1, cards.filter(c => c.offsetTop === top).length);
        }
        const i = current ? order.indexOf(current) : -1;
        const step = k === 'ArrowRight' ? 1 : k === 'ArrowLeft' ? -1 : k === 'ArrowDown' ? (layout === 'grid' && !isFolderKey(order[Math.max(i, 0)]) ? cols : 1) : -(layout === 'grid' && !isFolderKey(order[Math.max(i, 0)]) ? cols : 1);
        const next = order[Math.min(order.length - 1, Math.max(0, i < 0 ? 0 : i + step))];
        setSelected([next]);
        lastClicked.current = next;
        contentRef.current?.querySelector(`[data-key="${CSS.escape(next)}"]`)?.scrollIntoView({ block: 'nearest' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── Render helpers ────────────────────────────────────────────────────
  const notConfigured = error?.status === 503;
  const sectionTitle = searching ? 'Search results' : section.type === 'recent' ? 'Recent' : section.type === 'kind' ? KINDS.find(k => k.kind === section.kind)!.label : null;
  const selTarget: DetailsTarget =
    selected.length === 1 && selFiles.length === 1 ? { type: 'file', item: selFiles[0] }
      : selected.length === 1 && selFolders.length === 1 ? { type: 'folder', folder: folderByKey.get(selFolders[0]) ?? { prefix: selFolders[0], name: selFolders[0].slice(parentPrefix(selFolders[0]).length, -1) } }
        : selected.length > 1 ? { type: 'many', files: selFiles, folders: selFolders.length }
          : { type: 'here', prefix: prefix ?? ROOT, label: sectionTitle ?? (prefix === ROOT ? 'My library' : crumbs(prefix ?? ROOT).pop()!.label), files: shownFiles, folders: shownFolders.length };

  const dragProps = (key: string) => ({
    draggable: !picking,
    onDragStart: (e: React.DragEvent) => {
      const keys = selected.includes(key) ? selected : [key];
      if (!selected.includes(key)) setSelected([key]);
      e.dataTransfer.setData('text/media-keys', JSON.stringify(keys));
      e.dataTransfer.effectAllowed = 'move';
    },
  });
  const dropProps = (target: string) => ({
    onDragOver: (e: React.DragEvent) => { if (e.dataTransfer.types.includes('text/media-keys')) { e.preventDefault(); setDropTarget(target); } },
    onDragLeave: () => setDropTarget(null),
    onDrop: (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes('text/media-keys')) return;
      e.preventDefault();
      e.stopPropagation();
      setDropTarget(null);
      moveKeys(JSON.parse(e.dataTransfer.getData('text/media-keys') || '[]'), target);
    },
  });

  const toggleSort = (by: SortBy) => {
    if (sortBy === by) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(by); setSortDir(by === 'name' ? 'asc' : 'desc'); }
  };
  const SortArrow = ({ by }: { by: SortBy }) => (sortBy === by ? (sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />) : null);
  const navItem = (active: boolean, onClick: () => void, icon: React.ReactNode, label: string, extra?: object) => (
    <button type="button" onClick={onClick} {...extra}
      className={`flex h-8 w-full items-center gap-3 rounded-full px-3 text-left text-[14px] ${active ? 'bg-[#d3e3fd] font-medium text-[#242424]' : 'text-[#242424] hover:bg-[#ececec]'}`}>
      <span className="text-[#6b6b6b]">{icon}</span> {label}
    </button>
  );
  const chip = (label: string, active: boolean, items: MenuEntry[], onClear?: () => void) => (
    <span className={`inline-flex h-8 items-center rounded-lg border text-[13px] font-medium ${active ? 'border-transparent bg-[#d3e3fd]' : 'border-[#d4d4d4] hover:bg-[#f6f6f6]'}`}>
      <button type="button" onClick={e => setMenu(anchorMenu(e.currentTarget, items))} className="flex h-full items-center gap-1.5 pl-3 pr-2">
        {active && <Check className="h-3.5 w-3.5" />}{label} <ChevronDown className="h-4 w-4 text-[#6b6b6b]" />
      </button>
      {active && onClear && <button type="button" onClick={onClear} aria-label={`Clear ${label}`} className="mr-1 rounded-full p-0.5 hover:bg-[rgba(0,0,0,0.08)]"><X className="h-3.5 w-3.5" /></button>}
    </span>
  );

  const detailsVisible = !picking && showDetails;
  // Location only when there's room for it next to the name (the details panel takes ~340px).
  const locCol = detailsVisible ? 'min-[1600px]:table-cell' : 'xl:table-cell';
  const uploadsActive = uploads.filter(u => u.status === 'uploading').length;

  return (
    <div
      className="relative flex h-full min-h-[480px] bg-[#f6f6f6] text-[#242424]"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={e => { if (isFileDrag(e)) e.preventDefault(); }}
      onDrop={onDrop}
    >
      <input ref={fileInput} type="file" multiple hidden accept={accept} onChange={e => { uploadFiles(Array.from(e.target.files ?? []).map(file => ({ file })), uploadTarget); e.target.value = ''; }} />
      <input ref={folderInput} type="file" multiple hidden {...{ webkitdirectory: '', directory: '' }}
        onChange={e => {
          const list = Array.from(e.target.files ?? []).map(file => {
            const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath ?? '';
            return { file, dir: rel.split('/').slice(0, -1).join('/') || undefined };
          });
          uploadFiles(list, uploadTarget);
          e.target.value = '';
        }} />

      {/* ── Left nav ── */}
      <nav className={`hidden shrink-0 flex-col pb-3 pl-3 pr-2 pt-3 md:flex ${picking ? 'w-[220px]' : 'w-[256px]'}`} aria-label="Library">
        <button type="button" disabled={notConfigured} onClick={e => setMenu(anchorMenu(e.currentTarget, newMenu))}
          className="mb-4 flex h-14 w-fit items-center gap-3 rounded-2xl bg-white pl-4 pr-6 text-[14px] font-medium shadow-[0_1px_3px_rgba(0,0,0,0.12),0_4px_10px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_2px_6px_rgba(0,0,0,0.16),0_8px_18px_rgba(0,0,0,0.08)] disabled:opacity-40">
          <Plus className="h-6 w-6" /> New
        </button>
        <div className="thin-scroll min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
          <div
            {...dropProps(ROOT)}
            className={`flex items-center rounded-full ${dropTarget === ROOT ? 'ring-2 ring-[#2467ac]' : ''}`}
            onContextMenu={e => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, items: newMenu }); }}
          >
            <button type="button" onClick={() => toggleTree(ROOT)} aria-label="Toggle folders" className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[#6b6b6b] hover:bg-[rgba(0,0,0,0.06)]">
              <ChevronRight className={`h-3.5 w-3.5 transition-transform ${expanded.has(ROOT) ? 'rotate-90' : ''}`} />
            </button>
            {navItem(section.type === 'folder' && prefix === ROOT && !searching, () => openFolder(ROOT), <HardDrive className="h-[18px] w-[18px]" />, 'My library')}
          </div>
          {expanded.has(ROOT) && tree[ROOT] && (
            <ul>
              {tree[ROOT].map(f => (
                <TreeNode key={f.prefix} folder={f} depth={1} tree={tree} expanded={expanded} active={section.type === 'folder' && !searching ? prefix : null} dropTarget={dropTarget}
                  onToggle={toggleTree} onOpen={openFolder} onDropKeys={moveKeys} onDragTarget={setDropTarget}
                  onContext={(e, folder) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, items: itemsMenu([folder.prefix]) }); }} />
              ))}
            </ul>
          )}
          <div className="pt-2">
            {navItem(section.type === 'recent' && !searching, () => go({ type: 'recent' }), <Clock className="h-[18px] w-[18px]" />, 'Recent')}
          </div>
          {KINDS.filter(k => !picking || !accept || matchesAccept({ contentType: `${k.kind}/x`, name: '' }, accept) || k.kind === 'document').map(k => (
            <div key={k.kind}>{navItem(section.type === 'kind' && section.kind === k.kind && !searching, () => go({ type: 'kind', kind: k.kind }), k.icon, k.label)}</div>
          ))}
        </div>
        {!picking && all && (
          <div className="mt-3 border-t border-[#e6e6e6] px-3 pt-3">
            <p className="flex items-center gap-2 text-[13px] text-[#242424]"><Files className="h-4 w-4 text-[#6b6b6b]" /> Storage</p>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#e6e6e6]">
              <div className="h-full rounded-full bg-[#2467ac]" style={{ width: `${Math.max(1, Math.min(100, (storageUsed / STORAGE_QUOTA) * 100))}%` }} />
            </div>
            <p className="mt-1.5 text-[12px] text-[#6b6b6b]">{formatBytes(storageUsed)} used · {all.length.toLocaleString()} files</p>
          </div>
        )}
      </nav>

      {/* ── Main panel ── */}
      <div className="flex min-w-0 flex-1 gap-3 py-3 pr-3 pl-3 md:pl-0">
        <section className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white">
          {/* Search + view controls */}
          <div className="flex items-center gap-2 px-4 pt-3 sm:px-5">
            <button type="button" onClick={e => setMenu(anchorMenu(e.currentTarget, newMenu))} aria-label="New" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f2f2f2] md:hidden"><Plus className="h-5 w-5" /></button>
            <label className="flex h-11 min-w-0 max-w-[720px] flex-1 items-center gap-3 rounded-full bg-[#f2f2f2] px-4 focus-within:bg-white focus-within:shadow-[0_1px_4px_rgba(0,0,0,0.18)]">
              <Search className="h-5 w-5 shrink-0 text-[#6b6b6b]" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search in library" aria-label="Search files"
                className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#6b6b6b]" />
              {q && <button type="button" onClick={() => setQ('')} aria-label="Clear search" className="rounded-full p-1 hover:bg-[#e6e6e6]"><X className="h-4 w-4 text-[#6b6b6b]" /></button>}
            </label>
            <div className="ml-auto flex shrink-0 items-center gap-1">
              <div className="flex overflow-hidden rounded-full border border-[#d4d4d4]">
                <button type="button" onClick={() => setLayout('list')} aria-label="List layout" aria-pressed={layout === 'list'} className={`flex h-9 w-11 items-center justify-center ${layout === 'list' ? 'bg-[#d3e3fd]' : 'hover:bg-[#f6f6f6]'}`}>
                  {layout === 'list' ? <Check className="h-4 w-4" /> : <ListIcon className="h-4 w-4" />}
                </button>
                <button type="button" onClick={() => setLayout('grid')} aria-label="Grid layout" aria-pressed={layout === 'grid'} className={`flex h-9 w-11 items-center justify-center border-l border-[#d4d4d4] ${layout === 'grid' ? 'bg-[#d3e3fd]' : 'hover:bg-[#f6f6f6]'}`}>
                  {layout === 'grid' ? <Check className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                </button>
              </div>
              {!picking && (
                <button type="button" onClick={() => setShowDetails(s => !s)} aria-label="Toggle details" aria-pressed={showDetails} title="View details"
                  className={`ml-1 hidden h-10 w-10 items-center justify-center rounded-full lg:flex ${showDetails ? 'bg-[#d3e3fd]' : 'hover:bg-[#f2f2f2]'}`}>
                  <Info className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Title / breadcrumbs */}
          <div className="flex min-h-[56px] items-center gap-1 px-4 pt-2 sm:px-5">
            {sectionTitle ? (
              <h2 className="truncate text-[22px] font-normal tracking-[-0.01em]">
                {sectionTitle}{searching && <span className="ml-2 text-[15px] text-[#6b6b6b]">for “{q.trim()}”</span>}
              </h2>
            ) : (
              <nav className="flex min-w-0 items-center gap-0.5 text-[22px] tracking-[-0.01em]" aria-label="Folder path">
                {crumbs(prefix ?? ROOT).map((c, i, arr) => {
                  const last = i === arr.length - 1;
                  return (
                    <span key={c.prefix} className={`flex items-center gap-0.5 ${last ? 'min-w-0' : 'shrink-0'}`}>
                      <button
                        type="button"
                        {...dropProps(c.prefix)}
                        onClick={e => {
                          if (!last) return openFolder(c.prefix);
                          if (picking) return;
                          setMenu(anchorMenu(e.currentTarget, c.prefix === ROOT ? newMenu : [...newMenu, 'sep', ...itemsMenu([c.prefix]).filter(it => it !== 'sep' && ['Rename', 'Move to…', 'Delete folder'].includes(it.label))]));
                        }}
                        className={`flex min-w-0 items-center gap-1 rounded-full px-3 py-1 ${last ? 'text-[#242424] hover:bg-[#f2f2f2]' : 'text-[#6b6b6b] hover:bg-[#f2f2f2]'} ${dropTarget === c.prefix ? 'ring-2 ring-[#2467ac]' : ''}`}
                      >
                        <span className="truncate">{i === 0 ? 'My library' : c.label}</span>
                        {last && !picking && <ChevronDown className="h-5 w-5 shrink-0" />}
                      </button>
                      {!last && <ChevronRight className="h-5 w-5 shrink-0 text-[#6b6b6b]" />}
                    </span>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Filter chips ⇄ selection toolbar */}
          <div className="flex min-h-[48px] flex-wrap items-center gap-2 px-4 pb-2 sm:px-5">
            {selected.length > 0 && !picking ? (
              <div className="flex h-10 flex-1 items-center gap-1 rounded-full bg-[#f2f2f2] pl-1 pr-2">
                <button type="button" onClick={() => setSelected([])} aria-label="Clear selection" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#e6e6e6]"><X className="h-4 w-4" /></button>
                <span className="mr-2 text-[14px] font-medium">{selected.length} selected</span>
                {selFiles.length > 0 && <button type="button" title="Download" aria-label="Download" onClick={() => downloadMany(selFiles)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#e6e6e6]"><Download className="h-4 w-4" /></button>}
                <button type="button" title="Move" aria-label="Move" onClick={() => setDialog({ type: 'move', keys: selected })} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#e6e6e6]"><FolderInput className="h-4 w-4" /></button>
                {selFiles.length > 0 && <button type="button" title="Copy links" aria-label="Copy links" onClick={() => copyLinks(selFiles)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#e6e6e6]"><Link2 className="h-4 w-4" /></button>}
                <button type="button" title="Delete" aria-label="Delete" onClick={() => askDelete(selected)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#e6e6e6]"><Trash2 className="h-4 w-4" /></button>
                <button type="button" title="More actions" aria-label="More actions" onClick={e => setMenu(anchorMenu(e.currentTarget, itemsMenu(selected)))} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#e6e6e6]"><MoreVertical className="h-4 w-4" /></button>
              </div>
            ) : (
              <>
                {chip(typeFilter === 'all' ? 'Type' : KINDS.find(k => k.kind === typeFilter)?.label ?? 'Other', typeFilter !== 'all',
                  [{ label: 'Any type', checked: typeFilter === 'all', onSelect: () => setTypeFilter('all') }, 'sep',
                    ...KINDS.map(k => ({ label: k.label, icon: k.icon, checked: typeFilter === k.kind, onSelect: () => setTypeFilter(k.kind) })),
                    { label: 'Other', icon: <FileGlyph kind="other" className="h-[18px] w-[18px]" />, checked: typeFilter === 'other', onSelect: () => setTypeFilter('other') }],
                  () => setTypeFilter('all'))}
                {chip(modified === 'any' ? 'Modified' : MODIFIED.find(m => m.key === modified)!.label, modified !== 'any',
                  MODIFIED.map(m => ({ label: m.label, checked: modified === m.key, onSelect: () => setModified(m.key) })), () => setModified('any'))}
                {layout === 'grid' && (
                  <span className="ml-auto">
                    {chip(sortBy === 'name' ? 'Name' : sortBy === 'size' ? 'Size' : 'Last modified', false, [
                      { label: 'Name', checked: sortBy === 'name', onSelect: () => { setSortBy('name'); setSortDir('asc'); } },
                      { label: 'Last modified', checked: sortBy === 'modified', onSelect: () => { setSortBy('modified'); setSortDir('desc'); } },
                      { label: 'Size', checked: sortBy === 'size', onSelect: () => { setSortBy('size'); setSortDir('desc'); } },
                      'sep',
                      { label: sortBy === 'name' ? 'A to Z' : sortBy === 'size' ? 'Smallest first' : 'Oldest first', checked: sortDir === 'asc', onSelect: () => setSortDir('asc') },
                      { label: sortBy === 'name' ? 'Z to A' : sortBy === 'size' ? 'Largest first' : 'Newest first', checked: sortDir === 'desc', onSelect: () => setSortDir('desc') },
                    ])}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Content */}
          <div
            ref={contentRef}
            className="thin-scroll min-h-0 flex-1 overflow-y-auto px-4 pb-28 sm:px-5"
            onClick={() => setSelected([])}
            onContextMenu={onBackgroundContext}
          >
            {notConfigured ? (
              <div className="mx-auto mt-16 max-w-[420px] text-center">
                <CloudOff className="mx-auto h-10 w-10 text-[#c4c4c4]" strokeWidth={1.2} />
                <h3 className="mt-4 text-[17px] font-semibold">Storage isn’t connected</h3>
                <p className="mt-2 text-[14px] leading-6 text-[#6b6b6b]">Set the Cloudflare R2 credentials (account id, access key, secret, bucket and <b>public URL</b>) in the environment or in Settings → Storage.</p>
              </div>
            ) : error ? (
              <div className="mt-10 flex items-center justify-center gap-2 text-[14px] text-[#c94a4a]"><AlertCircle className="h-4 w-4" /> {error.message}
                <button type="button" onClick={() => refresh()} className="ml-2 underline">Retry</button>
              </div>
            ) : loading || (searching && !searchResults) ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 pt-2">
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-[214px] animate-pulse rounded-xl bg-[#f4f4f4]" />)}
              </div>
            ) : shownFolders.length === 0 && shownFiles.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <svg viewBox="0 0 200 140" className="h-[140px] w-[200px]" aria-hidden>
                  <ellipse cx="100" cy="126" rx="70" ry="8" fill="#f2f2f2" />
                  <rect x="40" y="30" width="120" height="86" rx="12" fill="#eef4fb" />
                  <rect x="40" y="20" width="56" height="20" rx="7" fill="#d3e3fd" />
                  <path d="M100 58v34M84 74l16-16 16 16" stroke="#2467ac" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
                <p className="mt-6 text-[18px]">{searching ? 'No files match your search' : section.type === 'folder' ? 'Drop files here' : 'Nothing here yet'}</p>
                <p className="mt-1 text-[14px] text-[#6b6b6b]">{searching ? 'Try another name, or clear the filters' : section.type === 'folder' ? 'or use the “New” button.' : 'Upload files and they’ll show up here.'}</p>
                {section.type === 'folder' && !searching && (
                  <button type="button" onClick={e => { e.stopPropagation(); fileInput.current?.click(); }} className="mt-5 flex items-center gap-2 rounded-full bg-[#242424] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-black"><Upload className="h-4 w-4" /> Upload files</button>
                )}
              </div>
            ) : layout === 'grid' ? (
              <>
                {shownFolders.length > 0 && (
                  <section className="pt-2">
                    <h3 className="mb-3 text-[14px] font-medium">Folders</h3>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
                      {shownFolders.map(f => {
                        const sel = selected.includes(f.prefix);
                        return (
                          <div key={f.prefix} data-key={f.prefix} {...dragProps(f.prefix)} {...dropProps(f.prefix)}
                            onClick={e => clickItem(f.prefix, e)} onDoubleClick={() => openFolder(f.prefix)} onContextMenu={e => onItemContext(f.prefix, e)}
                            className={`group flex h-12 cursor-pointer select-none items-center gap-3 rounded-xl pl-4 pr-1 text-[14px] font-medium transition-colors ${sel ? 'bg-[#d3e3fd]' : 'bg-[#f4f4f4] hover:bg-[#ececec]'} ${dropTarget === f.prefix ? 'ring-2 ring-[#2467ac]' : ''}`}>
                            <FolderGlyph className="h-5 w-5 shrink-0" />
                            <span className="min-w-0 flex-1 truncate">{f.name}</span>
                            <button type="button" onClick={e => onKebab(f.prefix, e)} aria-label={`More actions for ${f.name}`} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-[rgba(0,0,0,0.08)] ${sel ? '' : 'opacity-0 group-hover:opacity-100'}`}><MoreVertical className="h-4 w-4" /></button>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
                {shownFiles.length > 0 && (
                  <section className="pt-6">
                    <h3 className="mb-3 text-[14px] font-medium">Files</h3>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
                      {shownFiles.map(item => {
                        const sel = selected.includes(item.key);
                        const used = usage[item.url]?.length ?? 0;
                        const kind = kindOf(item.contentType, item.name);
                        return (
                          <div key={item.key} data-key={item.key} data-file-card {...dragProps(item.key)}
                            onClick={e => clickItem(item.key, e)} onDoubleClick={() => openItem(item.key)} onContextMenu={e => onItemContext(item.key, e)}
                            className={`group cursor-pointer select-none rounded-xl px-2 pb-2 transition-colors ${sel ? 'bg-[#d3e3fd]' : 'bg-[#f4f4f4] hover:bg-[#ececec]'}`}>
                            <div className="flex h-11 items-center gap-2.5 pl-1.5">
                              <FileGlyph kind={kind} name={item.name} className="h-[18px] w-[18px] shrink-0" />
                              <span className="min-w-0 flex-1 truncate text-[14px] font-medium" title={displayName(item.name)}>{displayName(item.name)}</span>
                              <button type="button" onClick={e => onKebab(item.key, e)} aria-label={`More actions for ${displayName(item.name)}`} className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-[rgba(0,0,0,0.08)]"><MoreVertical className="h-4 w-4" /></button>
                            </div>
                            <div className="checker relative aspect-[4/3] overflow-hidden rounded-lg bg-white">
                              <Thumb item={item} />
                              {used > 0 && <span title={`Used in: ${usage[item.url].join(', ')}`} className="absolute bottom-2 left-2 rounded-full bg-[rgba(255,255,255,0.94)] px-2 py-0.5 text-[11px] font-medium text-[#1a6b17] shadow-sm">In use</span>}
                              {picking && sel && <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#2467ac] text-[#ffffff]"><Check className="h-4 w-4" strokeWidth={3} /></span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            ) : (
              <table className="w-full table-fixed text-left text-[14px]">
                <thead className="sticky top-0 z-10 bg-white text-[13px] text-[#6b6b6b]">
                  <tr className="border-b border-[#e6e6e6]">
                    <th className="py-2.5 pl-3 font-medium"><button type="button" onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-[#242424]">Name <SortArrow by="name" /></button></th>
                    {(section.type !== 'folder' || searching) && <th className={`hidden w-[170px] py-2.5 font-medium ${locCol}`}>Location</th>}
                    <th className="hidden w-[140px] py-2.5 font-medium sm:table-cell"><button type="button" onClick={() => toggleSort('modified')} className="flex items-center gap-1 hover:text-[#242424]">Last modified <SortArrow by="modified" /></button></th>
                    <th className="hidden w-[110px] py-2.5 font-medium md:table-cell"><button type="button" onClick={() => toggleSort('size')} className="flex items-center gap-1 hover:text-[#242424]">File size <SortArrow by="size" /></button></th>
                    <th className="w-12" />
                  </tr>
                </thead>
                <tbody>
                  {shownFolders.map(f => {
                    const sel = selected.includes(f.prefix);
                    return (
                      <tr key={f.prefix} data-key={f.prefix} {...dragProps(f.prefix)} {...dropProps(f.prefix)}
                        onClick={e => clickItem(f.prefix, e)} onDoubleClick={() => openFolder(f.prefix)} onContextMenu={e => onItemContext(f.prefix, e)}
                        className={`group cursor-pointer select-none border-b border-[#f0f0f0] ${sel ? 'bg-[#d3e3fd]' : 'hover:bg-[#f6f6f6]'} ${dropTarget === f.prefix ? 'outline outline-2 outline-[#2467ac]' : ''}`}>
                        <td className="py-2.5 pl-3"><span className="flex items-center gap-3"><FolderGlyph className="h-5 w-5 shrink-0" /><span className="truncate font-medium">{f.name}</span></span></td>
                        <td className="hidden py-2.5 text-[#6b6b6b] sm:table-cell">—</td>
                        <td className="hidden py-2.5 text-[#6b6b6b] md:table-cell">—</td>
                        <td className="py-1 text-right"><button type="button" onClick={e => onKebab(f.prefix, e)} aria-label={`More actions for ${f.name}`} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[rgba(0,0,0,0.08)]"><MoreVertical className="h-4 w-4" /></button></td>
                      </tr>
                    );
                  })}
                  {shownFiles.map(item => {
                    const sel = selected.includes(item.key);
                    const used = usage[item.url]?.length ?? 0;
                    const loc = folderOf(item.key);
                    return (
                      <tr key={item.key} data-key={item.key} {...dragProps(item.key)}
                        onClick={e => clickItem(item.key, e)} onDoubleClick={() => openItem(item.key)} onContextMenu={e => onItemContext(item.key, e)}
                        className={`group cursor-pointer select-none border-b border-[#f0f0f0] ${sel ? 'bg-[#d3e3fd]' : 'hover:bg-[#f6f6f6]'}`}>
                        <td className="py-2 pl-3">
                          <span className="flex items-center gap-3">
                            <span className="checker flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md">
                              {kindOf(item.contentType, item.name) === 'image' ? <Thumb item={item} /> : <FileGlyph kind={kindOf(item.contentType, item.name)} name={item.name} className="h-5 w-5" />}
                            </span>
                            <span className="min-w-0 truncate font-medium" title={displayName(item.name)}>{displayName(item.name)}</span>
                            {used > 0 && <span title={usage[item.url].join(', ')} className="shrink-0 rounded-full bg-[#eef7ee] px-2 py-0.5 text-[11px] font-medium text-[#1a6b17]">In use</span>}
                          </span>
                        </td>
                        {(section.type !== 'folder' || searching) && (
                          <td className={`hidden py-2 ${locCol}`}>
                            <button type="button" onClick={e => { e.stopPropagation(); openFolder(loc); }} className="flex max-w-full items-center gap-2 rounded-md px-1.5 py-0.5 text-[13px] text-[#6b6b6b] hover:bg-[#ececec]">
                              <FolderGlyph className="h-4 w-4 shrink-0" /><span className="truncate">{loc === ROOT ? 'My library' : crumbs(loc).pop()!.label}</span>
                            </button>
                          </td>
                        )}
                        <td className="hidden py-2 text-[#6b6b6b] sm:table-cell">{dateLabel(item.lastModified)}</td>
                        <td className="hidden py-2 text-[#6b6b6b] md:table-cell">{formatBytes(item.size)}</td>
                        <td className="py-1 text-right"><button type="button" onClick={e => onKebab(item.key, e)} aria-label={`More actions for ${displayName(item.name)}`} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[rgba(0,0,0,0.08)]"><MoreVertical className="h-4 w-4" /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pick bar */}
          {picking && (
            <div className="flex items-center gap-3 border-t border-[#f0f0f0] bg-white px-5 py-3">
              <span className="min-w-0 truncate text-[13px] text-[#6b6b6b]">
                {selFiles.length ? `${selFiles.length} selected` : multiple ? 'Select one or more files' : 'Select a file'}
                <span className="hidden text-[#9b9b9b] sm:inline"> · double-click to insert · drop files to upload</span>
              </span>
              <div className="ml-auto flex shrink-0 gap-2">
                <button type="button" onClick={onCancel} className="rounded-full px-4 py-2 text-[14px] hover:bg-[#f2f2f2]">Cancel</button>
                <button type="button" disabled={!selFiles.length} onClick={() => pick(selFiles)} className="rounded-full bg-[#1a8917] px-5 py-2 text-[14px] font-medium text-white hover:bg-[#156d12] disabled:opacity-40">
                  {multiple && selFiles.length > 1 ? `Insert ${selFiles.length}` : 'Insert'}
                </button>
              </div>
            </div>
          )}

          {/* Drop overlay */}
          {dragOver && (
            <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-end rounded-2xl border-2 border-[#2467ac] bg-[rgba(36,103,172,0.06)] pb-10">
              <div className="flex items-center gap-3 rounded-full bg-[#2467ac] px-6 py-3 text-[15px] font-medium text-[#ffffff] shadow-lg">
                <Upload className="h-5 w-5" /> Drop files to upload them to {prefix && prefix !== ROOT ? `“${crumbs(prefix).pop()!.label}”` : 'My library'}
              </div>
            </div>
          )}
        </section>

        {/* Details */}
        {detailsVisible && (
          <div className="hidden lg:block">
            <Details target={selTarget} usage={usage} onClose={() => setShowDetails(false)}
              onPreview={item => { const i = shownFiles.findIndex(f => f.key === item.key); if (i >= 0) setPreview(i); }}
              onNavigate={p => openFolder(p)} />
          </div>
        )}
      </div>

      {/* Toasts (bottom-left, Drive-style) */}
      <div className="pointer-events-none fixed bottom-6 left-6 z-[330] flex flex-col gap-2">
        {busy && <div className="flex items-center gap-3 rounded-lg bg-[#242424] px-4 py-3 text-[14px] text-white shadow-xl"><Loader2 className="h-4 w-4 animate-spin" /> {busy}</div>}
        {toasts.map(t => <div key={t.id} className="animate-[toast-in_180ms_ease-out] rounded-lg bg-[#242424] px-4 py-3 text-[14px] text-white shadow-xl">{t.text}</div>)}
      </div>

      {/* Upload tray (bottom-right, Drive-style) */}
      {uploads.length > 0 && (
        <div className="fixed bottom-0 right-6 z-[330] w-[360px] overflow-hidden rounded-t-2xl bg-white shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-2 bg-[#f2f2f2] py-2.5 pl-5 pr-2">
            <p className="flex-1 text-[15px] font-medium">
              {uploadsActive ? `Uploading ${uploadsActive} item${uploadsActive > 1 ? 's' : ''}` : `${uploads.filter(u => u.status === 'done').length} upload${uploads.length > 1 ? 's' : ''} complete`}
            </p>
            <button type="button" onClick={() => setTrayOpen(o => !o)} aria-label={trayOpen ? 'Collapse' : 'Expand'} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#e6e6e6]"><ChevronDown className={`h-5 w-5 transition-transform ${trayOpen ? '' : 'rotate-180'}`} /></button>
            {!uploadsActive && <button type="button" onClick={() => setUploads([])} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-[#e6e6e6]"><X className="h-5 w-5" /></button>}
          </div>
          {trayOpen && (
            <ul className="thin-scroll max-h-[260px] overflow-y-auto">
              {uploads.map(u => (
                <li key={u.id} className="flex items-center gap-3 px-5 py-2.5">
                  <FileGlyph kind={kindOf('', u.name)} name={u.name} className="h-5 w-5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px]">{u.name}</p>
                    {u.status === 'error' && <p className="truncate text-[12px] text-[#c94a4a]" title={u.error}>{u.error}</p>}
                  </div>
                  {u.status === 'done' ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1a8917]"><Check className="h-4 w-4 text-white" strokeWidth={3} /></span>
                  ) : u.status === 'error' ? (
                    <AlertCircle className="h-5 w-5 text-[#c94a4a]" />
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-6 w-6 -rotate-90" aria-label={`${u.pct}%`}>
                      <circle cx="12" cy="12" r="9" fill="none" stroke="#e6e6e6" strokeWidth="3" />
                      <circle cx="12" cy="12" r="9" fill="none" stroke="#2467ac" strokeWidth="3" strokeDasharray={`${(u.pct / 100) * 56.5} 56.5`} strokeLinecap="round" />
                    </svg>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Menu state={menu} onClose={() => setMenu(null)} />

      {preview !== null && shownFiles[preview] && (
        <Preview items={shownFiles} index={preview} onIndex={setPreview} onClose={() => setPreview(null)}
          onInfo={picking ? undefined : item => { setPreview(null); setSelected([item.key]); setShowDetails(true); }}
          extraActions={picking ? item => (
            <button type="button" onClick={() => { setPreview(null); pick([item]); }} className="mr-1 rounded-full bg-[#1a8917] px-4 py-2 text-[14px] font-medium text-white hover:bg-[#156d12]">Insert</button>
          ) : undefined} />
      )}

      {dialog?.type === 'newFolder' && <PromptDialog title="New folder" initial="Untitled folder" okLabel="Create" onSubmit={createFolder} onClose={() => setDialog(null)} />}
      {dialog?.type === 'import' && <PromptDialog title="Import from URL" label="The file is copied into the current folder." placeholder="https://…" okLabel="Import" onSubmit={importUrl} onClose={() => setDialog(null)} />}
      {dialog?.type === 'rename' && <PromptDialog title="Rename" initial={dialog.name} selectBase={!dialog.folder} okLabel="OK" onSubmit={v => { if (v !== dialog.name) rename(dialog.key, v); }} onClose={() => setDialog(null)} />}
      {dialog?.type === 'move' && (
        <MoveDialog count={dialog.keys.length} from={prefix ?? folderOf(dialog.keys[0])} exclude={dialog.keys.filter(isFolderKey)}
          onClose={() => setDialog(null)} onMove={to => { const keys = dialog.keys; setDialog(null); moveKeys(keys, to); }} />
      )}
      {dialog?.type === 'delete' && (() => {
        const keys = dialog.keys;
        const nFolders = keys.filter(isFolderKey).length;
        const inUse = keys.filter(k => !isFolderKey(k) && usage[fileByKey.get(k)?.url ?? '']?.length).length;
        const single = keys.length === 1 ? (isFolderKey(keys[0]) ? keys[0].slice(parentPrefix(keys[0]).length, -1) : displayName(fileByKey.get(keys[0])?.name ?? '')) : null;
        return (
          <ConfirmDialog
            title={single ? `Delete “${single}”?` : `Delete ${keys.length} items?`}
            okLabel="Delete forever"
            body={<>
              <p>This permanently removes {single ? 'it' : 'them'} from the bucket{nFolders ? ', including everything inside the folder' + (nFolders > 1 ? 's' : '') : ''}. It can’t be undone.</p>
              {inUse > 0 && <p className="mt-3 rounded-lg bg-[#fdf6e7] px-3 py-2 text-[13px] text-[#7a5a00]">{inUse === 1 && single ? 'This file is' : `${inUse} file${inUse > 1 ? 's are' : ' is'}`} used on the site — those pages will show a broken image.</p>}
            </>}
            onConfirm={() => removeKeys(keys)}
            onClose={() => setDialog(null)}
          />
        );
      })()}
    </div>
  );
}
