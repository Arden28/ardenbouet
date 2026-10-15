'use client';
// Shared pieces of the media library: file glyphs, thumbnails, dialogs, download helper.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, Folder, FolderOpen, Loader2 } from 'lucide-react';
import { ROOT, crumbs, kindOf, mediaApi, type MediaFolderItem, type MediaItem, type MediaKind } from './api';

export const ext = (name: string) => (name.split('.').pop() ?? '').slice(0, 4).toUpperCase();

export const dateLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
};

/** Coloured, Drive-like file-type glyph. */
export function FileGlyph({ kind, name = '', className = 'h-5 w-5' }: { kind: MediaKind; name?: string; className?: string }) {
  const e = ext(name);
  const spec =
    kind === 'image' ? { c: '#d93025', label: '' , path: 'img' }
      : kind === 'video' ? { c: '#d93025', label: '', path: 'vid' }
        : kind === 'audio' ? { c: '#8e44ad', label: '', path: 'aud' }
          : e === 'PDF' ? { c: '#e5252a', label: 'PDF', path: 'txt' }
            : ['XLS', 'XLSX', 'CSV'].includes(e) ? { c: '#188038', label: '', path: 'sheet' }
              : ['PPT', 'PPTX'].includes(e) ? { c: '#e37400', label: '', path: 'slide' }
                : ['DOC', 'DOCX', 'TXT', 'MD'].includes(e) ? { c: '#1a73e8', label: '', path: 'doc' }
                  : e === 'ZIP' ? { c: '#5f6368', label: '', path: 'zip' }
                    : { c: '#5f6368', label: '', path: 'file' };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3" fill={spec.c} />
      {spec.path === 'img' && <path d="M7 16l3-4 2.2 2.8L15 11l3 5H7z" fill="#fff" />}
      {spec.path === 'img' && <circle cx="9" cy="8.5" r="1.4" fill="#fff" />}
      {spec.path === 'vid' && <path d="M10 8.5v7l5.5-3.5L10 8.5z" fill="#fff" />}
      {spec.path === 'aud' && <path d="M14.5 7v6.6a2.2 2.2 0 11-1.3-2V8.8l-3 .7v5.6a2.2 2.2 0 11-1.3-2V8.4L14.5 7z" fill="#fff" />}
      {spec.path === 'txt' && <text x="12" y="15" textAnchor="middle" fontSize="6.4" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">{spec.label}</text>}
      {spec.path === 'sheet' && <path d="M7 7h10v10H7zM7 10.3h10M7 13.6h10M11 7v10" stroke="#fff" strokeWidth="1.3" fill="none" />}
      {spec.path === 'slide' && <rect x="7" y="8.5" width="10" height="7" rx="1" stroke="#fff" strokeWidth="1.5" fill="none" />}
      {spec.path === 'doc' && <path d="M7.5 8h9M7.5 11h9M7.5 14h9M7.5 17h5" stroke="#fff" strokeWidth="1.4" />}
      {spec.path === 'zip' && <path d="M11 5h2v2h-2zM11 8h2v2h-2zM11 11h2v2h-2zM10.2 14h3.6v3.5h-3.6z" fill="#fff" />}
      {spec.path === 'file' && <path d="M8 7h5.5L16 9.5V17H8z" stroke="#fff" strokeWidth="1.4" fill="none" />}
    </svg>
  );
}

export function FolderGlyph({ open = false, className = 'h-5 w-5' }: { open?: boolean; className?: string }) {
  const Icon = open ? FolderOpen : Folder;
  return <Icon className={`${className} fill-[#8b9bb0] text-[#8b9bb0]`} strokeWidth={1.4} />;
}

/** Image thumbnail, or a big glyph for other kinds. */
export function Thumb({ item, fit = 'cover' }: { item: MediaItem; fit?: 'cover' | 'contain' }) {
  const kind = kindOf(item.contentType, item.name);
  const [broken, setBroken] = useState(false);
  if (kind === 'image' && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={item.url} alt="" loading="lazy" draggable={false} onError={() => setBroken(true)}
        className={`h-full w-full ${fit === 'cover' ? 'object-cover' : 'object-contain'}`} />
    );
  }
  if (kind === 'video' && !broken) {
    return (
      <div className="relative h-full w-full bg-[#1c1c1c]">
        <video src={`${item.url}#t=0.5`} preload="metadata" muted playsInline onError={() => setBroken(true)} className="h-full w-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(0,0,0,0.55)]"><svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" fill="#fff"><path d="M8 5v14l11-7z" /></svg></span>
        </span>
      </div>
    );
  }
  return (
    <div className="flex h-full w-full items-center justify-center">
      <FileGlyph kind={kind} name={item.name} className="h-12 w-12 opacity-90" />
    </div>
  );
}

/** Forces a download even for cross-origin files; falls back to opening the file. */
export async function downloadFile(item: MediaItem) {
  try {
    const res = await fetch(item.url, { mode: 'cors' });
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href, download: item.name.replace(/^\d{13}-/, '') });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(href), 2000);
  } catch {
    window.open(item.url, '_blank', 'noopener');
  }
}

// ─── Dialogs ─────────────────────────────────────────────────────────────────

