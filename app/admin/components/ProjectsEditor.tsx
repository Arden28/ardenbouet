'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, GripVertical, Image as ImageIcon, Briefcase, ExternalLink, Hash, X, MoveUp, MoveDown } from 'lucide-react';
import type { Project, CaseImage } from '../types';
import { TextField, uid, splitComma, splitLines, EditorDrawer, Button, Chip, cn } from './atoms';

/* --- Helpers --- */
function TokenInput({ label, value, onChange, placeholder }: { label: string; value: string[]; onChange: (t: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.trim();
      if (val && !value.includes(val)) onChange([...value, val]);
      setInput('');
    }
  };
  return (
    <div className="space-y-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
      <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-200 bg-zinc-50/50 p-2 dark:border-zinc-800 dark:bg-zinc-900/50">
        {value.map(t => (
          <span key={t} className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-medium shadow-sm dark:bg-zinc-800">
            {t}
            <button onClick={() => onChange(value.filter(x => x !== t))} className="text-zinc-400 hover:text-red-500"><X className="h-3 w-3" /></button>
          </span>
        ))}
        <input 
          className="flex-1 bg-transparent text-sm outline-none min-w-[100px]" 
          placeholder={placeholder} 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={handleKeyDown} 
          onBlur={() => { if(input.trim()) { onChange([...value, input.trim()]); setInput(''); }}}
        />
      </div>
    </div>
  );
}

