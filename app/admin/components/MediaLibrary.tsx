'use client';

import {
  useCallback, useEffect, useRef, useState, useMemo,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check, Copy, ImageIcon, FileVideo, Trash2, Upload,
  AlertCircle, Loader2, ChevronLeft, ChevronRight, X,
  ArrowUpDown, Link2, CheckSquare, Square, Folder, FolderPlus,
  MoveRight, Download, ExternalLink, Pencil, Code2, Eye,
} from 'lucide-react';
import type { MediaFile, MediaFolder } from '@/lib/r2';

// ─── Types ────────────────────────────────────────────────────────────────────
type FilterKind = 'all' | 'image' | 'video' | 'pdf' | 'other';
type SortBy     = 'date-desc' | 'date-asc' | 'name' | 'size';

interface UploadEntry {
  id:       string;
  filename: string;
  progress: number;
  error?:   string;
}

type CtxItem =
  | { kind: 'action'; label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }
  | { kind: 'separator' }
  | { kind: 'label'; text: string };

type CtxMenuState = {
  x:      number;
  y:      number;
  target: { type: 'file'; file: MediaFile } | { type: 'folder'; folder: MediaFolder };
} | null;

const EXPO          = [0.16, 1, 0.3, 1] as const;
// Custom drag-data type so DropZone can distinguish card drags from OS file drops
const DT_MEDIA_KEY  = 'application/x-media-key';

