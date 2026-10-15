'use client';
// /me/stories — the writer's stories (Medium "Your stories")
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, MessageCircle } from 'lucide-react';
import { useSite } from '@/components/site/SiteProviders';
import { ClapIcon } from '@/app/blog/_components/PostList';
import { fmtDate } from '@/lib/blog/strings';

type Row = {
  id: string; slug: string; title: string; subtitle: string; coverUrl: string | null;
  status: 'DRAFT' | 'REVIEW' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
  publishedAt: string | null; updatedAt: string; readingMinutes: number; views: number; claps: number; authorId: string | null;
  _count: { comments: number };
};
type Writer = { isWriter: boolean; scope: string | null; canCreate: boolean; remaining: number | null; expiresAt: string | null };

export default function MyStoriesPage() {
  const { ui, href, locale } = useSite();
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [writer, setWriter] = useState<Writer | null>(null);
  const [tab, setTab] = useState<'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ALL'>('ALL');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/me/posts', { cache: 'no-store' }).then(async r => {
      if (r.status === 403) { router.replace(href('/me/writer')); return; }
      const d = await r.json();
      setRows(d.posts);
      setWriter(d.writer);
    });
  }, [router, href]);

  const create = async () => {
    setCreating(true);
    const res = await fetch('/api/me/posts', { method: 'POST' });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setError(d.error || 'Could not create a story'); setCreating(false); return; }
    router.push(`/write/${d.post.id}`);
  };

  const shown = useMemo(() => (rows ?? []).filter(r => tab === 'ALL' || r.status === tab || (tab === 'PUBLISHED' && r.status === 'SCHEDULED')), [rows, tab]);
  const count = (s: string) => (rows ?? []).filter(r => r.status === s).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[32px] font-bold tracking-[-0.02em] text-[#242424] sm:text-[42px]">{ui('me.stories')}</h1>
        {writer?.canCreate && (
          <button type="button" onClick={create} disabled={creating} className="flex items-center gap-2 rounded-full bg-[#1a8917] px-5 py-2 text-[14px] text-white hover:bg-[#156d12] disabled:opacity-60">
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}{ui('me.stories.new')}
          </button>
        )}
      </div>
      {writer && (
        <p className="mt-3 text-[13px] text-[#6b6b6b]">
          {writer.scope === 'LIMITED' && ui('me.stories.limit', { n: writer.remaining ?? 0 })}
          {writer.scope === 'SPECIFIC' && ui('me.stories.specific')}
          {writer.expiresAt && <>{writer.scope !== 'UNLIMITED' ? ' · ' : ''}{ui('me.stories.expires', { date: fmtDate(writer.expiresAt, locale) })}</>}
        </p>
      )}
      {error && <p className="mt-3 text-[13px] text-[#c94a4a]">{error}</p>}

      <nav className="mt-6 flex gap-6 border-b border-[#f2f2f2] text-[14px]">
        {([['ALL', ui('me.stories.all'), rows?.length ?? 0], ['DRAFT', ui('me.stories.drafts'), count('DRAFT')], ['REVIEW', ui('me.stories.review'), count('REVIEW')], ['PUBLISHED', ui('me.stories.published'), count('PUBLISHED') + count('SCHEDULED')]] as const).map(([k, label, n]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`-mb-px border-b pb-3 ${tab === k ? 'border-[#242424] text-[#242424]' : 'border-transparent text-[#6b6b6b] hover:text-[#242424]'}`}>
            {label} <span className="text-[#9b9b9b]">{n}</span>
          </button>
        ))}
      </nav>

      {rows === null ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#9b9b9b]" /></div>
        : shown.length === 0 ? <p className="py-16 text-center text-[15px] text-[#6b6b6b]">{ui('me.stories.empty')}</p>
        : shown.map(r => (
          <article key={r.id} className="flex gap-5 border-b border-[#f2f2f2] py-6">
            <Link href={`/write/${r.id}`} className="min-w-0 flex-1">
              <h2 className="text-[20px] font-bold leading-6 tracking-[-0.016em] text-[#242424] line-clamp-2">{r.title || <span className="text-[#9b9b9b]">{ui('me.stories.untitled')}</span>}</h2>
              {r.subtitle && <p className="mt-1.5 text-[15px] text-[#6b6b6b] line-clamp-1">{r.subtitle}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-[#9b9b9b]">
                {r.status === 'REVIEW' && <span className="rounded-full bg-[#eef4fb] px-2 py-0.5 text-[#2467ac]">{ui('me.stories.review')}</span>}
                {r.status === 'PUBLISHED' && r.publishedAt ? <span>{fmtDate(r.publishedAt, locale)}</span> : <span>{ui('me.stories.edited', { date: fmtDate(r.updatedAt, locale) })}</span>}
                <span>{r.readingMinutes} min</span>
                {r.status === 'PUBLISHED' && (
                  <>
                    <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {r.views}</span>
                    <span className="flex items-center gap-1"><ClapIcon className="h-3.5 w-3.5" /> {r.claps}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {r._count.comments}</span>
                  </>
                )}
              </div>
            </Link>
            {r.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.coverUrl} alt="" className="hidden h-[90px] w-[134px] shrink-0 object-cover sm:block" />
            )}
          </article>
        ))}
    </div>
  );
}