export function Modal({ title, children, footer, onClose, width = 420 }: { title: string; children: ReactNode; footer: ReactNode; onClose: () => void; width?: number }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="blog-ui fixed inset-0 z-[360] flex items-center justify-center bg-[rgba(0,0,0,0.32)] p-4 animate-[fade-in_120ms_ease-out]" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }} onMouseDown={e => e.stopPropagation()}
        className="w-full rounded-2xl bg-white p-6 text-[#242424] shadow-[0_24px_60px_rgba(0,0,0,0.25)]">
        <h3 className="text-[20px] font-semibold tracking-[-0.01em]">{title}</h3>
        <div className="mt-4">{children}</div>
        <div className="mt-6 flex justify-end gap-2">{footer}</div>
      </div>
    </div>,
    document.body,
  );
}

export const btnGhost = 'rounded-full px-4 py-2 text-[14px] font-medium text-[#242424] hover:bg-[#f2f2f2]';
export const btnPrimary = 'rounded-full bg-[#242424] px-5 py-2 text-[14px] font-medium text-white hover:bg-black disabled:opacity-35';
export const btnDanger = 'rounded-full bg-[#c94a4a] px-5 py-2 text-[14px] font-medium text-[#ffffff] hover:opacity-90';

export function PromptDialog({ title, label, initial = '', placeholder, okLabel = 'OK', selectBase = false, onSubmit, onClose }: {
  title: string; label?: string; initial?: string; placeholder?: string; okLabel?: string; selectBase?: boolean;
  onSubmit: (value: string) => void; onClose: () => void;
}) {
  const [value, setValue] = useState(initial);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const el = input.current;
    if (!el) return;
    el.focus();
    const dot = initial.lastIndexOf('.');
    if (selectBase && dot > 0) el.setSelectionRange(0, dot); else el.select();
  }, [initial, selectBase]);
  const submit = () => { const v = value.trim(); if (v) { onSubmit(v); onClose(); } };
  return (
    <Modal title={title} onClose={onClose}
      footer={<><button type="button" onClick={onClose} className={btnGhost}>Cancel</button><button type="button" onClick={submit} disabled={!value.trim()} className={btnPrimary}>{okLabel}</button></>}>
      {label && <p className="mb-2 text-[14px] text-[#6b6b6b]">{label}</p>}
      <input ref={input} value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); }} placeholder={placeholder}
        className="w-full rounded-xl border border-[#d4d4d4] bg-transparent px-3.5 py-2.5 text-[15px] outline-none focus:border-[#242424] focus:ring-1 focus:ring-[#242424]" />
    </Modal>
  );
}

export function ConfirmDialog({ title, body, okLabel = 'Delete', danger = true, onConfirm, onClose }: {
  title: string; body: ReactNode; okLabel?: string; danger?: boolean; onConfirm: () => void; onClose: () => void;
}) {
  const ok = useRef<HTMLButtonElement>(null);
  useEffect(() => { ok.current?.focus(); }, []);
  return (
    <Modal title={title} onClose={onClose}
      footer={<><button type="button" onClick={onClose} className={btnGhost}>Cancel</button><button ref={ok} type="button" onClick={() => { onConfirm(); onClose(); }} className={danger ? btnDanger : btnPrimary}>{okLabel}</button></>}>
      <div className="text-[14px] leading-6 text-[#6b6b6b]">{body}</div>
    </Modal>
  );
}

/** Folder browser for "Move to…". */
export function MoveDialog({ count, from, exclude = [], onClose, onMove }: { count: number; from: string; exclude?: string[]; onClose: () => void; onMove: (prefix: string) => void }) {
  const [prefix, setPrefix] = useState(from);
  const [folders, setFolders] = useState<MediaFolderItem[] | null>(null);
  useEffect(() => { setFolders(null); mediaApi.list(prefix).then(r => setFolders(r.folders)).catch(() => setFolders([])); }, [prefix]);
  const blocked = prefix === from || exclude.some(x => prefix.startsWith(x));
  return (
    <Modal title={`Move ${count} item${count > 1 ? 's' : ''}`} onClose={onClose} width={480}
      footer={<><button type="button" onClick={onClose} className={btnGhost}>Cancel</button><button type="button" disabled={blocked} onClick={() => onMove(prefix)} className={btnPrimary}>Move here</button></>}>
      <nav className="flex flex-wrap items-center gap-0.5 text-[14px] text-[#6b6b6b]">
        {crumbs(prefix).map((c, i, all) => (
          <span key={c.prefix} className="flex items-center gap-0.5">
            <button type="button" onClick={() => setPrefix(c.prefix)} className={`rounded-md px-1.5 py-0.5 ${i === all.length - 1 ? 'font-medium text-[#242424]' : 'hover:bg-[#f2f2f2]'}`}>{i === 0 ? 'My library' : c.label}</button>
            {i < all.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-[#c4c4c4]" />}
          </span>
        ))}
      </nav>
      <ul className="thin-scroll mt-3 h-[280px] overflow-y-auto rounded-xl border border-[#ececec] p-1.5">
        {folders === null && <li className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-[#9b9b9b]" /></li>}
        {folders?.length === 0 && <li className="py-12 text-center text-[13px] text-[#9b9b9b]">No folders here{prefix !== ROOT ? ' — you can move into this folder' : ''}</li>}
        {folders?.map(f => {
          const disabled = exclude.includes(f.prefix);
          return (
            <li key={f.prefix}>
              <button type="button" disabled={disabled} onClick={() => setPrefix(f.prefix)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[14px] text-[#242424] hover:bg-[#f6f6f6] disabled:opacity-35">
                <FolderGlyph /> <span className="truncate">{f.name}</span> <ChevronRight className="ml-auto h-4 w-4 text-[#c4c4c4]" />
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
