'use client';

import { useState } from 'react';
import type { Experience } from '../types';
import { Chip, TextField, uid, splitComma, splitLines } from './atoms';

export default function ExperienceEditor({ value, onChange }: { value: Experience[]; onChange: (e: Experience[]) => void }) {
  const empty: Experience = {
    id: uid(),
    title: '',
    job: '',
    fromTo: '',
    bullets: [],
    type: 'Freelance',
    logline: '',
    outcomes: [],
    tags: [],
    poster: '',
  };

  const [draft, setDraft] = useState<Experience>(empty);
  const [editId, setEditId] = useState<string | null>(null);

  const [bulletsText, setBulletsText] = useState('');
  const [outcomesText, setOutcomesText] = useState('');
  const [tagsText, setTagsText] = useState('');

  const startNew = () => {
    setDraft({ ...empty, id: uid() });
    setEditId(null);
    setBulletsText('');
    setOutcomesText('');
    setTagsText('');
  };

  const startEdit = (id: string) => {
    const x = value.find(v => v.id === id); if (!x) return;
    setDraft(JSON.parse(JSON.stringify(x)));
    setBulletsText((x.bullets || []).join('\n'));
    setOutcomesText((x.outcomes || []).join('\n'));
    setTagsText((x.tags || []).join(', '));
    setEditId(id);
  };

  const save = () => {
    const item: Experience = {
      ...draft,
      bullets: splitLines(bulletsText),
      outcomes: splitLines(outcomesText),
      tags: splitComma(tagsText),
      // normalize empties to undefined for cleaner payloads
      logline: (draft.logline || '').trim() || undefined,
      poster: (draft.poster || '').trim() || undefined,
    };

    if (!item.title.trim()) return;
    if (editId) onChange(value.map(v => (v.id === editId ? item : v)));
    else onChange([item, ...value]);
    startNew();
  };

  const del = (id: string) => onChange(value.filter(v => v.id !== id));
  const move = (id: string, dir: -1 | 1) => {
    const i = value.findIndex(v => v.id === id); if (i < 0) return;
    const j = i + dir; if (j < 0 || j >= value.length) return;
    const clone = [...value]; const [it] = clone.splice(i, 1); clone.splice(j, 0, it); onChange(clone);
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
      <div className="md:col-span-2 reel-frame grain p-4">
        <h3 className="text-sm font-semibold">Experience Editor</h3>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <TextField label="Company / Title" value={draft.title} onChange={v => setDraft({ ...draft, title: v })} required />
          <TextField label="Role" value={draft.job} onChange={v => setDraft({ ...draft, job: v })} />
          <TextField label="From–To" value={draft.fromTo} onChange={v => setDraft({ ...draft, fromTo: v })} placeholder="e.g., Apr. 2023 ~ Oct. 2023 · 7 months" />
          <label className="block">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Type</span>
            <select
              className="mt-1 w-full rounded-lg border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm text-zinc-800 shadow-sm backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] dark:border-zinc-700/50 dark:bg-zinc-900/70 dark:text-zinc-200"
              value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value as Experience['type'] })}
            >
              <option>Freelance</option>
              <option>Remote</option>
              <option>Intern</option>
            </select>
          </label>

          {/* NEW: Logline */}
          <TextField label="Logline (one line)" value={draft.logline || ''} onChange={v => setDraft({ ...draft, logline: v })} />

          {/* Bullets */}
          <TextField label="Bullets (one per line)" value={bulletsText} onChange={setBulletsText} textarea />

          {/* NEW: Outcomes */}
          <TextField label="Outcomes (one per line)" value={outcomesText} onChange={setOutcomesText} textarea />

          {/* NEW: Tags */}
          <TextField label="Tags (comma)" value={tagsText} onChange={setTagsText} placeholder="Laravel, Livewire, Finance" />

          {/* NEW: Poster */}
          <TextField label="Poster / Logo URL (optional)" value={draft.poster || ''} onChange={v => setDraft({ ...draft, poster: v })} />

          <div className="mt-2 flex gap-2">
            <button onClick={save} className="rounded-md bg-[color:var(--brand)] px-3 py-2 text-sm font-semibold text-white hover:opacity-95">
              {editId ? 'Update' : 'Add experience'}
            </button>
            <button onClick={startNew} className="rounded-md border px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300">Reset form</button>
          </div>
        </div>
      </div>

      <div className="md:col-span-3 reel-frame grain p-4">
        <h3 className="text-sm font-semibold">Experiences ({value.length})</h3>
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {value.map(x => (
            <li key={x.id} className="rounded-lg border border-zinc-200/70 p-3 text-sm dark:border-zinc-700/50">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{x.title || <em>Untitled</em>}</div>
                  <div className="text-xs text-zinc-500">
                    {x.job} • {x.type}
                  </div>
                  <div className="text-xs text-zinc-500">{x.fromTo}</div>
                  {x.logline && <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{x.logline}</div>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => move(x.id, -1)} className="rounded border px-2 py-1">↑</button>
                  <button onClick={() => move(x.id, 1)} className="rounded border px-2 py-1">↓</button>
                  <button onClick={() => startEdit(x.id)} className="rounded border px-2 py-1">Edit</button>
                  <button onClick={() => del(x.id)} className="rounded border px-2 py-1 text-red-600">Del</button>
                </div>
              </div>

              {!!x.bullets?.length && (
                <ul className="mt-2 list-disc pl-5 text-xs text-zinc-700 dark:text-zinc-300">
                  {x.bullets.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              )}

              {!!x.outcomes?.length && (
                <div className="mt-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--brand)' }}>
                    Outcomes
                  </div>
                  <ul className="mt-1 list-disc pl-5 text-xs text-zinc-700 dark:text-zinc-300">
                    {x.outcomes.map((o, i) => <li key={i}>{o}</li>)}
                  </ul>
                </div>
              )}

              {!!x.tags?.length && (
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {x.tags.map((t, i) => (
                    <span key={i} className="rounded-full border px-2 py-[2px] text-[11px] text-zinc-700 dark:text-zinc-300">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
