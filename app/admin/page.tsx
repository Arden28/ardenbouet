'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

/* ===================== Types ===================== */
type CaseImage = { src: string; alt: string };
type CaseFile = {
  problem: string;
  approach: string[];
  result: string;
  images?: CaseImage[];
  tags?: string[];
  tech?: string[];
};
type Project = {
  id: string;
  title: string;
  description: string;
  logoUrl: string;
  url: string;
  tags: Array<'saas' | 'client' | 'open-source'>;
  tech?: string[];
  metric?: string;
  caseFile?: CaseFile;
};
type Experience = {
  id: string;
  title: string;                 // Company / Title
  job: string;                   // Role
  fromTo: string;                // "Apr 2023 ~ Oct 2023 · 7 months"
  bullets: string[];             // responsibilities
  type: 'Freelance' | 'Remote' | 'Intern';

  // NEW FIELDS
  logline?: string;              // one-liner
  outcomes?: string[];           // results
  tags?: string[];               // tech / industry
  poster?: string;               // logo URL
};
type JourneyItem = {
  id: string;
  kind: 'education' | 'cert';
  year: string;
  title: string;
  org?: string;
  url?: string;
  note?: string;
};
type Note = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover?: string;
  date: string;
  reading: string;
  tags: string[];
};
type ContentBundle = {
  projects: Project[];
  experiences: Experience[];
  journey: JourneyItem[];
  notes: Note[];
};

const STORAGE_KEY = 'arden_cms_v1';

/* ===================== Utils ===================== */
const uid = () => Math.random().toString(36).slice(2, 10);
const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

const splitLines = (v: string) =>
  v.split('\n').map(s => s.trim()).filter(Boolean);

const splitComma = (v: string) =>
  v.split(',').map(s => s.trim()).filter(Boolean);

function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ===================== Small UI atoms ===================== */
function TextField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  required?: boolean;
}) {
  const { label, value, onChange, placeholder, textarea, required } = props;
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      {textarea ? (
        <textarea
          className="mt-1 w-full rounded-lg border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm text-zinc-800 shadow-sm backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] dark:border-zinc-700/50 dark:bg-zinc-900/70 dark:text-zinc-200"
          value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} required={required} rows={4}
        />
      ) : (
        <input
          className="mt-1 w-full rounded-lg border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm text-zinc-800 shadow-sm backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] dark:border-zinc-700/50 dark:bg-zinc-900/70 dark:text-zinc-200"
          value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} required={required}
        />
      )}
    </label>
  );
}

function Chip({
  active, children, onClick,
}: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full border px-3 py-1 text-xs font-medium transition',
        active
          ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)] text-[color:var(--brand)]'
          : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/60',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

