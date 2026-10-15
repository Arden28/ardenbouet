'use client';
// /admin/blog/series — create series, edit details, reorder their stories.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { CoverPicker } from '../editor/Panels';
import '@/app/blog/story.css';

type Series = {
  id: string; slug: string; title: string; description: string; coverUrl: string | null;
  posts: { id: string; title: string; status: string; seriesOrder: number }[];
};

function SeriesCard({ s, onChanged }: { s: Series; onChanged: () => void }) {
  const [draft, setDraft] = useState(s);
  const [saving, setSaving] = useState(false);
  const dirty = draft.title !== s.title || draft.description !== s.description || draft.coverUrl !== s.coverUrl || draft.posts.map(p => p.id).join() !== s.posts.map(p => p.id).join();

  const move = (i: number, d: -1 | 1) => {
    const posts = [...draft.posts];
    const j = i + d;
    if (j < 0 || j >= posts.length) return;
    [posts[i], posts[j]] = [posts[j], posts[i]];
    setDraft({ ...draft, posts });
  };
  const save = async () => {
    setSaving(true);
    await fetch('/api/admin/blog/series', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, title: draft.title, description: draft.description, coverUrl: draft.coverUrl, order: draft.posts.map((p, i) => ({ id: p.id, seriesOrder: i })) }),
    });
    setSaving(false);
    onChanged();
  };
  const remove = async () => {
    if (!confirm(`Delete the series “${s.title}”? Its stories stay published, they just leave the series.`)) return;
    await fetch('/api/admin/blog/series', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id }) });
    onChanged();
  };

  return (
    <div className="grid gap-6 rounded-xl border border-[#f2f2f2] bg-white p-5 md:grid-cols-[220px_1fr]">
      <CoverPicker value={draft.coverUrl} onChange={v => setDraft({ ...draft, coverUrl: v })} />
      <div>
        <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} className="w-full text-[18px] font-bold text-[#242424] outline-none" />
        <textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} rows={2} placeholder="Describe this series…" className="mt-1 w-full resize-none text-[14px] text-[#6b6b6b] outline-none" />
        <ol className="mt-3 space-y-1">
          {draft.posts.length === 0 && <li className="text-[13px] text-[#9b9b9b]">No stories yet, add one from a story’s settings.</li>}
          {draft.posts.map((p, i) => (
            <li key={p.id} className="flex items-center gap-2 rounded-md bg-[#fafafa] px-3 py-2 text-[14px]">
              <span className="w-5 text-[#9b9b9b]">{i + 1}.</span>
              <Link href={`/admin/blog/${p.id}`} className="min-w-0 flex-1 truncate text-[#242424] hover:underline">{p.title || 'Untitled'}</Link>
              {p.status !== 'PUBLISHED' && <span className="rounded bg-[#f2f2f2] px-1.5 text-[11px] uppercase text-[#9b9b9b]">{p.status.toLowerCase()}</span>}
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-[#6b6b6b] hover:bg-white disabled:opacity-30" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === draft.posts.length - 1} className="rounded p-1 text-[#6b6b6b] hover:bg-white disabled:opacity-30" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
            </li>
          ))}
        </ol>
        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={save} disabled={!dirty || saving} className="flex items-center gap-2 rounded-full bg-[#242424] px-4 py-1.5 text-[13px] text-white disabled:opacity-30">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save
          </button>
          <a href={`/blog/series/${s.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] text-[#6b6b6b] hover:bg-[#f2f2f2]"><ExternalLink className="h-3.5 w-3.5" /> View</a>
          <button type="button" onClick={remove} className="ml-auto flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] text-[#c94a4a] hover:bg-[#fdf1f1]"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[] | null>(null);
  const [title, setTitle] = useState('');
  const load = () => fetch('/api/admin/blog/series', { cache: 'no-store' }).then(r => r.json()).then(d => setSeries(d.series ?? []));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!title.trim()) return;
    await fetch('/api/admin/blog/series', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) });
    setTitle('');
    load();
  };

  return (
    <AdminShell title="Series">
      <div className="mx-auto max-w-[900px] space-y-4">
        <div className="flex gap-2">
          <input value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()} placeholder="New series title, e.g. “Building a SaaS from scratch”" className="flex-1 rounded-full border border-[#e6e6e6] bg-white px-4 py-2 text-[14px] outline-none focus:border-[#242424]" />
          <button type="button" onClick={create} className="flex items-center gap-1 rounded-full bg-[#1a8917] px-4 py-2 text-[14px] text-white hover:bg-[#156d12]"><Plus className="h-4 w-4" /> Create</button>
        </div>
        {series === null && <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#9b9b9b]" /></div>}
        {series?.length === 0 && <p className="py-16 text-center text-[15px] text-[#6b6b6b]">Series group stories into an ordered collection with previous/next navigation.</p>}
        {series?.map(s => <SeriesCard key={s.id + s.posts.map(p => p.id).join()} s={s} onChanged={load} />)}
      </div>
    </AdminShell>
  );
}
