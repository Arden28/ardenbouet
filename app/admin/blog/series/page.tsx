'use client';
// /admin/blog/series — master/detail: pick a series on the left, edit it on the right
// (cover, title, URL, description, and the stories in reading order: drag to reorder, add, remove).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ExternalLink, GripVertical, Library, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Badge, Button, cx, inputCls } from '@/components/admin/ui';
import { ConfirmDialog, Modal, btnGhost, btnPrimary } from '@/components/admin/media/shared';
import { CoverPicker } from '../editor/Panels';
import '@/app/blog/story.css';

type Story = { id: string; title: string; slug: string; status: string; seriesOrder: number; coverUrl: string | null; readingMinutes: number; publishedAt: string | null };
type Series = { id: string; slug: string; title: string; description: string; coverUrl: string | null; updatedAt: string; posts: Story[] };
type Candidate = { id: string; title: string; status: string; coverUrl: string | null; series: { id: string; title: string } | null };

const STATUS_TONE: Record<string, 'neutral' | 'green' | 'amber' | 'blue'> = { PUBLISHED: 'green', SCHEDULED: 'blue', REVIEW: 'amber', DRAFT: 'neutral', ARCHIVED: 'neutral' };
const same = (a: Series, b: Series) =>
  a.title === b.title && a.slug === b.slug && a.description === b.description && a.coverUrl === b.coverUrl && a.posts.map(p => p.id).join() === b.posts.map(p => p.id).join();

// ─── Add stories dialog ──────────────────────────────────────────────────────

