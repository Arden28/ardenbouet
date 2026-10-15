'use client';
// Media picker dialog + an imperative opener, so any admin control can do:
//   const [file] = await openMediaPicker({ accept: 'image/*' }) ?? [];
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { X } from 'lucide-react';
import MediaLibrary from './MediaLibrary';
import type { MediaItem } from './api';

export type PickOptions = {
  accept?: string;          // 'image/*', 'video/*', 'image/*,video/*', '.pdf', …
  multiple?: boolean;
  title?: string;
  initialPrefix?: string;   // e.g. 'media/blog/'
};

export function MediaPickerDialog({ open, onClose, onPick, accept, multiple, title, initialPrefix }: PickOptions & {
  open: boolean;
  onClose: () => void;
  onPick: (items: MediaItem[]) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="blog-ui fixed inset-0 z-[250] flex items-center justify-center bg-black/30 p-3 sm:p-8" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Choose media'}
        className="flex h-[min(820px,92vh)] w-full max-w-[1200px] flex-col overflow-hidden rounded-2xl bg-[#f6f6f6] shadow-2xl"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-[#242424]">{title ?? (multiple ? 'Choose files' : 'Choose a file')}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-[#6b6b6b] hover:bg-[#f2f2f2]" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 flex-1">
          <MediaLibrary mode="pick" accept={accept} multiple={multiple} onPick={onPick} onCancel={onClose} initialPrefix={initialPrefix} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** Opens the picker anywhere (no provider needed). Resolves with the chosen files, or null if cancelled. */
export function openMediaPicker(opts: PickOptions = {}): Promise<MediaItem[] | null> {
  return new Promise(resolve => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    const done = (v: MediaItem[] | null) => {
      resolve(v);
      setTimeout(() => { root.unmount(); host.remove(); }, 0);
    };
    root.render(<MediaPickerDialog open {...opts} onClose={() => done(null)} onPick={items => done(items)} />);
  });
}
