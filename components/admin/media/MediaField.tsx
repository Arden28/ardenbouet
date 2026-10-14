'use client';
// A form field holding one media URL: preview + Choose / Replace / Remove, backed by the media library.
import { useState } from 'react';
import { ImagePlus, X, Film, FileText, Link2 } from 'lucide-react';
import { openMediaPicker } from './MediaPicker';
import { kindOf } from './api';

export function MediaField({
  value, onChange, accept = 'image/*', label, hint, aspect = '16/9', allowUrl = true, compact = false,
}: {
  value: string | null | undefined;
  onChange: (url: string) => void;
  accept?: string;
  label?: string;
  hint?: string;
  aspect?: string;
  allowUrl?: boolean;
  compact?: boolean;
}) {
  const [urlMode, setUrlMode] = useState(false);
  const [broken, setBroken] = useState(false);
  const kind = value ? kindOf('', value.split('?')[0]) : 'other';

  const choose = async () => {
    const picked = await openMediaPicker({ accept, title: label ? `Choose ${label.toLowerCase()}` : undefined });
    if (picked?.[0]) { setBroken(false); onChange(picked[0].url); }
  };

  return (
    <div className="blog-ui">
      {label && <span className="mb-1.5 block text-[13px] font-medium text-[#242424]">{label}</span>}
      {value ? (
        <div className={`group checker relative overflow-hidden rounded-lg ring-1 ring-[#f2f2f2] ${compact ? 'h-20 w-32' : 'w-full'}`} style={compact ? undefined : { aspectRatio: aspect }}>
          {kind === 'image' && !broken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" onError={() => setBroken(true)} className="h-full w-full object-cover" />
          ) : kind === 'video' ? (
            <video src={value} muted className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-[#9b9b9b]">
              {kind === 'document' ? <FileText className="h-6 w-6" /> : <Film className="h-6 w-6" />}
              <span className="max-w-full truncate text-[11px]">{value.split('/').pop()}</span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
            <button type="button" onClick={choose} className="rounded-full bg-white px-3 py-1.5 text-[12px] font-medium text-[#242424] shadow">Replace</button>
            <button type="button" onClick={() => onChange('')} className="rounded-full bg-white p-1.5 text-[#242424] shadow" aria-label="Remove"><X className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={choose}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-[#e6e6e6] text-[#6b6b6b] transition-colors hover:border-[#c4c4c4] hover:text-[#242424] ${compact ? 'h-20 w-32' : 'w-full'}`}
          style={compact ? undefined : { aspectRatio: aspect }}
        >
          <ImagePlus className="h-5 w-5" strokeWidth={1.5} />
          <span className="text-[13px]">Choose from library</span>
        </button>
      )}
      {allowUrl && (
        urlMode ? (
          <input
            autoFocus
            defaultValue={value ?? ''}
            onBlur={e => { onChange(e.target.value.trim()); setUrlMode(false); }}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setUrlMode(false); }}
            placeholder="https://…"
            className="mt-2 w-full rounded-md border border-[#e6e6e6] px-3 py-1.5 font-mono text-[12px] outline-none focus:border-[#242424]"
          />
        ) : (
          <button type="button" onClick={() => setUrlMode(true)} className="mt-1.5 flex items-center gap-1 text-[12px] text-[#9b9b9b] hover:text-[#242424]">
            <Link2 className="h-3 w-3" /> {value ? 'Edit URL' : 'Or paste a URL'}
          </button>
        )
      )}
      {hint && <p className="mt-1 text-[12px] text-[#9b9b9b]">{hint}</p>}
    </div>
  );
}