function ImagesManager({ images, onChange }: { images: CaseImage[]; onChange: (imgs: CaseImage[]) => void }) {
    const add = () => onChange([...images, { src: '', alt: '' }]);
    const update = (i: number, field: keyof CaseImage, val: string) => {
        const next = [...images]; next[i] = { ...next[i], [field]: val }; onChange(next);
    };
    const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));
    
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Gallery Images</span>
                <Button variant="secondary" onClick={add} className="h-6 text-xs px-2">+ Add Image</Button>
            </div>
            {images.length === 0 && <div className="text-xs text-zinc-400 italic">No images added.</div>}
            <div className="space-y-2">
                {images.map((img, i) => (
                    <div key={i} className="flex gap-3 items-start rounded-md border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="h-12 w-16 shrink-0 bg-zinc-100 rounded overflow-hidden dark:bg-zinc-800">
                            {img.src && <img src={img.src} className="h-full w-full object-cover" alt="" />}
                        </div>
                        <div className="flex-1 space-y-2">
                            <input className="w-full bg-transparent text-xs outline-none border-b border-zinc-100 pb-1 dark:border-zinc-800" placeholder="Image URL" value={img.src} onChange={e => update(i, 'src', e.target.value)} />
                            <input className="w-full bg-transparent text-xs outline-none" placeholder="Alt Description" value={img.alt} onChange={e => update(i, 'alt', e.target.value)} />
                        </div>
                        <button onClick={() => remove(i)} className="text-zinc-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* --- Main Component --- */
export default function ProjectsEditor({ value, onChange }: { value: Project[]; onChange: (p: Project[]) => void }) {
  const [draft, setDraft] = useState<Project | null>(null);

  const save = () => {
    if (!draft || !draft.title.trim()) return;
    const exists = value.find(p => p.id === draft.id);
    const next = exists ? value.map(p => (p.id === draft.id ? draft : p)) : [draft, ...value];
    onChange(next);
    setDraft(null);
  };

  const remove = (id: string) => { if (confirm('Delete project?')) onChange(value.filter(p => p.id !== id)); };
  
  const move = (id: string, dir: -1 | 1) => {
    const idx = value.findIndex(p => p.id === id);
    if (idx < 0 || idx + dir < 0 || idx + dir >= value.length) return;
    const next = [...value];
    [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
    onChange(next);
  };

  return (
    <>
      {/* GRID VIEW */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button onClick={() => setDraft({ id: uid(), title: '', description: '', logoUrl: '', url: '', tags: [], tech: [] })} className="group flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 transition-colors hover:border-[color:var(--brand)] hover:bg-[color:var(--brand)]/5 hover:text-[color:var(--brand)] dark:border-zinc-700 dark:bg-zinc-900/50">
          <div className="rounded-full bg-white p-3 shadow-sm transition-transform group-hover:scale-110 dark:bg-zinc-800"><Plus className="h-6 w-6" /></div>
          <span className="text-sm font-medium">New Project</span>
        </button>

        {value.map((p) => (
          <div key={p.id} className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {p.logoUrl ? <img src={p.logoUrl} alt="" className="h-10 w-10 rounded-lg object-contain bg-zinc-50 p-1 ring-1 ring-zinc-100 dark:bg-black dark:ring-zinc-800" /> : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800"><Briefcase className="h-5 w-5" /></div>}
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">{p.title || 'Untitled'}</h3>
                    <div className="flex items-center gap-2">
                        {p.url && <a href={p.url} target="_blank" className="text-xs text-zinc-400 hover:text-[color:var(--brand)] truncate max-w-[120px] block">{p.url}</a>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => move(p.id, -1)} className="p-1 hover:text-zinc-900 text-zinc-400"><MoveUp className="h-4 w-4" /></button>
                    <button onClick={() => move(p.id, 1)} className="p-1 hover:text-zinc-900 text-zinc-400"><MoveDown className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="mt-4 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">{p.description}</p>
              {p.caseFile && <div className="mt-3 inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-1 text-[10px] font-bold uppercase text-purple-600 dark:bg-purple-900/20 dark:text-purple-300"><Hash className="h-3 w-3" /> Case File Active</div>}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <div className="flex -space-x-1 overflow-hidden">
                    {p.tags.map(t => <div key={t} className="h-2 w-2 rounded-full bg-zinc-300 ring-2 ring-white dark:ring-zinc-900" title={t} />)}
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    <Button variant="secondary" className="h-8 text-xs" onClick={() => setDraft({ ...p })}>Edit</Button>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* DRAWER EDITOR */}
      <EditorDrawer isOpen={!!draft} onClose={() => setDraft(null)} title={draft?.title || 'New Project'} actions={<Button variant="primary" onClick={save}>Save</Button>}>
        {draft && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <TextField label="Title" value={draft.title} onChange={v => setDraft({...draft, title: v})} required />
               <TextField label="Live URL" value={draft.url} onChange={v => setDraft({...draft, url: v})} />
            </div>
            <TextField label="Description" value={draft.description} onChange={v => setDraft({...draft, description: v})} textarea />
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
                <span className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-zinc-500">Tags</span>
                <div className="flex gap-2 mb-4">
                    {['saas', 'client', 'open-source'].map((t: any) => (
                        <Chip key={t} active={draft.tags.includes(t)} onClick={() => setDraft({...draft, tags: draft.tags.includes(t) ? draft.tags.filter(x=>x!==t) : [...draft.tags, t]})}>{t}</Chip>
                    ))}
                </div>
                <TextField label="Tech Stack" value={draft.tech?.join(', ') || ''} onChange={v => setDraft({...draft, tech: splitComma(v)})} placeholder="React, Next.js..." />
            </div>
            <TextField label="Logo URL" value={draft.logoUrl} onChange={v => setDraft({...draft, logoUrl: v})} />
            
            {/* --- IMPROVED CASE FILE SECTION --- */}
            <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="bg-zinc-100 p-3 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
                    <h3 className="font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                        <Hash className="h-4 w-4 text-[color:var(--brand)]" /> Case File
                    </h3>
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Deep Dive</div>
                </div>
                <div className="p-4 space-y-5 bg-white dark:bg-[#09090b]">
                    <TextField label="The Problem" value={draft.caseFile?.problem || ''} onChange={v => setDraft({...draft, caseFile: { ...draft.caseFile!, problem: v }})} textarea />
                    <TextField label="Approach (One per line)" value={draft.caseFile?.approach?.join('\n') || ''} onChange={v => setDraft({...draft, caseFile: { ...draft.caseFile!, approach: splitLines(v) }})} textarea placeholder="• Utilized Redis for caching..." />
                    <TextField label="The Result" value={draft.caseFile?.result || ''} onChange={v => setDraft({...draft, caseFile: { ...draft.caseFile!, result: v }})} textarea />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TokenInput label="Case Tags" value={draft.caseFile?.tags || []} onChange={v => setDraft({...draft, caseFile: {...draft.caseFile!, tags: v}})} placeholder="ux, design" />
                        <TokenInput label="Case Tech" value={draft.caseFile?.tech || []} onChange={v => setDraft({...draft, caseFile: {...draft.caseFile!, tech: v}})} placeholder="Figma, Stripe" />
                    </div>
                    
                    <ImagesManager images={draft.caseFile?.images || []} onChange={imgs => setDraft({...draft, caseFile: {...draft.caseFile!, images: imgs}})} />
                </div>
            </div>
          </div>
        )}
      </EditorDrawer>
    </>
  );
}