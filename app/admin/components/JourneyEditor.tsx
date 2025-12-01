'use client';

import { useState } from 'react';
import { Plus, GraduationCap, Award, ExternalLink, MoveUp, MoveDown, X } from 'lucide-react';
import type { JourneyItem } from '../types';
import { TextField, uid, EditorDrawer, Button } from './atoms';

export default function JourneyEditor({ value, onChange }: { value: JourneyItem[]; onChange: (j: JourneyItem[]) => void }) {
  const [draft, setDraft] = useState<JourneyItem | null>(null);

  const save = () => {
    if (!draft || !draft.title.trim()) return;
    const exists = value.find(p => p.id === draft.id);
    const next = exists ? value.map(p => (p.id === draft.id ? draft : p)) : [draft, ...value];
    onChange(next);
    setDraft(null);
  };
  
  const remove = (id: string) => { if (confirm('Delete item?')) onChange(value.filter(j => j.id !== id)); };
  const move = (id: string, dir: -1 | 1) => {
    const idx = value.findIndex(j => j.id === id);
    if (idx < 0 || idx + dir < 0 || idx + dir >= value.length) return;
    const next = [...value]; [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]]; onChange(next);
  };

  return (
    <>
      <div className="space-y-3 max-w-4xl mx-auto">
        <Button variant="secondary" className="w-full h-12 border-dashed" onClick={() => setDraft({ id: uid(), kind: 'education', year: '', title: '', org: '', url: '', note: '' })}>
            <Plus className="h-4 w-4 mr-2" /> Add Journey Step
        </Button>

        {value.map((j) => (
          <div key={j.id} className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${j.kind === 'education' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'}`}>
                {j.kind === 'education' ? <GraduationCap className="h-6 w-6" /> : <Award className="h-6 w-6" />}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-zinc-400">{j.year}</span>
                    <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                    <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">{j.kind}</span>
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{j.title}</h3>
                <div className="text-sm text-zinc-500">{j.org}</div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => move(j.id, -1)} className="p-2 hover:bg-zinc-100 rounded dark:hover:bg-zinc-800"><MoveUp className="h-4 w-4 text-zinc-400" /></button>
                <button onClick={() => move(j.id, 1)} className="p-2 hover:bg-zinc-100 rounded dark:hover:bg-zinc-800"><MoveDown className="h-4 w-4 text-zinc-400" /></button>
                <Button variant="secondary" className="h-8 text-xs" onClick={() => setDraft({ ...j })}>Edit</Button>
                <Button variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-600" onClick={() => remove(j.id)}><X className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>

      <EditorDrawer isOpen={!!draft} onClose={() => setDraft(null)} title="Edit Journey" actions={<Button variant="primary" onClick={save}>Save</Button>}>
        {draft && (
            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Kind</span>
                        <select className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900" 
                            value={draft.kind} onChange={e => setDraft({...draft, kind: e.target.value as any})}>
                            <option value="education">Education</option><option value="cert">Certification</option>
                        </select>
                    </div>
                    <TextField label="Year" value={draft.year} onChange={v => setDraft({...draft, year: v})} placeholder="2023" />
                </div>
                <TextField label="Title (Degree/Cert Name)" value={draft.title} onChange={v => setDraft({...draft, title: v})} required />
                <TextField label="Organization" value={draft.org || ''} onChange={v => setDraft({...draft, org: v})} placeholder="University or Platform" />
                <TextField label="Credential URL" value={draft.url || ''} onChange={v => setDraft({...draft, url: v})} />
                <TextField label="Note" value={draft.note || ''} onChange={v => setDraft({...draft, note: v})} textarea />
            </div>
        )}
      </EditorDrawer>
    </>
  );
}