'use client';

import { useEffect, useRef, useState } from 'react';
import type { Project } from '../types';
import { Chip, TextField, uid, splitComma, splitLines } from './atoms';

/* ----------------------- Small helpers ----------------------- */
type CaseImageRow = { id: string; src: string; alt: string };

function normArray<T>(a?: T[]) { return Array.isArray(a) ? a : []; }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

/* Token input for comma/enter-separated chips (tags/tech) */
function TokenInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (tokens: string[]) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => { setText(''); }, [label]); // reset when reusing component with diff label

  const commit = (raw: string) => {
    const parts = splitComma(raw.replace(/[，]/g, ',')); // normalize full-width commas
    if (!parts.length) return;
    const next = [...value];
    for (const p of parts) {
      if (!p) continue;
      if (!next.includes(p)) next.push(p);
    }
    onChange(next);
    setText('');
  };

  return (
    <div>
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      <div className="mt-2 rounded-lg border border-zinc-200/70 bg-white/80 p-2 text-sm dark:border-zinc-700/50 dark:bg-zinc-900/70">
        <div className="flex flex-wrap gap-2">
          {value.map((t, i) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full border px-2 py-[2px] text-[12px] dark:border-zinc-700">
              {t}
              <button
                type="button"
                className="ml-1 rounded px-1 text-[11px] opacity-70 hover:opacity-100"
                onClick={() => onChange(value.filter((x, idx) => idx !== i))}
                aria-label={`Remove ${t}`}
              >
                ✕
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                commit(text);
              } else if (e.key === 'Backspace' && text === '' && value.length) {
                // quick remove last chip
                onChange(value.slice(0, -1));
              }
            }}
            onBlur={() => commit(text)}
            placeholder={placeholder || 'Type and press Enter'}
            className="min-w-[8ch] flex-1 bg-transparent outline-none placeholder:text-zinc-400"
          />
        </div>
      </div>
    </div>
  );
}

