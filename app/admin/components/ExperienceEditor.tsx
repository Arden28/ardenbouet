'use client';

import { useState } from 'react';
import { Plus, Trash2, Building2, Calendar, MoveUp, MoveDown } from 'lucide-react';
import type { Experience } from '../types';
import { TextField, uid, splitComma, splitLines, EditorDrawer, Button, Chip } from './atoms';

export default function ExperienceEditor({ value, onChange }: { value: Experience[]; onChange: (e: Experience[]) => void }) {
  const [draft, setDraft] = useState<Experience | null>(null);

  const save = () => {
    if (!draft || !draft.title.trim()) return;
    // Helper to clean up empty arrays
    const clean = { ...draft, bullets: draft.bullets.filter(Boolean), outcomes: draft.outcomes?.filter(Boolean) };
    const exists = value.find(p => p.id === clean.id);
    const next = exists ? value.map(p => (p.id === clean.id ? clean : p)) : [clean, ...value];
    onChange(next);
    setDraft(null);
  };

  const remove = (id: string) => { if (confirm('Delete experience?')) onChange(value.filter(e => e.id !== id)); };
  const move = (id: string, dir: -1 | 1) => {
    const idx = value.findIndex(e => e.id === id);
    if (idx < 0 || idx + dir < 0 || idx + dir >= value.length) return;
    const next = [...value]; [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]]; onChange(next);
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <button onClick={() => setDraft({ id: uid(), title: '', job: '', fromTo: '', bullets: [], type: 'Freelance', tags: [] })} className="group flex h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 transition-colors hover:border-[color:var(--brand)] hover:bg-[color:var(--brand)]/5 hover:text-[color:var(--brand)] dark:border-zinc-700 dark:bg-zinc-900/50">
          <div className="rounded-full bg-white p-3 shadow-sm transition-transform group-hover:scale-110 dark:bg-zinc-800"><Plus className="h-6 w-6" /></div>
          <span className="text-sm font-medium">Add Experience</span>
        </button>

        {value.map((e) => (
          <div key={e.id} className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div>
              <div className="flex items-start justify-between">
                <div>
                   <span className="mb-1 inline-block rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800">{e.type}</span>
                   <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{e.title}</h3>
                   <p className="text-sm text-zinc-500">{e.job}</p>
                </div>
                <div className="opacity-0 transition-opacity group-hover:opacity-100 flex gap-1">
                    <button onClick={() => move(e.id, -1)} className="p-1 hover:text-zinc-900 text-zinc-400"><MoveUp className="h-4 w-4" /></button>
                    <button onClick={() => move(e.id, 1)} className="p-1 hover:text-zinc-900 text-zinc-400"><MoveDown className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
                <Calendar className="h-3 w-3" /> {e.fromTo}
              </div>
              {e.logline && <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 italic">"{e.logline}"</p>}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <Button variant="ghost" className="h-7 px-2 text-xs text-red-500" onClick={() => remove(e.id)}>Delete</Button>
                <Button variant="secondary" className="h-7 px-2 text-xs" onClick={() => setDraft({ ...e })}>Edit</Button>
            </div>
          </div>
        ))}
      </div>

      <EditorDrawer isOpen={!!draft} onClose={() => setDraft(null)} title="Edit Experience" actions={<Button variant="primary" onClick={save}>Save</Button>}>
        {draft && (
            <div className="space-y-5">
                <TextField label="Company Name" value={draft.title} onChange={v => setDraft({...draft, title: v})} required />
                <div className="grid grid-cols-2 gap-4">
                    <TextField label="Role" value={draft.job} onChange={v => setDraft({...draft, job: v})} />
                    <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Type</span>
                        <select className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900" 
                            value={draft.type} onChange={e => setDraft({...draft, type: e.target.value as any})}>
                            <option>Freelance</option>
                            <option>Contract</option>
                            <option>Intern</option>
                            <option>Part-time</option>
                            <option>Full-time</option>
                        </select>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Location</span>
                        <select className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900" 
                            value={draft.location} onChange={e => setDraft({...draft, location: e.target.value as any})}>
                            <option>On-site</option>
                            <option>Hybrid</option>
                            <option>Remote</option>
                        </select>
                    </div>
                  <TextField label="Date Range" value={draft.fromTo} onChange={v => setDraft({...draft, fromTo: v})} placeholder="Jan 2024 - Present" />
                </div>
                <TextField label="Logline (Short summary)" value={draft.logline || ''} onChange={v => setDraft({...draft, logline: v})} />
                
                <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/30 space-y-4">
                    <TextField label="Bullets (Key responsibilities, one per line)" value={draft.bullets?.join('\n') || ''} onChange={v => setDraft({...draft, bullets: splitLines(v)})} textarea />
                    <TextField label="Outcomes (Results, one per line)" value={draft.outcomes?.join('\n') || ''} onChange={v => setDraft({...draft, outcomes: splitLines(v)})} textarea />
                    <TextField label="Tags (Tech used)" value={draft.tags?.join(', ') || ''} onChange={v => setDraft({...draft, tags: splitComma(v)})} placeholder="Laravel, React..." />
                </div>
                
                <TextField label="Poster/Image URL" value={draft.poster || ''} onChange={v => setDraft({...draft, poster: v})} />
            </div>
        )}
      </EditorDrawer>
    </>
  );
}