function AddStories({ series, onAdd, onClose }: { series: Series; onAdd: (stories: Candidate[]) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [list, setList] = useState<Candidate[] | null>(null);
  const [picked, setPicked] = useState<Candidate[]>([]);
  useEffect(() => {
    const id = setTimeout(() => {
      fetch(`/api/admin/blog/series?stories=1&q=${encodeURIComponent(q)}`, { cache: 'no-store' }).then(r => r.json()).then(d => setList(d.stories ?? [])).catch(() => setList([]));
    }, 200);
    return () => clearTimeout(id);
  }, [q]);
  const inSeries = new Set(series.posts.map(p => p.id));
  const toggle = (c: Candidate) => setPicked(p => (p.some(x => x.id === c.id) ? p.filter(x => x.id !== c.id) : [...p, c]));

  return (
    <Modal title="Add stories" onClose={onClose} width={560}
      footer={<><button type="button" onClick={onClose} className={btnGhost}>Cancel</button><button type="button" disabled={!picked.length} onClick={() => { onAdd(picked); onClose(); }} className={btnPrimary}>{picked.length > 1 ? `Add ${picked.length} stories` : 'Add story'}</button></>}>
      <label className="flex items-center gap-2.5 rounded-full border border-[#e6e6e6] px-4 py-2 focus-within:border-[#242424]">
        <Search className="h-4 w-4 text-[#9b9b9b]" />
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search your stories" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" />
      </label>
      <ul className="thin-scroll mt-3 h-[340px] overflow-y-auto">
        {list === null && <li className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-[#9b9b9b]" /></li>}
        {list?.length === 0 && <li className="py-16 text-center text-[14px] text-[#9b9b9b]">No stories found.</li>}
        {list?.map(c => {
          const already = inSeries.has(c.id);
          const on = picked.some(x => x.id === c.id);
          return (
            <li key={c.id}>
              <button type="button" disabled={already} onClick={() => toggle(c)}
                className={cx('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left disabled:opacity-40', on ? 'bg-[#f3faf3]' : 'hover:bg-[#fafafa]')}>
                <span className={cx('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border', on || already ? 'border-[#1a8917] bg-[#1a8917] text-white' : 'border-[#d4d4d4]')}>
                  {(on || already) && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                {c.coverUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={c.coverUrl} alt="" className="h-9 w-12 shrink-0 rounded-md object-cover" />
                  : <span className="h-9 w-12 shrink-0 rounded-md bg-[#f2f2f2]" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-[#242424]">{c.title || 'Untitled'}</span>
                  <span className="block truncate text-[12px] text-[#9b9b9b]">
                    {c.status.toLowerCase()}
                    {already ? ' · already in this series' : c.series ? ` · in “${c.series.title}”, will move here` : ''}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

// ─── Editor ──────────────────────────────────────────────────────────────────

function SeriesEditor({ saved, onSaved, onDeleted, onDirty }: { saved: Series; onSaved: (s: Series) => void; onDeleted: () => void; onDirty: (d: boolean) => void }) {
  const [draft, setDraft] = useState(saved);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const dirty = !same(draft, saved);
  useEffect(() => { onDirty(dirty); }, [dirty, onDirty]);

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= draft.posts.length) return;
    const posts = [...draft.posts];
    const [p] = posts.splice(from, 1);
    posts.splice(to, 0, p);
    setDraft({ ...draft, posts });
  };
  const save = async () => {
    setState('saving');
    setError('');
    const res = await fetch('/api/admin/blog/series', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: saved.id, title: draft.title, slug: draft.slug, description: draft.description, coverUrl: draft.coverUrl, postIds: draft.posts.map(p => p.id) }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setState('error'); setError(d.error ?? 'Could not save'); return; }
    setState('saved');
    setDraft(d.series);
    onSaved(d.series);
    setTimeout(() => setState(s => (s === 'saved' ? 'idle' : s)), 1600);
  };
  const remove = async () => {
    await fetch('/api/admin/blog/series', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: saved.id }) });
    onDeleted();
  };

  const minutes = draft.posts.reduce((m, p) => m + p.readingMinutes, 0);
  const published = draft.posts.filter(p => p.status === 'PUBLISHED' || p.status === 'SCHEDULED').length;

  return (
    <div className="rounded-2xl border border-[#f0f0f0] bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#f6f6f6] px-6 py-3">
        <p className="min-w-0 flex-1 text-[13px] text-[#9b9b9b]">
          {draft.posts.length} stor{draft.posts.length === 1 ? 'y' : 'ies'} · {published} public · {minutes} min read
        </p>
        <span className="text-[13px] text-[#9b9b9b]">{state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : dirty ? 'Unsaved changes' : ''}</span>
        <a href={`/blog/series/${saved.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-[#6b6b6b] hover:bg-[#f2f2f2]"><ExternalLink className="h-3.5 w-3.5" /> View</a>
        <button type="button" onClick={() => setDeleting(true)} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] text-[#c94a4a] hover:bg-[#fdf1f1]"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
        {dirty && <Button onClick={() => setDraft(saved)}>Discard</Button>}
        <Button variant="primary" disabled={!dirty || !draft.title.trim()} busy={state === 'saving'} onClick={save}>Save</Button>
      </div>
      {error && <p className="mx-6 mt-4 rounded-lg bg-[#fdf1f1] px-3.5 py-2.5 text-[13px] text-[#c94a4a]">{error}</p>}

      <div className="grid gap-8 p-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <div>
          <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.06em] text-[#9b9b9b]">Cover</p>
          <CoverPicker value={draft.coverUrl} onChange={v => setDraft({ ...draft, coverUrl: v })} fallback={draft.posts.find(p => p.coverUrl)?.coverUrl ?? undefined} />
          {!draft.coverUrl && draft.posts.some(p => p.coverUrl) && <p className="mt-2 text-[12px] leading-5 text-[#9b9b9b]">Without a cover, the first story’s image is used.</p>}
        </div>
        <div className="min-w-0">
          <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Series title"
            className="w-full bg-transparent font-story text-[28px] font-bold leading-tight tracking-[-0.02em] text-[#242424] outline-none placeholder:text-[#c4c4c4]" />
          <label className="mt-3 flex items-center rounded-lg border border-[#e6e6e6] text-[13px] focus-within:border-[#242424]">
            <span className="select-none pl-3 text-[#9b9b9b]">/blog/series/</span>
            <input value={draft.slug} onChange={e => setDraft({ ...draft, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
              className="min-w-0 flex-1 bg-transparent py-2 pr-3 text-[#242424] outline-none" aria-label="Series URL" />
          </label>
          <textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} rows={3}
            placeholder="What will readers get out of this series?" className={cx(inputCls, 'mt-3 resize-none leading-6')} />
        </div>
      </div>

      {/* Stories */}
      <div className="border-t border-[#f6f6f6] px-6 py-5">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-[#242424]">Stories in reading order</h3>
          <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add stories</Button>
        </div>
        {draft.posts.length === 0 ? (
          <button type="button" onClick={() => setAdding(true)} className="mt-4 flex w-full flex-col items-center rounded-xl border-2 border-dashed border-[#e6e6e6] py-10 text-center hover:border-[#c4c4c4]">
            <Library className="h-7 w-7 text-[#c4c4c4]" strokeWidth={1.4} />
            <span className="mt-2 text-[14px] font-medium text-[#242424]">Add the first story</span>
            <span className="text-[13px] text-[#9b9b9b]">Pick existing stories, or set the series from a story’s settings.</span>
          </button>
        ) : (
          <ol className="mt-4 space-y-1.5">
            {draft.posts.map((p, i) => (
              <li key={p.id} draggable
                onDragStart={e => { dragFrom.current = i; e.dataTransfer.effectAllowed = 'move'; }}
                onDragOver={e => { e.preventDefault(); setDragOver(i); }}
                onDragLeave={() => setDragOver(o => (o === i ? null : o))}
                onDrop={e => { e.preventDefault(); if (dragFrom.current !== null) move(dragFrom.current, i); dragFrom.current = null; setDragOver(null); }}
                onDragEnd={() => { dragFrom.current = null; setDragOver(null); }}
                className={cx('group flex items-center gap-3 rounded-xl border bg-white px-3 py-2.5 transition-colors', dragOver === i ? 'border-[#1a8917] bg-[#f3faf3]' : 'border-[#f0f0f0] hover:border-[#e6e6e6]')}>
                <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-[#c4c4c4] group-hover:text-[#9b9b9b]" aria-hidden />
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f2f2f2] text-[13px] font-semibold text-[#242424]">{i + 1}</span>
                {p.coverUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={p.coverUrl} alt="" className="hidden h-9 w-12 shrink-0 rounded-md object-cover sm:block" />
                  : <span className="hidden h-9 w-12 shrink-0 rounded-md bg-[#f6f6f6] sm:block" />}
                <span className="min-w-0 flex-1">
                  <Link href={`/admin/blog/${p.id}`} className="block truncate text-[14px] font-medium text-[#242424] hover:underline">{p.title || 'Untitled'}</Link>
                  <span className="text-[12px] text-[#9b9b9b]">{p.readingMinutes} min read</span>
                </span>
                <Badge tone={STATUS_TONE[p.status] ?? 'neutral'}>{p.status.toLowerCase()}</Badge>
                <span className="flex shrink-0 items-center">
                  <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up" className="rounded-full p-1.5 text-[#6b6b6b] hover:bg-[#f2f2f2] disabled:opacity-25">↑</button>
                  <button type="button" onClick={() => move(i, i + 1)} disabled={i === draft.posts.length - 1} aria-label="Move down" className="rounded-full p-1.5 text-[#6b6b6b] hover:bg-[#f2f2f2] disabled:opacity-25">↓</button>
                  <button type="button" onClick={() => setDraft({ ...draft, posts: draft.posts.filter(x => x.id !== p.id) })} aria-label="Remove from series" title="Remove from series" className="rounded-full p-1.5 text-[#9b9b9b] hover:bg-[#fdf1f1] hover:text-[#c94a4a]"><X className="h-4 w-4" /></button>
                </span>
              </li>
            ))}
          </ol>
        )}
        {draft.posts.some(p => p.status !== 'PUBLISHED' && p.status !== 'SCHEDULED') && (
          <p className="mt-3 text-[12px] text-[#9b9b9b]">Drafts keep their place but only appear to readers once published.</p>
        )}
      </div>

      {adding && (
        <AddStories series={draft} onClose={() => setAdding(false)}
          onAdd={picked => setDraft(d => ({ ...d, posts: [...d.posts, ...picked.map(c => ({ id: c.id, title: c.title, slug: '', status: c.status, seriesOrder: 0, coverUrl: c.coverUrl, readingMinutes: 0, publishedAt: null }))] }))} />
      )}
      {deleting && (
        <ConfirmDialog title={`Delete “${saved.title}”?`} okLabel="Delete series"
          body={<p>The series page goes away. Its {saved.posts.length} stor{saved.posts.length === 1 ? 'y stays' : 'ies stay'} published and simply leave the series.</p>}
          onConfirm={remove} onClose={() => setDeleting(false)} />
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async (select?: string) => {
    const d = await fetch('/api/admin/blog/series', { cache: 'no-store' }).then(r => r.json());
    const list: Series[] = d.series ?? [];
    setSeries(list);
    setActive(a => select ?? (a && list.some(s => s.id === a) ? a : list[0]?.id ?? null));
  }, []);
  useEffect(() => { load(); }, [load]);

  const current = useMemo(() => series?.find(s => s.id === active) ?? null, [series, active]);
  const choose = (id: string) => { if (id === active) return; if (dirty) setPending(id); else setActive(id); };

  const create = async () => {
    if (!newTitle.trim()) return;
    const res = await fetch('/api/admin/blog/series', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTitle }) });
    const d = await res.json();
    setNewTitle('');
    setCreating(false);
    setDirty(false);
    await load(d.series?.id);
  };

  return (
    <AdminShell title="Series" actions={<Button variant="primary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New series</Button>}>
      <div className="mx-auto max-w-[1180px]">
        {series === null ? (
          <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-[#9b9b9b]" /></div>
        ) : series.length === 0 && !creating ? (
          <div className="mx-auto max-w-[460px] py-20 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f2f2f2]"><Library className="h-6 w-6 text-[#6b6b6b]" /></span>
            <h2 className="mt-5 text-[20px] font-semibold text-[#242424]">Group stories into a series</h2>
            <p className="mt-2 text-[14px] leading-6 text-[#6b6b6b]">A series is an ordered collection with its own page, a “Part 2 of 5” header on each story and a table of contents at the end.</p>
            <div className="mt-6"><Button variant="primary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Create your first series</Button></div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="space-y-1.5 lg:sticky lg:top-[88px] lg:self-start">
              {series.map(s => {
                const cover = s.coverUrl || s.posts.find(p => p.coverUrl)?.coverUrl;
                return (
                  <button key={s.id} type="button" onClick={() => choose(s.id)}
                    className={cx('flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors', active === s.id ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-[#ececec]' : 'hover:bg-[#f6f6f6]')}>
                    {cover
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={cover} alt="" className="h-11 w-14 shrink-0 rounded-lg object-cover" />
                      : <span className="flex h-11 w-14 shrink-0 items-center justify-center rounded-lg bg-[#f2f2f2]"><Library className="h-4 w-4 text-[#9b9b9b]" /></span>}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-[#242424]">{s.title}</span>
                      <span className="text-[12px] text-[#9b9b9b]">{s.posts.length} stor{s.posts.length === 1 ? 'y' : 'ies'}</span>
                    </span>
                  </button>
                );
              })}
            </aside>
            <div className="min-w-0">
              {current ? (
                <SeriesEditor key={current.id} saved={current} onDirty={setDirty}
                  onSaved={s => setSeries(list => list?.map(x => (x.id === s.id ? s : x)) ?? null)}
                  onDeleted={() => { setDirty(false); setActive(null); load(); }} />
              ) : (
                <p className="py-20 text-center text-[14px] text-[#9b9b9b]">Pick a series on the left.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {creating && (
        <Modal title="New series" onClose={() => setCreating(false)}
          footer={<><button type="button" onClick={() => setCreating(false)} className={btnGhost}>Cancel</button><button type="button" disabled={!newTitle.trim()} onClick={create} className={btnPrimary}>Create</button></>}>
          <input autoFocus value={newTitle} onChange={e => setNewTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()}
            placeholder="e.g. Building a SaaS from scratch" className={inputCls} />
        </Modal>
      )}
      {pending && (
        <ConfirmDialog title="Discard unsaved changes?" okLabel="Discard" body={<p>You have unsaved changes to this series.</p>}
          onConfirm={() => { setDirty(false); setActive(pending); }} onClose={() => setPending(null)} />
      )}
    </AdminShell>
  );
}