/* Image list editor with reorder/preview */
function ImagesEditor({
  label = 'Images',
  rows,
  onChange,
}: {
  label?: string;
  rows: CaseImageRow[];
  onChange: (rows: CaseImageRow[]) => void;
}) {
  const pasteRef = useRef<HTMLTextAreaElement | null>(null);

  const addRow = (r?: Partial<CaseImageRow>) =>
    onChange([{ id: uid(), src: r?.src?.trim() || '', alt: r?.alt?.trim() || '' }, ...rows]);

  const update = (id: string, patch: Partial<CaseImageRow>) =>
    onChange(rows.map(r => (r.id === id ? { ...r, ...patch } : r)));

  const remove = (id: string) => onChange(rows.filter(r => r.id !== id));

  const dup = (id: string) => {
    const idx = rows.findIndex(r => r.id === id);
    if (idx < 0) return;
    const copy = { ...rows[idx], id: uid() };
    const next = [...rows];
    next.splice(idx + 1, 0, copy);
    onChange(next);
  };

  const move = (id: string, dir: -1 | 1) => {
    const i = rows.findIndex(r => r.id === id);
    if (i < 0) return;
    const j = clamp(i + dir, 0, rows.length - 1);
    if (i === j) return;
    const next = [...rows];
    const [item] = next.splice(i, 1);
    next.splice(j, 0, item);
    onChange(next);
  };

  const bulkPaste = () => {
    const v = pasteRef.current?.value || '';
    const lines = splitLines(v);
    if (!lines.length) return;
    const parsed = lines.map(line => {
      const [src, alt = ''] = line.split('|');
      return { id: uid(), src: (src || '').trim(), alt: (alt || '').trim() };
    });
    onChange([...parsed, ...rows]);
    if (pasteRef.current) pasteRef.current.value = '';
  };

  return (
    <div>
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      <div className="mt-2 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => addRow()}>
            + Add image
          </button>
          <details className="rounded border px-2 py-1 text-xs open:shadow-sm">
            <summary className="cursor-pointer">Bulk paste (src|alt per line)</summary>
            <div className="mt-2">
              <textarea
                ref={pasteRef}
                rows={3}
                className="w-full rounded border border-zinc-200/70 bg-white/80 p-2 text-sm dark:border-zinc-700/50 dark:bg-zinc-900/70"
                placeholder="https://.../a.png|Landing screenshot&#10;https://.../b.png|Dashboard"
              />
              <div className="mt-2 flex gap-2">
                <button type="button" className="rounded border px-2 py-1 text-xs" onClick={bulkPaste}>
                  Import lines
                </button>
                <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => (pasteRef.current ? (pasteRef.current.value = '') : null)}>
                  Clear
                </button>
              </div>
            </div>
          </details>
        </div>

        {!rows.length && (
          <div className="rounded border border-dashed p-3 text-xs text-zinc-500 dark:border-zinc-700">
            No images yet. Use **Add image** or **Bulk paste**.
          </div>
        )}

        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={r.id} className="rounded-lg border border-zinc-200/70 p-3 text-sm dark:border-zinc-700/50">
              <div className="flex items-start gap-3">
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700">
                  {r.src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.src} alt={r.alt || 'preview'} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-400">preview</div>
                  )}
                </div>

                <div className="grid w-full grid-cols-1 gap-2 md:grid-cols-5">
                  <label className="md:col-span-3">
                    <span className="text-[11px] text-zinc-500">Src</span>
                    <input
                      value={r.src}
                      onChange={(e) => update(r.id, { src: e.target.value })}
                      placeholder="https://.../image.png"
                      className="mt-1 w-full rounded border border-zinc-200/70 bg-white/80 px-2 py-1 text-sm dark:border-zinc-700/50 dark:bg-zinc-900/70"
                    />
                  </label>
                  <label className="md:col-span-2">
                    <span className="text-[11px] text-zinc-500">Alt</span>
                    <input
                      value={r.alt}
                      onChange={(e) => update(r.id, { alt: e.target.value })}
                      placeholder="Screenshot of dashboard"
                      className="mt-1 w-full rounded border border-zinc-200/70 bg-white/80 px-2 py-1 text-sm dark:border-zinc-700/50 dark:bg-zinc-900/70"
                    />
                  </label>

                  <div className="flex items-end gap-2 md:col-span-5">
                    <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => move(r.id, -1)} title="Move up">↑</button>
                    <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => move(r.id, 1)}  title="Move down">↓</button>
                    <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => dup(r.id)}      title="Duplicate">⎘</button>
                    <button type="button" className="rounded border px-2 py-1 text-xs text-red-600" onClick={() => remove(r.id)} title="Delete">Del</button>
                    <span className="ml-auto text-[11px] text-zinc-500">#{i + 1}</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function ProjectsEditor({ value, onChange }: { value: Project[]; onChange: (p: Project[]) => void }) {
  const empty: Project = { id: uid(), title: '', description: '', logoUrl: '', url: '', tags: [], tech: [] };
  const [draft, setDraft] = useState<Project>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [tagPick, setTagPick] = useState<Array<'saas' | 'client' | 'open-source'>>([]);

  /* ---- Local case-file state for smooth UX ---- */
  const [caseProblem, setCaseProblem] = useState('');
  const [caseApproachText, setCaseApproachText] = useState(''); // multi-line
  const [caseResult, setCaseResult] = useState('');
  const [caseTags, setCaseTags] = useState<string[]>([]);
  const [caseTech, setCaseTech] = useState<string[]>([]);
  const [caseImages, setCaseImages] = useState<CaseImageRow[]>([]);

  /* Sync tag chips (project-level) when switching drafts */
  useEffect(() => { setTagPick(draft.tags || []); }, [draft.id]);

  /* Sync case-draft from project draft on load/edit */
  useEffect(() => {
    const cf = draft.caseFile || { problem: '', approach: [], result: '', images: [], tags: [], tech: [] };
    setCaseProblem(cf.problem || '');
    setCaseApproachText(normArray(cf.approach).join('\n'));
    setCaseResult(cf.result || '');
    setCaseTags(normArray(cf.tags));
    setCaseTech(normArray(cf.tech));
    setCaseImages(normArray(cf.images).map(im => ({ id: uid(), src: im.src || '', alt: im.alt || '' })));
  }, [draft.id]); // reinit when a new item is selected

  const startNew = () => {
    setDraft({ ...empty, id: uid() });
    setEditId(null);
    setTagPick([]);

    setCaseProblem('');
    setCaseApproachText('');
    setCaseResult('');
    setCaseTags([]);
    setCaseTech([]);
    setCaseImages([]);
  };

  const startEdit = (id: string) => {
    const p = value.find(x => x.id === id); if (!p) return;
    setDraft(JSON.parse(JSON.stringify(p)));
    setEditId(id);
  };

  const save = () => {
    const caseFileNormalized = {
      problem: (caseProblem || '').trim(),
      approach: splitLines(caseApproachText),     // trims & removes empties
      result: (caseResult || '').trim(),
      tags: caseTags,
      tech: caseTech,
      images: caseImages
        .map(({ src, alt }) => ({ src: (src || '').trim(), alt: (alt || '').trim() }))
        .filter(im => !!im.src),
    };

    // drop empty caseFile entirely if no meaningful fields
    const hasCase =
      caseFileNormalized.problem ||
      caseFileNormalized.result ||
      caseFileNormalized.approach.length ||
      caseFileNormalized.tags.length ||
      caseFileNormalized.tech.length ||
      caseFileNormalized.images.length;

    const item: Project = {
      ...draft,
      tags: tagPick,
      tech: (draft.tech || []).map(t => t.trim()).filter(Boolean),
      caseFile: hasCase ? caseFileNormalized : undefined,
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

  const toggleTag = (t: 'saas' | 'client' | 'open-source') =>
    setTagPick(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
      <div className="md:col-span-2 reel-frame grain p-4">
        <h3 className="text-sm font-semibold">Project Editor</h3>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <TextField label="Title" value={draft.title} onChange={v => setDraft({ ...draft, title: v })} required />
          <TextField label="Description" value={draft.description} onChange={v => setDraft({ ...draft, description: v })} textarea />
          <TextField label="Logo URL" value={draft.logoUrl} onChange={v => setDraft({ ...draft, logoUrl: v })} />
          <TextField label="Project URL" value={draft.url} onChange={v => setDraft({ ...draft, url: v })} />

          {/* Project-level tags */}
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

          {/* -------------------- Case File -------------------- */}
          <details className="rounded-lg border border-zinc-200/70 p-3 dark:border-zinc-700/50" open>
            <summary className="cursor-pointer text-sm font-semibold">Case File</summary>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <TextField label="Problem" value={caseProblem} onChange={setCaseProblem} textarea />
              <TextField
                label="Approach (one per line)"
                value={caseApproachText}
                onChange={setCaseApproachText}
                textarea
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-xs"
                  onClick={() => setCaseApproachText((v) => (v ? `${v}\n` : '') + '• ')}
                >
                  + Line
                </button>
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-xs"
                  onClick={() => setCaseApproachText(v => splitLines(v).join('\n'))}
                  title="Trim empty lines / spaces"
                >
                  Normalize
                </button>
              </div>

              <TextField label="Result" value={caseResult} onChange={setCaseResult} textarea />

              {/* Token chip inputs */}
              <TokenInput label="Case Tags" value={caseTags} onChange={setCaseTags} placeholder="ux, payments, b2b" />
              <TokenInput label="Case Tech" value={caseTech} onChange={setCaseTech} placeholder="Laravel, Redis, S3" />

              {/* Images list */}
              <ImagesEditor rows={caseImages} onChange={setCaseImages} />
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
