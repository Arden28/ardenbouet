'use client';
// Dialog to pick site content (products, projects, experience, stories) to embed in a story.
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Search, X, ShoppingBag, FolderKanban, Briefcase, FileText, Loader2 } from 'lucide-react';
import type { ContentCardKind } from '@/lib/blog/doc';
import { useEmbeddables } from './embeddables';

const TABS: { kind: ContentCardKind; label: string; icon: typeof ShoppingBag }[] = [
  { kind: 'product', label: 'Products', icon: ShoppingBag },
  { kind: 'project', label: 'Projects', icon: FolderKanban },
  { kind: 'experience', label: 'Experience', icon: Briefcase },
  { kind: 'post', label: 'Stories', icon: FileText },
];

export function ContentPickerDialog({ kind: initialKind, selected, onClose, onConfirm, lockKind = false }: {
  kind: ContentCardKind;
  selected: string[];
  onClose: () => void;
  onConfirm: (kind: ContentCardKind, ids: string[]) => void;
  lockKind?: boolean;
}) {
  const data = useEmbeddables();
  const [kind, setKind] = useState<ContentCardKind>(initialKind);
  const [ids, setIds] = useState<string[]>(selected);
  const [q, setQ] = useState('');

  const items = useMemo(() => {
    const list = data?.[kind] ?? [];
    const term = q.trim().toLowerCase();
    return term ? list.filter(i => `${i.title} ${i.subtitle ?? ''} ${i.meta ?? ''}`.toLowerCase().includes(term)) : list;
  }, [data, kind, q]);

  const toggle = (id: string) => setIds(cur => (cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id].slice(0, 6)));
  const switchKind = (k: ContentCardKind) => { if (k !== kind) { setKind(k); setIds([]); } };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 p-4 font-sans" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Embed site content"
        className="flex max-h-[80vh] w-full max-w-[640px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onMouseDown={e => e.stopPropagation()}
        onKeyDown={e => { e.stopPropagation(); if (e.key === 'Escape') onClose(); }}
      >
        <div className="flex items-center justify-between border-b border-[#f2f2f2] px-5 py-4">
          <h2 className="text-[16px] font-semibold text-[#242424]">Embed from your site</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-[#6b6b6b] hover:bg-[#f2f2f2]" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        {!lockKind && (
          <div className="flex gap-1 border-b border-[#f2f2f2] px-3 pt-2">
            {TABS.map(t => (
              <button
                key={t.kind}
                type="button"
                onClick={() => switchKind(t.kind)}
                className={`flex items-center gap-2 border-b-2 px-3 py-2 text-[14px] ${kind === t.kind ? 'border-[#242424] text-[#242424]' : 'border-transparent text-[#6b6b6b] hover:text-[#242424]'}`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
                <span className="text-[12px] text-[#9b9b9b]">{data?.[t.kind]?.length ?? ''}</span>
              </button>
            ))}
          </div>
        )}

        <div className="px-5 py-3">
          <div className="flex items-center gap-2 rounded-lg bg-[#f6f6f6] px-3 py-2">
            <Search className="h-4 w-4 text-[#9b9b9b]" />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" />
          </div>
        </div>

        <ul className="min-h-[200px] flex-1 overflow-y-auto px-3 pb-3">
          {!data && <li className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#9b9b9b]" /></li>}
          {data && items.length === 0 && <li className="py-12 text-center text-[14px] text-[#9b9b9b]">Nothing here yet.</li>}
          {items.map(item => {
            const on = ids.includes(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors ${on ? 'bg-[#eef7ee]' : 'hover:bg-[#f6f6f6]'}`}
                >
                  <span className="h-12 w-16 shrink-0 overflow-hidden rounded bg-[#f2f2f2]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[14px] font-medium text-[#242424]">{item.title}</span>
                      {item.status && !['published', 'PUBLISHED'].includes(item.status) && (
                        <span className="rounded bg-[#fdf6e7] px-1.5 text-[11px] uppercase text-[#7a5a00]">{item.status.toLowerCase()}</span>
                      )}
                    </span>
                    <span className="block truncate text-[13px] text-[#6b6b6b]">{item.meta || item.subtitle}</span>
                  </span>
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${on ? 'border-[#1a8917] bg-[#1a8917] text-white' : 'border-[#c4c4c4]'}`}>
                    {on && <Check className="h-3.5 w-3.5" />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between border-t border-[#f2f2f2] px-5 py-3">
          <span className="text-[13px] text-[#6b6b6b]">{ids.length ? `${ids.length} selected (max 6)` : 'Select one or more'}</span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-[14px] text-[#242424] hover:bg-[#f2f2f2]">Cancel</button>
            <button
              type="button"
              disabled={!ids.length}
              onClick={() => onConfirm(kind, ids)}
              className="rounded-full bg-[#1a8917] px-4 py-2 text-[14px] text-white hover:bg-[#156d12] disabled:opacity-40"
            >
              Embed
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
