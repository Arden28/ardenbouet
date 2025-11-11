'use client';

import { useEffect, useState } from 'react';
import type { Project } from '../types';
import { Chip, TextField, uid, splitComma, splitLines } from './atoms';

export default function ProjectsEditor({ value, onChange }: { value: Project[]; onChange: (p: Project[]) => void }) {
  const empty: Project = { id: uid(), title: '', description: '', logoUrl: '', url: '', tags: [], tech: [] };
  const [draft, setDraft] = useState<Project>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [tagPick, setTagPick] = useState<Array<'saas' | 'client' | 'open-source'>>([]);

  useEffect(() => { setTagPick(draft.tags || []); }, [draft.id]);

  const startNew = () => { setDraft({ ...empty, id: uid() }); setEditId(null); setTagPick([]); };
  const startEdit = (id: string) => {
    const p = value.find(x => x.id === id); if (!p) return;
    setDraft(JSON.parse(JSON.stringify(p))); setEditId(id);
  };
  const save = () => {
    const item = { ...draft, tags: tagPick };
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
  const toggleTag = (t: 'saas' | 'client' | 'open-source') =>
    setTagPick(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));
  const caseFile = draft.caseFile || { problem: '', approach: [], result: '', images: [], tags: [], tech: [] };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
      <div className="md:col-span-2 reel-frame grain p-4">
        <h3 className="text-sm font-semibold">Project Editor</h3>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <TextField label="Title" value={draft.title} onChange={v => setDraft({ ...draft, title: v })} required />
          <TextField label="Description" value={draft.description} onChange={v => setDraft({ ...draft, description: v })} textarea />
          <TextField label="Logo URL" value={draft.logoUrl} onChange={v => setDraft({ ...draft, logoUrl: v })} />
          <TextField label="Project URL" value={draft.url} onChange={v => setDraft({ ...draft, url: v })} />
          <div>
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Tags</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {(['saas', 'client', 'open-source'] as const).map(t => (
                <Chip key={t} active={tagPick.includes(t)} onClick={() => toggleTag(t)}>{t}</Chip>
              ))}
            </div>
          </div>
          <TextField
            label="Tech (comma separated)"
            value={(draft.tech || []).join(', ')}
            onChange={v => setDraft({ ...draft, tech: splitComma(v) })}
            placeholder="Laravel, Next.js, Redis"
          />
          <TextField label="Metric (optional)" value={draft.metric || ''} onChange={v => setDraft({ ...draft, metric: v })} />
          <details className="rounded-lg border border-zinc-200/70 p-3 dark:border-zinc-700/50">
            <summary className="cursor-pointer text-sm font-semibold">Case File</summary>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <TextField label="Problem" value={caseFile.problem} onChange={v => setDraft({ ...draft, caseFile: { ...caseFile, problem: v } })} textarea />
              <TextField
                label="Approach (one per line)"
                value={(caseFile.approach || []).join('\n')}
                onChange={v => setDraft({ ...draft, caseFile: { ...caseFile, approach: splitLines(v) } })}
                textarea
              />
              <TextField label="Result" value={caseFile.result} onChange={v => setDraft({ ...draft, caseFile: { ...caseFile, result: v } })} textarea />
              <TextField
                label="Case Tags (comma)"
                value={(caseFile.tags || []).join(', ')}
                onChange={v => setDraft({ ...draft, caseFile: { ...caseFile, tags: splitComma(v) } })}
              />
              <TextField
                label="Case Tech (comma)"
                value={(caseFile.tech || []).join(', ')}
                onChange={v => setDraft({ ...draft, caseFile: { ...caseFile, tech: splitComma(v) } })}
              />
              <TextField
                label="Images (src|alt per line)"
                value={(caseFile.images || []).map(im => `${im.src}|${im.alt}`).join('\n')}
                onChange={v => setDraft({
                  ...draft,
                  caseFile: {
                    ...caseFile,
                    images: splitLines(v).map(line => {
                      const [src, alt = ''] = line.split('|');
                      return { src: (src || '').trim(), alt: (alt || '').trim() };
                    }),
                  },
                })}
                textarea
              />
            </div>
          </details>
          <div className="mt-2 flex gap-2">
            <button onClick={save} className="rounded-md bg-[color:var(--brand)] px-3 py-2 text-sm font-semibold text-white hover:opacity-95">
              {editId ? 'Update' : 'Add project'}
            </button>
            <button onClick={startNew} className="rounded-md border px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300">Reset form</button>
          </div>
        </div>
      </div>
      <div className="md:col-span-3 reel-frame grain p-4">
        <h3 className="text-sm font-semibold">Projects ({value.length})</h3>
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {value.map(p => (
            <li key={p.id} className="rounded-lg border border-zinc-200/70 p-3 text-sm dark:border-zinc-700/50">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{p.title || <em>Untitled</em>}</div>
                  <div className="text-xs text-zinc-500">{(p.tags || []).join(', ')}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => move(p.id, -1)} className="rounded border px-2 py-1">↑</button>
                  <button onClick={() => move(p.id, 1)} className="rounded border px-2 py-1">↓</button>
                  <button onClick={() => startEdit(p.id)} className="rounded border px-2 py-1">Edit</button>
                  <button onClick={() => del(p.id)} className="rounded border px-2 py-1 text-red-600">Del</button>
                </div>
              </div>
              {p.caseFile?.problem && (
                <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">Case: {p.caseFile.problem}</div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