/* ===================== Editors ===================== */
/* -- Projects */
function ProjectsEditor({ value, onChange }: { value: Project[]; onChange: (p: Project[]) => void }) {
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

/* -- Experience (now with logline, outcomes, tags, poster) */
function ExperienceEditor({ value, onChange }: { value: Experience[]; onChange: (e: Experience[]) => void }) {
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

/* -- Journey */
function JourneyEditor({ value, onChange }: { value: JourneyItem[]; onChange: (j: JourneyItem[]) => void }) {
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

/* -- Notes */
function NotesEditor({ value, onChange }: { value: Note[]; onChange: (n: Note[]) => void }) {
  const empty: Note = { id: uid(), slug: '', title: '', excerpt: '', cover: '', date: '', reading: '5 min', tags: [] };
  const [draft, setDraft] = useState<Note>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [tagsText, setTagsText] = useState('');

  const startNew = () => { setDraft({ ...empty, id: uid() }); setTagsText(''); setEditId(null); };
  const startEdit = (id: string) => {
    const n = value.find(v => v.id === id); if (!n) return;
    setDraft(JSON.parse(JSON.stringify(n))); setTagsText((n.tags || []).join(', ')); setEditId(id);
  };
  const save = () => {
    const item = { ...draft, slug: draft.slug || slugify(draft.title), tags: splitComma(tagsText) };
    if (!item.title.trim()) return;
    if (editId) onChange(value.map(v => (v.id === editId ? item : v)));
    else onChange([item, ...value]);
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
        <h3 className="text-sm font-semibold">Note Editor</h3>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <TextField label="Title" value={draft.title} onChange={v => setDraft({ ...draft, title: v })} required />
          <TextField label="Slug (auto if blank)" value={draft.slug} onChange={v => setDraft({ ...draft, slug: slugify(v) })} />
          <TextField label="Excerpt" value={draft.excerpt} onChange={v => setDraft({ ...draft, excerpt: v })} textarea />
          <TextField label="Cover URL" value={draft.cover || ''} onChange={v => setDraft({ ...draft, cover: v })} />
          <TextField label="Date (ISO)" value={draft.date} onChange={v => setDraft({ ...draft, date: v })} placeholder="2025-09-01" />
          <TextField label="Reading time" value={draft.reading} onChange={v => setDraft({ ...draft, reading: v })} placeholder="5 min" />
          <TextField label="Tags (comma)" value={tagsText} onChange={setTagsText} placeholder="saaS, devops" />
          <div className="mt-2 flex gap-2">
            <button onClick={save} className="rounded-md bg-[color:var(--brand)] px-3 py-2 text-sm font-semibold text-white hover:opacity-95">
              {editId ? 'Update' : 'Add note'}
            </button>
            <button onClick={startNew} className="rounded-md border px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300">Reset form</button>
          </div>
        </div>
      </div>
      <div className="md:col-span-3 reel-frame grain p-4">
        <h3 className="text-sm font-semibold">Notes ({value.length})</h3>
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {value.map(n => (
            <li key={n.id} className="rounded-lg border border-zinc-200/70 p-3 text-sm dark:border-zinc-700/50">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{n.title || <em>Untitled</em>}</div>
                  <div className="text-xs text-zinc-500">{n.date} • {n.reading}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => move(n.id, -1)} className="rounded border px-2 py-1">↑</button>
                  <button onClick={() => move(n.id, 1)} className="rounded border px-2 py-1">↓</button>
                  <button onClick={() => startEdit(n.id)} className="rounded border px-2 py-1">Edit</button>
                  <button onClick={() => del(n.id)} className="rounded border px-2 py-1 text-red-600">Del</button>
                </div>
              </div>
              <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{n.excerpt}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ===================== Main Dashboard ===================== */
type Tab = 'projects' | 'experience' | 'journey' | 'notes';

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('projects');

  // DB is source of truth; null until initial load finishes
  const [bundle, setBundle] = useState<ContentBundle | null>(null);

  // status bar state
  const [status, setStatus] = useState<'idle' | 'dirty' | 'saving' | 'error' | 'loaded' | 'loading'>('loading');
  const [autosave, setAutosave] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load from server (fallback to local cache, then empty)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/content', { method: 'GET', credentials: 'same-origin', cache: 'no-store' });
        if (res.status === 401) {
          router.push('/admin/login?next=/admin');
          return;
        }
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as ContentBundle;
        setBundle(json);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(json));
        setStatus('loaded');
      } catch {
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) {
            setBundle(JSON.parse(cached));
            setStatus('loaded');
            return;
          }
        } catch {}
        setBundle({ projects: [], experiences: [], journey: [], notes: [] });
        setStatus('idle');
      }
    })();
  }, [router]);

  // Persist to localStorage & debounced autosave once bundle exists
  useEffect(() => {
    if (!bundle) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bundle));
    setStatus(prev => (prev === 'saving' ? prev : 'dirty'));

    if (autosave) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void saveServer();
      }, 800);
    }
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundle, autosave]);

  const counts = useMemo(
    () => ({
      p: bundle?.projects.length ?? 0,
      e: bundle?.experiences.length ?? 0,
      j: bundle?.journey.length ?? 0,
      n: bundle?.notes.length ?? 0,
    }),
    [bundle]
  );

  // Import JSON
  const onImport = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const parsed = JSON.parse(text) as ContentBundle;
    if (!parsed.projects || !parsed.experiences || !parsed.journey || !parsed.notes) {
      alert('Invalid content file.');
      return;
    }
    setBundle(parsed);
  };

  const exportAll = () => { if (bundle) downloadJSON('content.json', bundle); };

  const resetAll = () => {
    if (!bundle) return;
    if (confirm('Reset dashboard to empty? This will overwrite local changes.')) {
      setBundle({ projects: [], experiences: [], journey: [], notes: [] });
    }
  };

  // Save to server
  async function saveServer() {
    if (!bundle) return;
    try {
      setStatus('saving');
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(bundle),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus('loaded');
    } catch {
      setStatus('error');
      alert('Could not save to server.');
    }
  }

  // Logout
  async function logout() {
    try { await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' }); } catch {}
    router.push('/admin/login');
    router.refresh();
  }

  // Prevent leaving with unsaved changes when autosave is off
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (status === 'dirty' && !autosave) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [status, autosave]);

  // Loading state
  if (!bundle) {
    return (
      <section className="mx-auto mt-8 max-w-6xl px-4 pb-20">
        <div className="reel-frame grain p-6 text-sm text-zinc-600 dark:text-zinc-300">
          Loading content…
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-8 max-w-6xl px-4 pb-20">
      <header className="reel-frame grain p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">
              <span className="bg-gradient-to-r from-black to-[color:var(--brand)] bg-clip-text text-transparent dark:from-white dark:to-[color:var(--brand)]">
                Content Dashboard
              </span>
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              DB-first. JSON export/import for backups; autosave optional.
            </p>
            {/* tiny status bar */}
            <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
              <span
                className={[
                  'inline-flex items-center gap-1 rounded px-2 py-0.5 ring-1',
                  status === 'dirty'  ? 'text-amber-700 ring-amber-300 bg-amber-50/70 dark:bg-amber-900/10' :
                  status === 'saving' ? 'text-sky-700 ring-sky-300 bg-sky-50/70 dark:bg-sky-900/10' :
                  status === 'loaded' ? 'text-emerald-700 ring-emerald-300 bg-emerald-50/70 dark:bg-emerald-900/10' :
                  status === 'error'  ? 'text-red-700 ring-red-300 bg-red-50/70 dark:bg-red-900/10' :
                                        'text-zinc-600 ring-zinc-300 bg-zinc-50/70 dark:bg-zinc-800/50'
                ].join(' ')}
              >
                {status === 'dirty'  && 'Unsaved changes'}
                {status === 'saving' && 'Saving…'}
                {status === 'loaded' && 'All changes saved'}
                {status === 'error'  && 'Error'}
                {status === 'idle'   && 'Idle'}
                {status === 'loading'&& 'Loading…'}
              </span>

              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-3 w-3 rounded border-zinc-300"
                  checked={autosave}
                  onChange={e => setAutosave(e.target.checked)}
                />
                Autosave (debounced)
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm text-zinc-800 shadow-sm backdrop-blur dark:border-zinc-700/50 dark:bg-zinc-900/70 dark:text-zinc-200">
              Import
              <input type="file" accept="application/json" hidden onChange={e => onImport(e.target.files?.[0] || null)} />
            </label>

            <button onClick={exportAll} className="rounded-md bg-[color:var(--brand)] px-3 py-2 text-sm font-semibold text-white hover:opacity-95">
              Export JSON
            </button>

            <button onClick={resetAll} className="rounded-md border px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300">
              Reset
            </button>

            <button onClick={saveServer} disabled={status === 'saving'} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60">
              {status === 'saving' ? 'Saving…' : 'Save to server'}
            </button>

            <button onClick={logout} className="rounded-md border px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300">
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip active={tab === 'projects'} onClick={() => setTab('projects')}>
            Projects <span className="ml-1 rounded bg-[color:var(--brand-soft)] px-1">{counts.p}</span>
          </Chip>
          <Chip active={tab === 'experience'} onClick={() => setTab('experience')}>
            Experience <span className="ml-1 rounded bg-[color:var(--brand-soft)] px-1">{counts.e}</span>
          </Chip>
          <Chip active={tab === 'journey'} onClick={() => setTab('journey')}>
            Journey <span className="ml-1 rounded bg-[color:var(--brand-soft)] px-1">{counts.j}</span>
          </Chip>
          <Chip active={tab === 'notes'} onClick={() => setTab('notes')}>
            Notes <span className="ml-1 rounded bg-[color:var(--brand-soft)] px-1">{counts.n}</span>
          </Chip>
        </div>
      </header>

      {/* Panels */}
      <div className="mt-6 space-y-6">
        {tab === 'projects'   && <ProjectsEditor   value={bundle.projects}   onChange={v => setBundle(b => ({ ...(b as ContentBundle), projects: v }))} />}
        {tab === 'experience' && <ExperienceEditor value={bundle.experiences} onChange={v => setBundle(b => ({ ...(b as ContentBundle), experiences: v }))} />}
        {tab === 'journey'    && <JourneyEditor    value={bundle.journey}    onChange={v => setBundle(b => ({ ...(b as ContentBundle), journey: v }))} />}
        {tab === 'notes'      && <NotesEditor      value={bundle.notes}      onChange={v => setBundle(b => ({ ...(b as ContentBundle), notes: v }))} />}
      </div>
    </section>
  );
}