// ─── Utilities ────────────────────────────────────────────────────────────────
function formatBytes(b: number) {
  if (b < 1024)         return `${b} B`;
  if (b < 1024 * 1024)  return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function getKind(ct: string): FilterKind {
  if (ct.startsWith('image/'))       return 'image';
  if (ct.startsWith('video/'))       return 'video';
  if (ct === 'application/pdf')      return 'pdf';
  return 'other';
}

function fileTypeBadge(contentType: string, name: string): { bg: string; label: string } {
  if (contentType === 'application/pdf')   return { bg: 'bg-red-500',    label: 'PDF'  };
  if (contentType.includes('zip') || contentType.includes('rar'))
                                            return { bg: 'bg-amber-500',  label: 'ZIP'  };
  if (contentType.includes('word') || name.endsWith('.docx') || name.endsWith('.doc'))
                                            return { bg: 'bg-blue-600',   label: 'DOC'  };
  if (contentType.includes('excel') || contentType.includes('spreadsheet') || name.endsWith('.xlsx'))
                                            return { bg: 'bg-green-600',  label: 'XLS'  };
  if (contentType.startsWith('text/'))      return { bg: 'bg-zinc-500',   label: 'TXT'  };
  const ext = name.split('.').pop()?.toUpperCase().slice(0, 4);
  return { bg: 'bg-zinc-600', label: ext || 'FILE' };
}

function sortFiles(files: MediaFile[], by: SortBy): MediaFile[] {
  const arr = [...files];
  if (by === 'date-desc') arr.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
  if (by === 'date-asc')  arr.sort((a, b) => new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime());
  if (by === 'name')      arr.sort((a, b) => a.name.localeCompare(b.name));
  if (by === 'size')      arr.sort((a, b) => b.size - a.size);
  return arr;
}

function parseBreadcrumb(prefix: string): string[] {
  return prefix.replace(/^media\//, '').split('/').filter(Boolean);
}

function buildPrefix(segments: string[]): string {
  return 'media/' + (segments.length ? segments.join('/') + '/' : '');
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

function triggerDownload(url: string, filename: string) {
  fetch(url)
    .then(r => r.blob())
    .then(blob => {
      const a = document.createElement('a');
      a.href  = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch(() => window.open(url, '_blank'));
}

// ─── Context Menu ─────────────────────────────────────────────────────────────
function ContextMenu({ x, y, items, onClose }: {
  x: number; y: number; items: CtxItem[]; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  useEffect(() => {
    if (!ref.current) return;
    const { width, height } = ref.current.getBoundingClientRect();
    setPos({
      x: Math.max(4, Math.min(x, window.innerWidth  - width  - 4)),
      y: Math.max(4, Math.min(y, window.innerHeight - height - 4)),
    });
  }, [x, y]);

  useEffect(() => {
    const onMouse  = (e: MouseEvent)    => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const onKey    = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const onScroll = ()                 => onClose();
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown',   onKey);
    window.addEventListener('scroll',      onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener('mousedown', onMouse);
      document.removeEventListener('keydown',   onKey);
      window.removeEventListener('scroll',      onScroll, { capture: true });
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999 }}
      className="min-w-[192px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl py-1"
      onContextMenu={e => e.preventDefault()}
    >
      {items.map((item, i) => {
        if (item.kind === 'separator') return <div key={i} className="my-1 border-t border-zinc-100 dark:border-zinc-800" />;
        if (item.kind === 'label')     return <p key={i} className="px-3 pt-1.5 pb-0.5 font-mono text-[8px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">{item.text}</p>;
        return (
          <button key={i} type="button" onClick={() => { item.onClick(); onClose(); }}
            className={[
              'flex w-full items-center gap-2.5 px-3 py-1.5 font-mono text-[10px] text-left transition-colors',
              item.danger
                ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800',
            ].join(' ')}>
            <span className="h-3 w-3 shrink-0 flex items-center">{item.icon}</span>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
function Breadcrumb({
  prefix, isDragging, dragOverPrefix, onNavigate, onNewFolder, onDragOverPrefix, onDropOnPrefix,
}: {
  prefix:          string;
  isDragging:      boolean;
  dragOverPrefix:  string | null;
  onNavigate:      (prefix: string) => void;
  onNewFolder:     () => void;
  onDragOverPrefix:(prefix: string | null) => void;
  onDropOnPrefix:  (prefix: string) => void;
}) {
  const segments = parseBreadcrumb(prefix);

  // Each ancestor segment (root + all but last) is a drop target when dragging
  const ancestorPrefixes: Array<{ label: string; prefix: string }> = [
    { label: 'Media', prefix: 'media/' },
    ...segments.slice(0, -1).map((seg, i) => ({
      label: seg,
      prefix: buildPrefix(segments.slice(0, i + 1)),
    })),
  ];

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1 font-mono text-[10px] flex-wrap">

        {/* Root "Media" segment */}
        <DropSegment
          label="Media"
          targetPrefix="media/"
          isDragging={isDragging}
          isOver={dragOverPrefix === 'media/'}
          isAncestor={prefix !== 'media/'}
          onClick={() => onNavigate('media/')}
          onDragOver={() => onDragOverPrefix('media/')}
          onDragLeave={() => onDragOverPrefix(null)}
          onDrop={() => onDropOnPrefix('media/')}
        />

        {segments.map((seg, i) => {
          const isLast     = i === segments.length - 1;
          const segPrefix  = buildPrefix(segments.slice(0, i + 1));
          const isAncestor = !isLast;
          return (
            <span key={i} className="flex items-center gap-1">
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              {isLast ? (
                <span className="font-bold text-zinc-900 dark:text-zinc-50">{seg}</span>
              ) : (
                <DropSegment
                  label={seg}
                  targetPrefix={segPrefix}
                  isDragging={isDragging}
                  isOver={dragOverPrefix === segPrefix}
                  isAncestor={isAncestor}
                  onClick={() => onNavigate(segPrefix)}
                  onDragOver={() => onDragOverPrefix(segPrefix)}
                  onDragLeave={() => onDragOverPrefix(null)}
                  onDrop={() => onDropOnPrefix(segPrefix)}
                />
              )}
            </span>
          );
        })}
      </div>

      <button type="button" onClick={onNewFolder}
        className="flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-100 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
        <FolderPlus className="h-3 w-3" />
        New Folder
      </button>
    </div>
  );
}

function DropSegment({
  label, targetPrefix, isDragging, isOver, isAncestor, onClick,
  onDragOver, onDragLeave, onDrop,
}: {
  label:        string;
  targetPrefix: string;
  isDragging:   boolean;
  isOver:       boolean;
  isAncestor:   boolean;
  onClick:      () => void;
  onDragOver:   () => void;
  onDragLeave:  () => void;
  onDrop:       () => void;
}) {
  const dragCounter = useRef(0);
  return (
    <button
      type="button"
      onClick={onClick}
      onDragEnter={e => {
        if (!e.dataTransfer.types.includes(DT_MEDIA_KEY)) return;
        e.preventDefault();
        dragCounter.current++;
        onDragOver();
      }}
      onDragOver={e => {
        if (!e.dataTransfer.types.includes(DT_MEDIA_KEY)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDragLeave={() => {
        dragCounter.current--;
        if (dragCounter.current <= 0) { dragCounter.current = 0; onDragLeave(); }
      }}
      onDrop={e => {
        e.preventDefault();
        dragCounter.current = 0;
        onDragLeave();
        onDrop();
      }}
      className={[
        'rounded px-1.5 py-0.5 transition-all duration-150',
        isDragging && isAncestor
          ? isOver
            ? 'bg-[#2467AC] text-white scale-105'
            : 'text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-900 dark:hover:border-zinc-100 hover:text-zinc-900 dark:hover:text-zinc-100'
          : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

// ─── Folder Card ──────────────────────────────────────────────────────────────
function FolderCard({
  folder, isDropTarget, onContextMenu,
  onClick, onDragEnter, onDragLeave, onDrop,
}: {
  folder:        MediaFolder;
  isDropTarget:  boolean;
  onClick:       () => void;
  onContextMenu: (e: React.MouseEvent, folder: MediaFolder) => void;
  onDragEnter:   () => void;
  onDragLeave:   () => void;
  onDrop:        () => void;
}) {
  const dragCounter = useRef(0);
  const [flash, setFlash] = useState<'none' | 'success'>('none');

  const handleDrop = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(DT_MEDIA_KEY)) return;
    e.preventDefault();
    dragCounter.current = 0;
    onDragLeave();
    onDrop();
    setFlash('success');
    setTimeout(() => setFlash('none'), 700);
  };

  return (
    <motion.button
      type="button"
      layout
      onClick={onClick}
      onContextMenu={e => { e.preventDefault(); onContextMenu(e, folder); }}
      onDragEnter={e => {
        if (!e.dataTransfer.types.includes(DT_MEDIA_KEY)) return;
        e.preventDefault();
        dragCounter.current++;
        onDragEnter();
      }}
      onDragOver={e => {
        if (!e.dataTransfer.types.includes(DT_MEDIA_KEY)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDragLeave={() => {
        dragCounter.current--;
        if (dragCounter.current <= 0) { dragCounter.current = 0; onDragLeave(); }
      }}
      onDrop={handleDrop}
      animate={
        flash === 'success'
          ? { borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.08)' }
          : isDropTarget
          ? { borderColor: '#2467AC', backgroundColor: 'rgba(36,103,172,0.06)', scale: 1.04 }
          : { borderColor: 'transparent', scale: 1 }
      }
      transition={{ duration: 0.15 }}
      className={[
        'group flex flex-col border transition-colors duration-150 text-left',
        flash === 'success'
          ? 'border-emerald-400'
          : isDropTarget
          ? 'border-[#2467AC]'
          : 'border-zinc-200 dark:border-zinc-800 hover:border-[#2467AC]',
      ].join(' ')}
    >
      <div className={[
        'aspect-video flex items-center justify-center transition-colors',
        flash === 'success'
          ? 'bg-emerald-50 dark:bg-emerald-950/20'
          : isDropTarget
          ? 'bg-blue-50/70 dark:bg-blue-950/30'
          : 'bg-zinc-50 dark:bg-zinc-900 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-950/20',
      ].join(' ')}>
        <Folder className={[
          'h-10 w-10 transition-colors',
          flash === 'success'
            ? 'text-emerald-500'
            : isDropTarget
            ? 'text-[#2467AC] scale-110'
            : 'text-zinc-300 dark:text-zinc-700 group-hover:text-[#2467AC]',
        ].join(' ')} />
      </div>
      <div className="p-2">
        <p className="truncate font-mono text-[10px] font-bold text-zinc-700 dark:text-zinc-300">{folder.name}</p>
        <p className={[
          'font-mono text-[9px] transition-colors',
          isDropTarget ? 'text-[#2467AC]' : 'text-zinc-400 dark:text-zinc-600',
        ].join(' ')}>
          {isDropTarget ? 'Drop to move here' : 'Folder'}
        </p>
      </div>
    </motion.button>
  );
}

// ─── File Type Thumbnail ──────────────────────────────────────────────────────
function FileTypeThumb({ file, videoRef }: { file: MediaFile; videoRef?: React.RefObject<HTMLVideoElement> }) {
  const kind = getKind(file.contentType);
  if (kind === 'image') return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={file.url} alt={file.name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
  );
  if (kind === 'video') return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video ref={videoRef} src={file.url} muted loop playsInline className="h-full w-full object-cover"
      onMouseEnter={() => videoRef?.current?.play()}
      onMouseLeave={() => { if (videoRef?.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; } }} />
  );
  const { bg, label } = fileTypeBadge(file.contentType, file.name);
  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-1.5 ${bg}`}>
      <span className="font-mono text-xl font-black text-white/90">{label}</span>
    </div>
  );
}

// ─── Move Popover ─────────────────────────────────────────────────────────────
function MovePopover({
  allFolders, currentPrefix, onMove, onClose,
}: {
  allFolders:    MediaFolder[];
  currentPrefix: string;
  onMove:        (targetPrefix: string) => void;
  onClose:       () => void;
}) {
  const targets = [
    { prefix: 'media/', name: 'Root' },
    ...allFolders.filter(f => f.prefix !== currentPrefix),
  ];
  return (
    <div className="absolute bottom-full left-0 z-20 mb-1 min-w-[140px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg">
      <p className="px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">Move to</p>
      {targets.map(t => (
        <button key={t.prefix} type="button" onClick={() => { onMove(t.prefix); onClose(); }}
          className="flex w-full items-center gap-2 px-3 py-1.5 font-mono text-[10px] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
          <Folder className="h-3 w-3 text-zinc-400" />
          {t.name}
        </button>
      ))}
      {targets.length === 0 && <p className="px-3 py-2 font-mono text-[10px] text-zinc-400">No other folders</p>}
    </div>
  );
}

// ─── File Card ────────────────────────────────────────────────────────────────
function FileCard({
  file, pickerMode, isUsed, isSelected, isDragging, currentPrefix, allFolders,
  forceRenaming, onRenameForced,
  onSelect, onCopy, onDelete, onPreview, onToggleSelect, onRename, onMove, onContextMenu,
  onDragStart, onDragEnd,
}: {
  file:           MediaFile;
  pickerMode:     boolean;
  isUsed:         boolean;
  isSelected:     boolean;
  isDragging:     boolean;
  currentPrefix:  string;
  allFolders:     MediaFolder[];
  forceRenaming:  boolean;
  onRenameForced: () => void;
  onSelect:       (url: string) => void;
  onCopy:         (url: string) => void;
  onDelete:       (key: string) => void;
  onPreview:      (file: MediaFile) => void;
  onToggleSelect: (key: string) => void;
  onRename:       (key: string, newName: string) => void;
  onMove:         (key: string, targetPrefix: string) => void;
  onContextMenu:  (e: React.MouseEvent, file: MediaFile) => void;
  onDragStart:    (file: MediaFile) => void;
  onDragEnd:      () => void;
}) {
  const [copied,   setCopied]   = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameVal,  setNameVal]  = useState(file.name);
  const [showMove, setShowMove] = useState(false);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (forceRenaming && !renaming) setRenaming(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceRenaming]);

  const handleCopy = async () => {
    await onCopy(file.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const commitRename = () => {
    setRenaming(false);
    onRenameForced();
    if (nameVal.trim() && nameVal !== file.name) onRename(file.key, nameVal.trim());
    else setNameVal(file.name);
  };

  useEffect(() => { if (renaming) inputRef.current?.select(); }, [renaming]);

  return (
    <div
      draggable={!renaming}
      onDragStart={e => {
        e.dataTransfer.setData(DT_MEDIA_KEY, file.key);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(file);
      }}
      onDragEnd={onDragEnd}
      onContextMenu={e => { e.preventDefault(); onContextMenu(e, file); }}
      className={[
        'group relative flex flex-col border transition-all duration-150',
        isDragging
          ? 'opacity-40 scale-95 cursor-grabbing'
          : 'cursor-grab',
        isSelected
          ? 'border-[#2467AC]'
          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600',
      ].join(' ')}
    >

      {/* Checkbox */}
      <button type="button" onClick={() => onToggleSelect(file.key)}
        className={['absolute left-1.5 top-1.5 z-10 transition-opacity', isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'].join(' ')}>
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

      {/* Thumbnail — drag handle doubles as preview trigger */}
      <button type="button" onClick={() => onPreview(file)}
        onMouseDown={e => e.stopPropagation()} // don't interfere with card drag
        className="aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        <FileTypeThumb file={file} videoRef={videoRef} />
      </button>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-2">
        {renaming ? (
          <input ref={inputRef} value={nameVal} onChange={e => setNameVal(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') { setRenaming(false); setNameVal(file.name); onRenameForced(); } }}
            className="w-full bg-transparent font-mono text-[10px] text-zinc-900 dark:text-zinc-100 outline-none border-b border-[#2467AC]" />
        ) : (
          <p className="truncate font-mono text-[10px] text-zinc-700 dark:text-zinc-300 cursor-text"
            title="Double-click to rename"
            onDoubleClick={() => setRenaming(true)}>
            {file.name}
          </p>
        )}
        <p className="font-mono text-[9px] text-zinc-400 dark:text-zinc-600">{formatBytes(file.size)}</p>
      </div>

      {/* Actions */}
      <div className="relative flex items-center gap-1 border-t border-zinc-100 dark:border-zinc-900 px-2 py-1.5">
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
        <button type="button" onClick={() => setShowMove(s => !s)}
          className="p-1 text-zinc-300 dark:text-zinc-700 hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
          <MoveRight className="h-3 w-3" />
        </button>
        <button type="button" onClick={() => onDelete(file.key)}
          className="p-1 text-zinc-300 dark:text-zinc-700 hover:text-red-500 transition-colors">
          <Trash2 className="h-3 w-3" />
        </button>
        {showMove && (
          <MovePopover allFolders={allFolders} currentPrefix={currentPrefix}
            onMove={prefix => onMove(file.key, prefix)} onClose={() => setShowMove(false)} />
        )}
      </div>
    </div>
  );
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────
function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef   = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const isCardDrag = (e: React.DragEvent) => e.dataTransfer.types.includes(DT_MEDIA_KEY);

  return (
    <div
      onDragEnter={e => {
        if (isCardDrag(e)) return;
        e.preventDefault();
        dragCounter.current++;
        setDragging(true);
      }}
      onDragOver={e => {
        if (isCardDrag(e)) return;
        e.preventDefault();
      }}
      onDragLeave={() => {
        dragCounter.current--;
        if (dragCounter.current <= 0) { dragCounter.current = 0; setDragging(false); }
      }}
      onDrop={e => {
        if (isCardDrag(e)) return;
        e.preventDefault();
        dragCounter.current = 0;
        setDragging(false);
        const f = Array.from(e.dataTransfer.files);
        if (f.length) onFiles(f);
      }}
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
        Drop files or click — uploads go into current folder
      </p>
      <input ref={inputRef} type="file" multiple hidden
        onChange={e => { if (e.target.files?.length) { onFiles(Array.from(e.target.files)); e.target.value = ''; } }} />
    </div>
  );
}

// ─── Preview Modal ────────────────────────────────────────────────────────────
function PreviewModal({
  file, files, onClose, onSelect,
}: {
  file:      MediaFile;
  files:     MediaFile[];
  onClose:   () => void;
  onSelect?: (url: string) => void;
}) {
  const [current, setCurrent] = useState(file);
  const [copied,  setCopied]  = useState(false);
  useEffect(() => setCurrent(file), [file]);

  const curIdx  = files.findIndex(f => f.key === current.key);
  const curPrev = files[curIdx - 1] ?? null;
  const curNext = files[curIdx + 1] ?? null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowLeft')  curPrev && setCurrent(curPrev);
      if (e.key === 'ArrowRight') curNext && setCurrent(curNext);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [curPrev, curNext, onClose]);

  const copy = async () => {
    await navigator.clipboard.writeText(current.url);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const kind = getKind(current.contentType);

  return (
    <AnimatePresence>
      <motion.div key="pb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-zinc-900/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div key="pp" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: EXPO }}
        className="fixed inset-0 z-[71] flex items-center justify-center p-4 sm:p-8" style={{ pointerEvents: 'none' }}>
        <div className="flex w-full max-w-4xl flex-col bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-hidden max-h-[90vh]"
          style={{ pointerEvents: 'auto' }} onClick={e => e.stopPropagation()}>
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 gap-3">
            <p className="font-mono text-xs text-zinc-900 dark:text-zinc-100 truncate flex-1">{current.name}</p>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-[10px] text-zinc-400">{formatBytes(current.size)}</span>
              <span className="font-mono text-[10px] text-zinc-400">{current.contentType}</span>
              <button type="button" onClick={() => triggerDownload(current.url, current.name)}
                className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" title="Download">
                <Download className="h-4 w-4" />
              </button>
              <button type="button" onClick={onClose}
                className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="relative flex-1 min-h-0 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
            {kind === 'image' && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.url} alt={current.name} className="max-h-[60vh] max-w-full object-contain" />
            )}
            {kind === 'video' && (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={current.url} controls className="max-h-[60vh] max-w-full" />
            )}
            {(kind === 'pdf' || kind === 'other') && (
              <div className="flex flex-col items-center gap-3">
                {(() => { const { bg, label } = fileTypeBadge(current.contentType, current.name); return (
                  <div className={`flex h-24 w-20 items-center justify-center ${bg}`}>
                    <span className="font-mono text-2xl font-black text-white">{label}</span>
                  </div>
                ); })()}
                <a href={current.url} target="_blank" rel="noopener noreferrer"
                  className="font-mono text-[10px] uppercase tracking-widest text-[#2467AC] hover:underline">
                  Open file ↗
                </a>
              </div>
            )}
            {curPrev && (
              <button type="button" onClick={() => setCurrent(curPrev)}
                className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {curNext && (
              <button type="button" onClick={() => setCurrent(curNext)}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MediaLibrary({
  onSelect, usedUrls,
}: {
  onSelect?:  (url: string) => void;
  usedUrls?:  Set<string>;
}) {
  const pickerMode = !!onSelect;

  const [files,         setFiles]         = useState<MediaFile[]>([]);
  const [folders,       setFolders]       = useState<MediaFolder[]>([]);
  const [allTopFolders, setAllTopFolders] = useState<MediaFolder[]>([]);
  const [uploads,       setUploads]       = useState<UploadEntry[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [r2Ok,          setR2Ok]          = useState<boolean | null>(null);
  const [filter,        setFilter]        = useState<FilterKind>('all');
  const [search,        setSearch]        = useState('');
  const [sortBy,        setSortBy]        = useState<SortBy>('date-desc');
  const [selected,      setSelected]      = useState<Set<string>>(new Set());
  const [preview,       setPreview]       = useState<MediaFile | null>(null);
  const [currentPrefix, setCurrentPrefix] = useState('media/');
  const [importUrl,     setImportUrl]     = useState('');
  const [importing,     setImporting]     = useState(false);
  const [renamingKey,   setRenamingKey]   = useState<string | null>(null);
  const [ctxMenu,       setCtxMenu]       = useState<CtxMenuState>(null);

  // ── Drag state ────────────────────────────────────────────────────────────
  const [draggingFile,  setDraggingFile]  = useState<MediaFile | null>(null);
  const [dragOverPrefix,setDragOverPrefix]= useState<string | null>(null);

  const closeCtxMenu = useCallback(() => setCtxMenu(null), []);

  // ── Load current folder ───────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setFiles([]);
    setFolders([]);
    setSelected(new Set());
    fetch(`/api/admin/media?prefix=${encodeURIComponent(currentPrefix)}`)
      .then(r => {
        if (r.status === 503) { setR2Ok(false); return null; }
        if (!r.ok) throw new Error(`${r.status}`);
        setR2Ok(true);
        return r.json();
      })
      .then((data: { files: MediaFile[]; folders: MediaFolder[] } | null) => {
        if (!data) return;
        setFiles(Array.isArray(data.files) ? data.files : []);
        setFolders(Array.isArray(data.folders) ? data.folders : []);
      })
      .catch(() => setR2Ok(false))
      .finally(() => setLoading(false));
  }, [currentPrefix]);

  // ── Load all top-level folders once (for Move targets) ───────────────────
  useEffect(() => {
    fetch('/api/admin/media?prefix=media/')
      .then(r => r.ok ? r.json() : null)
      .then((data: { files: MediaFile[]; folders: MediaFolder[] } | null) => {
        if (data?.folders) setAllTopFolders(data.folders);
      })
      .catch(() => {});
  }, []);

  // ── Clipboard paste ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const f = Array.from(e.clipboardData?.files ?? []);
      if (f.length) { e.preventDefault(); handleFiles(f); }
    };
    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPrefix]);

  // ── Upload ────────────────────────────────────────────────────────────────
  const uploadFile = useCallback(async (file: File, prefix: string): Promise<MediaFile | null> => {
    const compressed = await compressImage(file);
    const id = Math.random().toString(36).slice(2);
    const folder = prefix.replace(/^media\//, '').replace(/\/$/, '');
    setUploads(u => [...u, { id, filename: compressed.name, progress: 0 }]);
    try {
      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ filename: compressed.name, contentType: compressed.type, folder }),
      });
      if (!res.ok) throw new Error('Presign failed');
      const { signedUrl, publicUrl, key } = await res.json();
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedUrl);
        xhr.setRequestHeader('Content-Type', compressed.type);
        xhr.upload.onprogress = e => {
          if (e.lengthComputable)
            setUploads(u => u.map(x => x.id === id ? { ...x, progress: Math.round(e.loaded / e.total * 100) } : x));
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
      const result = await uploadFile(file, currentPrefix);
      if (result) setFiles(f => [result, ...f]);
    }
  }, [uploadFile, currentPrefix]);

  // ── New folder ────────────────────────────────────────────────────────────
  const createFolder = async (parentPrefix = currentPrefix) => {
    const raw = window.prompt('Folder name:')?.trim().replace(/[^a-zA-Z0-9_-]/g, '');
    if (!raw) return;
    const prefix = parentPrefix + raw + '/';
    await fetch('/api/admin/media', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'createFolder', prefix }),
    });
    if (parentPrefix === currentPrefix) setFolders(f => [...f, { prefix, name: raw }]);
    if (parentPrefix === 'media/') setAllTopFolders(f => [...f, { prefix, name: raw }]);
  };

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

  const deleteFolder = async (folder: MediaFolder) => {
    if (!confirm(`Delete folder "${folder.name}" and all its contents?`)) return;
    const res = await fetch(`/api/admin/media?prefix=${encodeURIComponent(folder.prefix)}`);
    const data = res.ok ? await res.json() : { files: [] };
    const keys: string[] = [
      ...((data.files as MediaFile[]) ?? []).map((f: MediaFile) => f.key),
      `${folder.prefix}.keep`,
    ];
    await Promise.all(keys.map(key =>
      fetch('/api/admin/media', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key }) })
    ));
    setFolders(f => f.filter(x => x.prefix !== folder.prefix));
    setAllTopFolders(f => f.filter(x => x.prefix !== folder.prefix));
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

  // ── Move ──────────────────────────────────────────────────────────────────
  const moveFile = async (oldKey: string, targetPrefix: string) => {
    const basename = oldKey.split('/').pop()!;
    const newKey   = `${targetPrefix}${basename}`;
    const res = await fetch('/api/admin/media', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ oldKey, newKey }),
    });
    if (!res.ok) return;
    setFiles(f => f.filter(x => x.key !== oldKey));
  };

  // ── Drag handlers ─────────────────────────────────────────────────────────
  const handleDragStart = useCallback((file: MediaFile) => {
    setDraggingFile(file);
    setCtxMenu(null); // close any open context menu
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingFile(null);
    setDragOverPrefix(null);
  }, []);

  const handleDrop = useCallback((targetPrefix: string) => {
    if (!draggingFile) return;
    moveFile(draggingFile.key, targetPrefix);
    setDraggingFile(null);
    setDragOverPrefix(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingFile]);

  // ── URL Import ────────────────────────────────────────────────────────────
  const importFromUrl = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    try {
      const folder = currentPrefix.replace(/^media\//, '').replace(/\/$/, '');
      const res = await fetch('/api/admin/media/import', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: importUrl.trim(), folder }),
      });
      if (!res.ok) { const b = await res.json(); alert(b.error ?? 'Import failed'); return; }
      const file: MediaFile = await res.json();
      setFiles(f => [file, ...f]);
      setImportUrl('');
    } finally { setImporting(false); }
  };

  // ── Context menu builders ─────────────────────────────────────────────────
  const buildFileCtxItems = useCallback((file: MediaFile): CtxItem[] => {
    const kind      = getKind(file.contentType);
    const mdContent = kind === 'image'
      ? `![${file.name}](${file.url})`
      : `[${file.name}](${file.url})`;
    const moveTargets = [
      { prefix: 'media/', name: 'Root' },
      ...allTopFolders.filter(f => f.prefix !== currentPrefix),
    ];
    const items: CtxItem[] = [
      { kind: 'action', label: 'Preview',          icon: <Eye className="h-3 w-3" />,          onClick: () => setPreview(file) },
      { kind: 'action', label: 'Open in new tab',  icon: <ExternalLink className="h-3 w-3" />, onClick: () => window.open(file.url, '_blank') },
      { kind: 'action', label: 'Download',          icon: <Download className="h-3 w-3" />,     onClick: () => triggerDownload(file.url, file.name) },
      { kind: 'separator' },
      { kind: 'action', label: 'Copy URL',          icon: <Copy className="h-3 w-3" />,         onClick: () => navigator.clipboard.writeText(file.url) },
      { kind: 'action', label: 'Copy as Markdown',  icon: <Code2 className="h-3 w-3" />,        onClick: () => navigator.clipboard.writeText(mdContent) },
    ];
    if (kind === 'image') {
      items.push({ kind: 'action', label: 'Copy as HTML', icon: <Code2 className="h-3 w-3" />,
        onClick: () => navigator.clipboard.writeText(`<img src="${file.url}" alt="${file.name}" />`) });
    }
    items.push({ kind: 'separator' });
    items.push({ kind: 'action', label: 'Rename', icon: <Pencil className="h-3 w-3" />, onClick: () => setRenamingKey(file.key) });
    if (moveTargets.length > 0) {
      items.push({ kind: 'label', text: 'Move to' });
      for (const t of moveTargets) {
        items.push({ kind: 'action', label: t.name, icon: <Folder className="h-3 w-3" />, onClick: () => moveFile(file.key, t.prefix) });
      }
    }
    items.push({ kind: 'separator' });
    items.push({ kind: 'action', label: 'Delete', icon: <Trash2 className="h-3 w-3" />, onClick: () => deleteFile(file.key), danger: true });
    return items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTopFolders, currentPrefix]);

  const buildFolderCtxItems = useCallback((folder: MediaFolder): CtxItem[] => [
    { kind: 'action', label: 'Open folder',   icon: <Folder className="h-3 w-3" />,     onClick: () => setCurrentPrefix(folder.prefix) },
    { kind: 'action', label: 'New subfolder', icon: <FolderPlus className="h-3 w-3" />, onClick: () => createFolder(folder.prefix) },
    { kind: 'separator' },
    { kind: 'action', label: 'Delete folder', icon: <Trash2 className="h-3 w-3" />,     onClick: () => deleteFolder(folder), danger: true },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  const handleFileCtxMenu   = useCallback((e: React.MouseEvent, file: MediaFile)     => setCtxMenu({ x: e.clientX, y: e.clientY, target: { type: 'file',   file   } }), []);
  const handleFolderCtxMenu = useCallback((e: React.MouseEvent, folder: MediaFolder) => setCtxMenu({ x: e.clientX, y: e.clientY, target: { type: 'folder', folder } }), []);

  const ctxItems = useMemo(() => {
    if (!ctxMenu) return [];
    return ctxMenu.target.type === 'file'
      ? buildFileCtxItems(ctxMenu.target.file)
      : buildFolderCtxItems(ctxMenu.target.folder);
  }, [ctxMenu, buildFileCtxItems, buildFolderCtxItems]);

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
    pdf:   files.filter(f => getKind(f.contentType) === 'pdf').length,
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

  const hasContent = folders.length > 0 || filtered.length > 0;

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      {!pickerMode && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="h-4 w-4 text-zinc-400" />
            <h2 className="font-heading text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50">Media Library</h2>
            {r2Ok !== null && <span className={`h-2 w-2 rounded-full ${r2Ok ? 'bg-emerald-500' : 'bg-red-500'}`} />}
          </div>
          {!loading && (
            <div className="flex items-center gap-3 font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
              <span>{formatBytes(totalSize)} in this folder</span>
              {counts.image > 0 && <span>{counts.image} images</span>}
              {counts.video > 0 && <span>{counts.video} videos</span>}
              {counts.pdf   > 0 && <span>{counts.pdf} PDFs</span>}
            </div>
          )}
        </div>
      )}

      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <Breadcrumb
        prefix={currentPrefix}
        isDragging={!!draggingFile}
        dragOverPrefix={dragOverPrefix}
        onNavigate={setCurrentPrefix}
        onNewFolder={() => createFolder()}
        onDragOverPrefix={setDragOverPrefix}
        onDropOnPrefix={handleDrop}
      />

      {/* ── Drop zone ──────────────────────────────────────────────────── */}
      <DropZone onFiles={handleFiles} />

      {/* ── URL Import ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Link2 className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        <input
          type="url" value={importUrl} onChange={e => setImportUrl(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') importFromUrl(); }}
          placeholder="Paste an external URL to import into current folder…"
          className="flex-1 border border-zinc-200 dark:border-zinc-800 bg-transparent px-3 py-1.5 font-mono text-[10px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
        />
        <button type="button" onClick={importFromUrl} disabled={!importUrl.trim() || importing}
          className="flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-zinc-500 hover:border-zinc-900 dark:hover:border-zinc-100 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-40 disabled:pointer-events-none">
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
                <span className="font-mono text-[10px] text-zinc-500 truncate max-w-[60%]">{u.filename}</span>
                {u.error
                  ? <span className="font-mono text-[10px] text-red-500">{u.error}</span>
                  : <span className="font-mono text-[10px] text-zinc-400">{u.progress}%</span>}
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
        {([
          ['all',   'All',    null],
          ['image', 'Images', ImageIcon],
          ['video', 'Videos', FileVideo],
          ['pdf',   'PDF',    null],
          ['other', 'Other',  null],
        ] as [FilterKind, string, React.ElementType | null][]).map(([k, label, Icon]) => (
          <button key={k} type="button" onClick={() => setFilter(k)}
            className={[
              'flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest transition-colors',
              filter === k
                ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-50'
                : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-500',
            ].join(' ')}>
            {Icon && <Icon className="h-3 w-3" />}
            {label} ({counts[k]})
          </button>
        ))}

        <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
          className="ml-auto border border-zinc-200 dark:border-zinc-800 bg-transparent px-2.5 py-1 font-mono text-[9px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors" />

        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-3 w-3 text-zinc-400" />
          {([['date-desc', 'Newest'], ['date-asc', 'Oldest'], ['name', 'Name'], ['size', 'Size']] as [SortBy, string][]).map(([val, label]) => (
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
      ) : !hasContent ? (
        <div className="py-16 text-center font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
          This folder is empty — drop files or create a subfolder
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-5">
          {/* Folders first */}
          {folders.map(folder => (
            <FolderCard
              key={folder.prefix}
              folder={folder}
              isDropTarget={dragOverPrefix === folder.prefix}
              onClick={() => setCurrentPrefix(folder.prefix)}
              onContextMenu={handleFolderCtxMenu}
              onDragEnter={() => setDragOverPrefix(folder.prefix)}
              onDragLeave={() => setDragOverPrefix(null)}
              onDrop={() => handleDrop(folder.prefix)}
            />
          ))}

          {/* Files */}
          <AnimatePresence mode="popLayout">
            {filtered.map(file => (
              <motion.div
                key={file.key}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                transition={{ duration: 0.2 }}
              >
                <FileCard
                  file={file}
                  pickerMode={pickerMode}
                  isUsed={usedUrls?.has(file.url) ?? false}
                  isSelected={selected.has(file.key)}
                  isDragging={draggingFile?.key === file.key}
                  currentPrefix={currentPrefix}
                  allFolders={allTopFolders}
                  forceRenaming={renamingKey === file.key}
                  onRenameForced={() => setRenamingKey(null)}
                  onSelect={onSelect ?? (() => {})}
                  onCopy={url => navigator.clipboard.writeText(url)}
                  onDelete={deleteFile}
                  onPreview={setPreview}
                  onToggleSelect={toggleSelect}
                  onRename={renameFile}
                  onMove={moveFile}
                  onContextMenu={handleFileCtxMenu}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
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
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.2, ease: EXPO }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2.5 shadow-lg"
          >
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">{selected.size} selected</span>
            <button type="button" onClick={selectAll} className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">All</button>
            <button type="button" onClick={deselectAll} className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">None</button>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
            <button type="button" onClick={bulkDelete} className="font-mono text-[9px] uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors">
              Delete {selected.size}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Preview modal ────────────────────────────────────────────────── */}
      {preview && (
        <PreviewModal file={preview} files={filtered} onClose={() => setPreview(null)} onSelect={onSelect} />
      )}

      {/* ── Context menu ─────────────────────────────────────────────────── */}
      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxItems} onClose={closeCtxMenu} />
      )}
    </div>
  );
}
