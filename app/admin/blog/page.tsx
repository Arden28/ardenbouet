'use client';
// /admin/blog — "Your stories": stats, status tabs, search, story list.
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Eye, MessageCircle, Highlighter, Bookmark, MoreHorizontal, Sparkles, Mail, Loader2, Pencil, ExternalLink, Trash2 } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { ClapIcon } from '@/app/blog/_components/PostList';
import '@/app/blog/story.css';

type Row = {
  id: string; slug: string; title: string; subtitle: string; excerpt: string; coverUrl: string | null;
  status: 'DRAFT' | 'REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
  author: { name: string; handle: string | null; image: string | null } | null;
  publishedAt: string | null; scheduledAt: string | null; updatedAt: string; createdAt: string;
  tags: string[]; featured: boolean; readingMinutes: number; wordCount: number; views: number; claps: number;
  newsletterSentAt: string | null; series: { title: string } | null;
  _count: { comments: number; highlights: number; bookmarks: number };
};

const TABS = [
  { key: 'ALL', label: 'All' },
  { key: 'DRAFT', label: 'Drafts' },
  { key: 'REVIEW', label: 'In review' },
  { key: 'SCHEDULED', label: 'Scheduled' },
  { key: 'PUBLISHED', label: 'Published' },
  { key: 'ARCHIVED', label: 'Archived' },
] as const;

