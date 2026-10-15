'use client';
// Full-screen file preview (Drive-style): dark stage, top bar with actions, ←/→ through the current list.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Copy, Download, ExternalLink, Info, Minus, Plus, Maximize2, Check } from 'lucide-react';
import { displayName, formatBytes, kindOf, type MediaItem } from './api';
import { FileGlyph, downloadFile } from './shared';

export function Preview({ items, index, onIndex, onClose, onInfo, extraActions }: {
  items: MediaItem[]; index: number; onIndex: (i: number) => void; onClose: () => void; onInfo?: (item: MediaItem) => void;
  extraActions?: (item: MediaItem) => React.ReactNode;
}) {
  const item = items[index];
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);
  const kind = item ? kindOf(item.contentType, item.name) : 'other';
  const isPdf = !!item && (item.contentType === 'application/pdf' || /\.pdf$/i.test(item.name));
  const isText = !!item && (item.contentType.startsWith('text/') || /\.(txt|md|csv|json)$/i.test(item.name));

  useEffect(() => { setZoom(1); }, [index]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && index < items.length - 1) onIndex(index + 1);
      else if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1);
      else if ((e.key === '+' || e.key === '=') && kind === 'image') setZoom(z => Math.min(4, z + 0.25));
      else if (e.key === '-' && kind === 'image') setZoom(z => Math.max(0.25, z - 0.25));
      else if (e.key === '0' && kind === 'image') setZoom(1);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [index, items.length, kind, onClose, onIndex]);

  if (!item) return null;
  const copy = async () => { await navigator.clipboard.writeText(item.url).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1400); };
  const iconBtn = 'flex h-10 w-10 items-center justify-center rounded-full text-[#e8e8e8] hover:bg-[rgba(255,255,255,0.12)]';

  return createPortal(
    <div style={{ fontFamily: 'var(--font-ui)', color: '#e8e8e8' }} className="fixed inset-0 z-[350] flex flex-col bg-[rgba(16,16,16,0.97)] backdrop-blur-sm animate-[fade-in_150ms_ease-out]" role="dialog" aria-modal="true" aria-label={displayName(item.name)}>
      {/* Top bar */}
      <div className="flex h-16 shrink-0 items-center gap-3 px-3 sm:px-5">
        <button type="button" onClick={onClose} className={iconBtn} aria-label="Close preview"><ArrowLeft className="h-5 w-5" /></button>
        <FileGlyph kind={kind} name={item.name} className="h-6 w-6 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium">{displayName(item.name)}</p>
          <p className="text-[12px] text-[#9a9a9a]">{formatBytes(item.size)} · {index + 1} of {items.length}</p>
        </div>
        {extraActions?.(item)}
        <button type="button" onClick={copy} className={iconBtn} title="Copy link" aria-label="Copy link">{copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}</button>
        <button type="button" onClick={() => downloadFile(item)} className={iconBtn} title="Download" aria-label="Download"><Download className="h-5 w-5" /></button>
        <a href={item.url} target="_blank" rel="noopener noreferrer" className={iconBtn} title="Open in new tab" aria-label="Open in new tab"><ExternalLink className="h-5 w-5" /></a>
        {onInfo && <button type="button" onClick={() => onInfo(item)} className={iconBtn} title="File information" aria-label="File information"><Info className="h-5 w-5" /></button>}
      </div>

      {/* Stage */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-20" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
        {kind === 'image' ? (
          <div className="flex h-full w-full items-center justify-center overflow-auto" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={item.key} src={item.url} alt="" draggable={false}
              style={{ transform: `scale(${zoom})` }}
              className="max-h-full max-w-full rounded-sm object-contain shadow-2xl transition-transform duration-150" />
          </div>
        ) : kind === 'video' ? (
          <video key={item.key} src={item.url} controls autoPlay className="max-h-full max-w-full rounded-lg bg-black shadow-2xl" />
        ) : kind === 'audio' ? (
          <div className="flex w-full max-w-[460px] flex-col items-center rounded-2xl bg-[rgba(255,255,255,0.06)] p-8">
            <FileGlyph kind="audio" name={item.name} className="h-14 w-14" />
            <p className="mt-4 max-w-full truncate text-[15px]">{displayName(item.name)}</p>
            <audio key={item.key} src={item.url} controls autoPlay className="mt-6 w-full" />
          </div>
        ) : isPdf || isText ? (
          <iframe key={item.key} src={item.url} title={item.name} className="h-full w-full max-w-[960px] rounded-lg bg-[#ffffff] shadow-2xl" />
        ) : (
          <div className="flex flex-col items-center rounded-2xl bg-[rgba(255,255,255,0.06)] px-12 py-10 text-center">
            <FileGlyph kind={kind} name={item.name} className="h-14 w-14" />
            <p className="mt-4 text-[16px] font-medium">No preview available</p>
            <p className="mt-1 text-[13px] text-[#9a9a9a]">{item.contentType}</p>
            <button type="button" onClick={() => downloadFile(item)} className="mt-6 flex items-center gap-2 rounded-full bg-[#e8e8e8] px-5 py-2.5 text-[14px] font-medium text-[#141414] hover:bg-[#ffffff]">
              <Download className="h-4 w-4" /> Download
            </button>
          </div>
        )}

        {index > 0 && (
          <button type="button" onClick={() => onIndex(index - 1)} aria-label="Previous file"
            className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(0,0,0,0.45)] text-[#e8e8e8] hover:bg-[rgba(0,0,0,0.7)] sm:left-5">
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {index < items.length - 1 && (
          <button type="button" onClick={() => onIndex(index + 1)} aria-label="Next file"
            className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(0,0,0,0.45)] text-[#e8e8e8] hover:bg-[rgba(0,0,0,0.7)] sm:right-5">
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {kind === 'image' && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-[rgba(32,32,32,0.92)] px-2 py-1 shadow-xl">
            <button type="button" onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.12)]" aria-label="Zoom out"><Minus className="h-4 w-4" /></button>
            <button type="button" onClick={() => setZoom(1)} className="min-w-[56px] rounded-full px-2 py-1.5 text-[13px] tabular-nums hover:bg-[rgba(255,255,255,0.12)]" title="Reset zoom">{Math.round(zoom * 100)}%</button>
            <button type="button" onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.12)]" aria-label="Zoom in"><Plus className="h-4 w-4" /></button>
            <span className="mx-1 h-5 w-px bg-[rgba(255,255,255,0.15)]" />
            <button type="button" onClick={() => setZoom(1)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[rgba(255,255,255,0.12)]" aria-label="Fit to screen"><Maximize2 className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
