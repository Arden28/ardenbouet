'use client';

import { useState } from 'react';
import type { JourneyItem } from '../types';
import { Chip, TextField, uid } from './atoms';

export default function JourneyEditor({ value, onChange }: { value: JourneyItem[]; onChange: (j: JourneyItem[]) => void }) {
  const empty: JourneyItem = { id: uid(), kind: 'education', year: '', title: '', org: '', url: '', note: '' };
  const [draft, setDraft] = useState<JourneyItem>(empty);
  const [editId, setEditId] = useState<string | null>(null);

  const startNew = () => { setDraft({ ...empty, id: uid() }); setEditId(null); };
  const startEdit = (id: string) => {
    const x = value.find(v => v.id === id); if (!x) return;
    setDraft(JSON.parse(JSON.stringify(x))); setEditId(id);
  };
  const save = () => {
    if (!draft.title.trim()) return;
    if (editId) onChange(value.map(v => (v.id === editId ? draft : v)));
    else onChange([draft, ...value]);
    startNew();
  };
  const del = (id: string) => onChange(value.filter(v => v.id !== id));
  const move = (id: string, dir: -1 | 1) => {
    const i = value.findIndex(v => v.id === id); const j = i + dir;
    if (i < 0 || j < 0 || j >= value.length) return;
    const clone = [...value]; const [it] = clone.splice(i, 1); clone.splice(j, 0, it); onChange(clone);
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
      <div className="md:col-span-2 reel-frame grain p-4">
        <h3 className="text-sm font-semibold">Journey Editor</h3>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Kind</span>
            <select
              className="mt-1 w-full rounded-lg border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm text-zinc-800 shadow-sm backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] dark:border-zinc-700/50 dark:bg-zinc-900/70 dark:text-zinc-200"
              value={draft.kind} onChange={e => setDraft({ ...draft, kind: e.target.value as JourneyItem['kind'] })}
            >
              <option value="education">Education</option>
              <option value="cert">Certification</option>
            </select>
          </label>
          <TextField label="Year / Range" value={draft.year} onChange={v => setDraft({ ...draft, year: v })} placeholder="e.g., 2024 ~ Present" />
          <TextField label="Title" value={draft.title} onChange={v => setDraft({ ...draft, title: v })} required />
          <TextField label="Organization (optional)" value={draft.org || ''} onChange={v => setDraft({ ...draft, org: v })} />
          <TextField label="URL (optional)" value={draft.url || ''} onChange={v => setDraft({ ...draft, url: v })} />
          <TextField label="Note (optional)" value={draft.note || ''} onChange={v => setDraft({ ...draft, note: v })} textarea />
          <div className="mt-2 flex gap-2">
            <button onClick={save} className="rounded-md bg-[color:var(--brand)] px-3 py-2 text-sm font-semibold text-white hover:opacity-95">
              {editId ? 'Update' : 'Add item'}
            </button>
            <button onClick={startNew} className="rounded-md border px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300">Reset form</button>
          </div>
        </div>
      </div>
      <div className="md:col-span-3 reel-frame grain p-4">
        <h3 className="text-sm font-semibold">Journey ({value.length})</h3>
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {value.map(x => (
            <li key={x.id} className="rounded-lg border border-zinc-200/70 p-3 text-sm dark:border-zinc-700/50">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-zinc-500">{x.kind}</div>
                  <div className="font-semibold">{x.title}</div>
                  <div className="text-xs text-zinc-500">{x.org} {x.org && '•'} {x.year}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => move(x.id, -1)} className="rounded border px-2 py-1">↑</button>
                  <button onClick={() => move(x.id, 1)} className="rounded border px-2 py-1">↓</button>
                  <button onClick={() => startEdit(x.id)} className="rounded border px-2 py-1">Edit</button>
                  <button onClick={() => del(x.id)} className="rounded border px-2 py-1 text-red-600">Del</button>
                </div>
              </div>
              {x.note && <p className="mt-2 text-xs text-zinc-700 dark:text-zinc-300">{x.note}</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
