'use client';
// Right-hand details panel, modelled on Google Drive's: header with the item, a large preview, then "File details".
import { useEffect, useState } from 'react';
import { Check, Copy, Download, ExternalLink, Link2, X } from 'lucide-react';
import { ROOT, crumbs, displayName, folderOf, formatBytes, kindOf, type MediaFolderItem, type MediaItem } from './api';
import { FileGlyph, FolderGlyph, Thumb, downloadFile } from './shared';

export type DetailsTarget =
  | { type: 'file'; item: MediaItem }
  | { type: 'folder'; folder: MediaFolderItem }
  | { type: 'many'; files: MediaItem[]; folders: number }
  | { type: 'here'; prefix: string; label: string; files: MediaItem[]; folders: number };

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="py-2.5">
      <dt className="text-[12px] text-[#6b6b6b]">{k}</dt>
      <dd className="mt-0.5 break-words text-[14px] text-[#242424]">{children}</dd>
    </div>
  );
}

function LocationChip({ prefix, onNavigate }: { prefix: string; onNavigate: (p: string) => void }) {
  const all = crumbs(prefix);
  const last = all[all.length - 1];
  return (
    <button type="button" onClick={() => onNavigate(prefix)} title={'/' + prefix.replace(/^media\//, '')}
      className="inline-flex max-w-full items-center gap-2 rounded-lg border border-[#e6e6e6] px-2.5 py-1 text-[13px] hover:bg-[#f6f6f6]">
      <FolderGlyph className="h-4 w-4 shrink-0" /> <span className="truncate">{prefix === ROOT ? 'My library' : last.label}</span>
    </button>
  );
}

export function Details({ target, usage, onClose, onPreview, onNavigate }: {
  target: DetailsTarget; usage: Record<string, string[]>; onClose: () => void;
  onPreview: (item: MediaItem) => void; onNavigate: (prefix: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [dims, setDims] = useState('');
  const item = target.type === 'file' ? target.item : null;

  useEffect(() => {
    setDims('');
    setCopied(false);
    if (!item) return;
    const kind = kindOf(item.contentType, item.name);
    if (kind === 'image') {
      const img = new Image();
      img.onload = () => setDims(`${img.naturalWidth} × ${img.naturalHeight}`);
      img.src = item.url;
    } else if (kind === 'video') {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.onloadedmetadata = () => { const s = Math.round(v.duration); setDims(`${v.videoWidth} × ${v.videoHeight} · ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`); };
      v.src = item.url;
    }
  }, [item]);

  const copy = async (url: string) => { await navigator.clipboard.writeText(url).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1400); };

  const header = (icon: React.ReactNode, title: string) => (
    <div className="flex items-center gap-3 px-5 pb-3 pt-4">
      <span className="shrink-0">{icon}</span>
      <h3 className="min-w-0 flex-1 truncate text-[16px] font-medium text-[#242424]" title={title}>{title}</h3>
      <button type="button" onClick={onClose} aria-label="Close details" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6b6b6b] hover:bg-[#f2f2f2]"><X className="h-5 w-5" /></button>
    </div>
  );

  return (
    <aside className="flex h-full w-[300px] shrink-0 xl:w-[340px] flex-col rounded-2xl bg-white" aria-label="Details">
      {target.type === 'file' ? (() => { const item = target.item; return (
        <>
          {header(<FileGlyph kind={kindOf(item.contentType, item.name)} name={item.name} className="h-6 w-6" />, displayName(item.name))}
          <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-6">
            <button type="button" onClick={() => onPreview(item)} title="Preview"
              className="checker flex h-[200px] w-full items-center justify-center overflow-hidden rounded-xl border border-[#f0f0f0] transition-opacity hover:opacity-90">
              <Thumb item={item} fit="contain" />
            </button>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => copy(item.url)} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#e6e6e6] py-2 text-[13px] font-medium hover:bg-[#f6f6f6]">
                {copied ? <Check className="h-4 w-4 text-[#1a8917]" /> : <Link2 className="h-4 w-4" />} {copied ? 'Copied' : 'Copy link'}
              </button>
              <button type="button" onClick={() => downloadFile(item)} aria-label="Download" title="Download" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e6e6e6] hover:bg-[#f6f6f6]"><Download className="h-4 w-4" /></button>
              <a href={item.url} target="_blank" rel="noopener noreferrer" aria-label="Open in new tab" title="Open in new tab" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e6e6e6] hover:bg-[#f6f6f6]"><ExternalLink className="h-4 w-4" /></a>
            </div>

            <h4 className="mt-6 text-[15px] font-medium text-[#242424]">Where it’s used</h4>
            {usage[item.url]?.length ? (
              <ul className="mt-2 space-y-1.5">
                {usage[item.url].map(u => <li key={u} className="flex items-center gap-2 rounded-lg bg-[#eef7ee] px-3 py-2 text-[13px] text-[#1a6b17]"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a8917]" />{u}</li>)}
              </ul>
            ) : (
              <p className="mt-1.5 text-[13px] text-[#6b6b6b]">Not used anywhere on the site yet.</p>
            )}

            <h4 className="mt-6 text-[15px] font-medium text-[#242424]">File details</h4>
            <dl className="mt-1">
              <Row k="Type">{item.contentType}</Row>
              <Row k="Size">{formatBytes(item.size)} <span className="text-[#9b9b9b]">({item.size.toLocaleString()} bytes)</span></Row>
              {dims && <Row k={kindOf(item.contentType, item.name) === 'video' ? 'Resolution · duration' : 'Dimensions'}>{dims}</Row>}
              <Row k="Location"><LocationChip prefix={folderOf(item.key)} onNavigate={onNavigate} /></Row>
              <Row k="Modified">{new Date(item.lastModified).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</Row>
              <Row k="Public URL">
                <button type="button" onClick={() => copy(item.url)} className="group flex w-full items-start gap-2 text-left">
                  <span className="min-w-0 flex-1 break-all font-mono text-[12px] text-[#6b6b6b] group-hover:text-[#242424]">{item.url}</span>
                  <Copy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#9b9b9b]" />
                </button>
              </Row>
              <Row k="Storage key"><span className="break-all font-mono text-[12px] text-[#6b6b6b]">{item.key}</span></Row>
            </dl>
          </div>
        </>
      ); })() : target.type === 'folder' ? (
        <>
          {header(<FolderGlyph className="h-6 w-6" />, target.folder.name)}
          <div className="px-5">
            <div className="flex h-[160px] items-center justify-center rounded-xl bg-[#f6f6f6]"><FolderGlyph className="h-16 w-16" /></div>
            <dl className="mt-3">
              <Row k="Type">Folder</Row>
              <Row k="Location"><LocationChip prefix={folderOf(target.folder.prefix.replace(/\/$/, ''))} onNavigate={onNavigate} /></Row>
              <Row k="Path"><span className="font-mono text-[12px] text-[#6b6b6b]">/{target.folder.prefix.replace(/^media\//, '')}</span></Row>
            </dl>
            <button type="button" onClick={() => onNavigate(target.folder.prefix)} className="mt-4 w-full rounded-full border border-[#e6e6e6] py-2 text-[13px] font-medium hover:bg-[#f6f6f6]">Open folder</button>
          </div>
        </>
      ) : target.type === 'many' ? (
        <>
          {header(<span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#242424] text-[12px] font-semibold text-white">{target.files.length + target.folders}</span>, `${target.files.length + target.folders} items selected`)}
          <div className="px-5">
            <div className="grid grid-cols-3 gap-1.5">
              {target.files.slice(0, 6).map(f => <div key={f.key} className="checker aspect-square overflow-hidden rounded-lg"><Thumb item={f} /></div>)}
            </div>
            <dl className="mt-3">
              <Row k="Files">{target.files.length}{target.folders ? ` · ${target.folders} folder${target.folders > 1 ? 's' : ''}` : ''}</Row>
              <Row k="Total size">{formatBytes(target.files.reduce((s, f) => s + f.size, 0))}</Row>
              <Row k="In use on the site">{target.files.filter(f => usage[f.url]?.length).length} of {target.files.length}</Row>
            </dl>
          </div>
        </>
      ) : (
        <>
          {header(<FolderGlyph open className="h-6 w-6" />, target.label)}
          <div className="flex flex-1 flex-col items-center px-8 pt-8 text-center">
            <svg viewBox="0 0 160 120" className="h-[120px] w-[160px]" aria-hidden>
              <rect x="20" y="30" width="120" height="78" rx="10" fill="#eef4fb" />
              <rect x="20" y="22" width="52" height="18" rx="6" fill="#d6e4f5" />
              <rect x="38" y="52" width="40" height="34" rx="5" fill="#ffffff" stroke="#c7d6ea" />
              <rect x="84" y="52" width="40" height="34" rx="5" fill="#ffffff" stroke="#c7d6ea" />
              <circle cx="50" cy="63" r="4" fill="#8aa3c2" /><path d="M42 82l9-11 6 7 4-4 9 8z" fill="#8aa3c2" />
              <path d="M92 62h24M92 69h24M92 76h16" stroke="#8aa3c2" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <p className="mt-6 text-[15px] text-[#242424]">Select an item to see its details</p>
            <dl className="mt-6 w-full text-left">
              <Row k="In this view">{target.files.length} file{target.files.length === 1 ? '' : 's'}{target.folders ? ` · ${target.folders} folder${target.folders > 1 ? 's' : ''}` : ''}</Row>
              <Row k="Size of files">{formatBytes(target.files.reduce((s, f) => s + f.size, 0))}</Row>
            </dl>
          </div>
        </>
      )}
    </aside>
  );
}