function rel(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function Stat({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#f2f2f2] bg-white p-4">
      <div className="flex items-center gap-2 text-[13px] text-[#6b6b6b]">{icon}{label}</div>
      <p className="mt-2 text-[26px] font-semibold tracking-[-0.02em] text-[#242424]">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  );
}

function RowMenu({ row, onDelete }: { row: Row; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} className="rounded p-1.5 text-[#6b6b6b] hover:bg-[#f2f2f2]" aria-label="Actions"><MoreHorizontal className="h-5 w-5" /></button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-44 rounded-md border border-[#f2f2f2] bg-white py-1 text-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.12)]" onMouseLeave={() => setOpen(false)}>
          <Link href={`/admin/blog/${row.id}`} className="flex items-center gap-2 px-4 py-2 text-[#6b6b6b] hover:text-[#242424]"><Pencil className="h-4 w-4" /> Edit</Link>
          <a href={`/blog/${row.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-[#6b6b6b] hover:text-[#242424]">
            <ExternalLink className="h-4 w-4" /> {row.status === 'PUBLISHED' ? 'View' : 'Preview'}
          </a>
          <Link href={`/admin/blog/comments?postId=${row.id}`} className="flex items-center gap-2 px-4 py-2 text-[#6b6b6b] hover:text-[#242424]"><MessageCircle className="h-4 w-4" /> Responses</Link>
          <button type="button" onClick={() => { setOpen(false); onDelete(); }} className="flex w-full items-center gap-2 px-4 py-2 text-left text-[#c94a4a] hover:bg-[#fdf1f1]"><Trash2 className="h-4 w-4" /> Delete</button>
        </div>
      )}
    </div>
  );
}

export default function StoriesPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('ALL');
  const [q, setQ] = useState('');
  const [subs, setSubs] = useState<number | null>(null);

  const load = () => fetch('/api/admin/blog/posts', { cache: 'no-store' }).then(r => r.json()).then(d => { setRows(d.posts ?? []); setCounts(d.counts ?? {}); });
  useEffect(() => {
    load();
    fetch('/api/admin/blog/subscribers').then(r => r.json()).then(d => setSubs((d.subscribers ?? []).filter((s: { status: string }) => s.status === 'ACTIVE').length)).catch(() => setSubs(0));
  }, []);

  const filtered = useMemo(() => {
    if (!rows) return null;
    const term = q.trim().toLowerCase();
    return rows.filter(r => (tab === 'ALL' || r.status === tab) && (!term || `${r.title} ${r.tags.join(' ')}`.toLowerCase().includes(term)));
  }, [rows, tab, q]);

  const totals = useMemo(() => (rows ?? []).reduce(
    (a, r) => ({ views: a.views + r.views, claps: a.claps + r.claps, responses: a.responses + r._count.comments }),
    { views: 0, claps: 0, responses: 0 },
  ), [rows]);

  const remove = async (row: Row) => {
    if (!confirm(`Delete “${row.title || 'Untitled'}” permanently?`)) return;
    await fetch(`/api/admin/blog/posts/${row.id}`, { method: 'DELETE' });
    load();
  };

  return (
    <AdminShell
      title="Stories"
      actions={<Link href="/admin/blog/new" className="rounded-full bg-[#1a8917] px-4 py-2 text-[14px] text-white hover:bg-[#156d12]">Write a story</Link>}
    >
      <div className="mx-auto max-w-[1100px]">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Published" value={counts.PUBLISHED ?? 0} icon={<Sparkles className="h-4 w-4" />} />
          <Stat label="Views" value={totals.views} icon={<Eye className="h-4 w-4" />} />
          <Stat label="Claps · Responses" value={`${totals.claps.toLocaleString()} · ${totals.responses}`} icon={<ClapIcon className="h-4 w-4" />} />
          <Stat label="Subscribers" value={subs ?? '—'} icon={<Mail className="h-4 w-4" />} />
        </div>

        <div className="mt-8 flex flex-col gap-4 border-b border-[#f2f2f2] sm:flex-row sm:items-end sm:justify-between">
          <nav className="no-scrollbar -mb-px flex gap-6 overflow-x-auto text-[14px]">
            {TABS.map(t => {
              const n = t.key === 'ALL' ? rows?.length ?? 0 : counts[t.key] ?? 0;
              return (
                <button key={t.key} type="button" onClick={() => setTab(t.key)} className={`shrink-0 border-b pb-3 ${tab === t.key ? 'border-[#242424] text-[#242424]' : 'border-transparent text-[#6b6b6b] hover:text-[#242424]'}`}>
                  {t.label} <span className="text-[#9b9b9b]">{n}</span>
                </button>
              );
            })}
          </nav>
          <div className="mb-3 flex items-center gap-2 rounded-full bg-white px-3 py-1.5 ring-1 ring-[#e6e6e6] focus-within:ring-[#242424]">
            <Search className="h-4 w-4 text-[#9b9b9b]" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search stories" className="w-48 bg-transparent text-[14px] outline-none" />
          </div>
        </div>

        <ul className="mt-2">
          {filtered === null && <li className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#9b9b9b]" /></li>}
          {filtered?.length === 0 && (
            <li className="py-20 text-center">
              <p className="text-[15px] text-[#6b6b6b]">{rows?.length ? 'No stories match.' : 'You haven’t written any stories yet.'}</p>
              {!rows?.length && <Link href="/admin/blog/new" className="mt-4 inline-block rounded-full bg-[#242424] px-4 py-2 text-[14px] text-white">Write your first story</Link>}
            </li>
          )}
          {filtered?.map(r => (
            <li key={r.id} className="flex items-start gap-4 border-b border-[#f2f2f2] py-5">
              <Link href={`/admin/blog/${r.id}`} className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-[17px] font-bold tracking-[-0.01em] text-[#242424]">{r.title || <span className="text-[#9b9b9b]">Untitled story</span>}</h2>
                  {r.featured && <Sparkles className="h-4 w-4 shrink-0 fill-[#ffc017] text-[#ffc017]" />}
                </div>
                {(r.subtitle || r.excerpt) && <p className="mt-1 text-[14px] text-[#6b6b6b] line-clamp-1">{r.subtitle || r.excerpt}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#9b9b9b]">
                  {r.status === 'PUBLISHED' && r.publishedAt && <span>Published {rel(r.publishedAt)}</span>}
                  {r.status === 'SCHEDULED' && r.scheduledAt && <span className="text-[#7a5a00]">Scheduled for {new Date(r.scheduledAt).toLocaleString()}</span>}
                  {r.author && <span className="font-medium text-[#6b6b6b]">by {r.author.name}</span>}
                  {r.status === 'DRAFT' && <span>Last edited {rel(r.updatedAt)}</span>}
                  {r.status === 'REVIEW' && <span className="text-[#2467ac]">Waiting for your review · {rel(r.updatedAt)}</span>}
                  {r.status === 'ARCHIVED' && <span>Archived</span>}
                  <span>{r.readingMinutes} min read ({r.wordCount.toLocaleString()} words)</span>
                  {r.series && <span>Series: {r.series.title}</span>}
                  {r.status === 'PUBLISHED' && (
                    <>
                      <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {r.views}</span>
                      <span className="flex items-center gap-1"><ClapIcon className="h-3.5 w-3.5" /> {r.claps}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {r._count.comments}</span>
                      <span className="flex items-center gap-1"><Highlighter className="h-3.5 w-3.5" /> {r._count.highlights}</span>
                      <span className="flex items-center gap-1"><Bookmark className="h-3.5 w-3.5" /> {r._count.bookmarks}</span>
                      {r.newsletterSentAt && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> emailed</span>}
                    </>
                  )}
                </div>
              </Link>
              {r.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.coverUrl} alt="" className="hidden h-[72px] w-[112px] shrink-0 rounded object-cover sm:block" />
              )}
              <RowMenu row={r} onDelete={() => remove(r)} />
            </li>
          ))}
        </ul>
      </div>
    </AdminShell>
  );
}
