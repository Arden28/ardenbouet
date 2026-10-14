'use client';
// /me/library — reading list, highlights, responses
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { useSite } from '@/components/site/SiteProviders';
import { fmtDate } from '@/lib/blog/strings';

type Card = { id: string; slug: string; title: string; subtitle: string; excerpt: string; coverUrl: string | null; publishedAt: string | null; readingMinutes: number };
type Lib = {
  readingList: Card[];
  highlights: { id: string; quote: string; createdAt: string; post: { slug: string; title: string } }[];
  responses: { id: string; body: string; quote: string | null; createdAt: string; likeCount: number; post: { slug: string; title: string } }[];
};

function Library() {
  const { ui, href, locale, t } = useSite();
  const params = useSearchParams();
  const router = useRouter();
  const tab = (params.get('tab') as 'reading' | 'highlights' | 'responses') || 'reading';
  const [lib, setLib] = useState<Lib | null>(null);
  useEffect(() => { fetch('/api/me/library', { cache: 'no-store' }).then(r => r.json()).then(setLib); }, []);

  const remove = async (kind: 'bookmark' | 'highlight', id: string) => {
    setLib(l => l && (kind === 'bookmark' ? { ...l, readingList: l.readingList.filter(p => p.id !== id) } : { ...l, highlights: l.highlights.filter(h => h.id !== id) }));
    await fetch('/api/me/library', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, id }) });
  };

  const tabs = [
    { key: 'reading', label: ui('me.readingList'), n: lib?.readingList.length },
    { key: 'highlights', label: ui('me.highlights'), n: lib?.highlights.length },
    { key: 'responses', label: ui('me.responses'), n: lib?.responses.length },
  ] as const;

  return (
    <div>
      <h1 className="text-[32px] font-bold tracking-[-0.02em] text-[#242424] sm:text-[42px]">{ui('me.library')}</h1>
      <nav className="mt-6 flex gap-6 border-b border-[#f2f2f2] text-[14px]">
        {tabs.map(tb => (
          <button key={tb.key} type="button" onClick={() => router.replace(`?tab=${tb.key}`)}
            className={`-mb-px border-b pb-3 ${tab === tb.key ? 'border-[#242424] text-[#242424]' : 'border-transparent text-[#6b6b6b] hover:text-[#242424]'}`}>
            {tb.label} {tb.n !== undefined && <span className="text-[#9b9b9b]">{tb.n}</span>}
          </button>
        ))}
      </nav>

      {!lib ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#9b9b9b]" /></div> : (
        <div className="mt-2">
          {tab === 'reading' && (lib.readingList.length === 0
            ? <p className="py-16 text-center text-[15px] text-[#6b6b6b]">{ui('me.empty.readingList')}</p>
            : lib.readingList.map(p => (
              <article key={p.id} className="group flex gap-5 border-b border-[#f2f2f2] py-6">
                <Link href={href(`/blog/${p.slug}`)} className="min-w-0 flex-1">
                  <h2 className="text-[20px] font-bold leading-6 tracking-[-0.016em] text-[#242424] line-clamp-2">{p.title}</h2>
                  {(p.subtitle || p.excerpt) && <p className="mt-1.5 text-[15px] leading-[22px] text-[#6b6b6b] line-clamp-2">{p.subtitle || p.excerpt}</p>}
                  <p className="mt-3 text-[13px] text-[#9b9b9b]">{fmtDate(p.publishedAt, locale)} · {t('minRead', { n: p.readingMinutes })}</p>
                </Link>
                {p.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverUrl} alt="" className="hidden h-[90px] w-[134px] shrink-0 object-cover sm:block" />
                )}
                <button type="button" onClick={() => remove('bookmark', p.id)} title={ui('me.remove')} className="self-start rounded p-1 text-[#c4c4c4] opacity-0 hover:text-[#242424] group-hover:opacity-100"><X className="h-4 w-4" /></button>
              </article>
            )))}

          {tab === 'highlights' && (lib.highlights.length === 0
            ? <p className="py-16 text-center text-[15px] text-[#6b6b6b]">{ui('me.empty.highlights')}</p>
            : lib.highlights.map(h => (
              <article key={h.id} className="group border-b border-[#f2f2f2] py-6">
                <Link href={href(`/blog/${h.post.slug}`)} className="text-[13px] text-[#6b6b6b] hover:text-[#242424]">{h.post.title}</Link>
                <div className="mt-2 flex gap-3">
                  <p className="flex-1 font-story text-[18px] leading-7 text-[#242424]"><mark className="bg-[#def4dd] px-0.5">{h.quote}</mark></p>
                  <button type="button" onClick={() => remove('highlight', h.id)} title={ui('me.remove')} className="self-start rounded p-1 text-[#c4c4c4] opacity-0 hover:text-[#242424] group-hover:opacity-100"><X className="h-4 w-4" /></button>
                </div>
                <p className="mt-2 text-[12px] text-[#9b9b9b]">{fmtDate(h.createdAt, locale)}</p>
              </article>
            )))}

          {tab === 'responses' && (lib.responses.length === 0
            ? <p className="py-16 text-center text-[15px] text-[#6b6b6b]">{ui('me.empty.responses')}</p>
            : lib.responses.map(c => (
              <article key={c.id} className="border-b border-[#f2f2f2] py-6">
                <Link href={href(`/blog/${c.post.slug}#responses`)} className="text-[13px] text-[#6b6b6b] hover:text-[#242424]">{c.post.title}</Link>
                {c.quote && <blockquote className="mt-2 border-l-[3px] border-[#242424] pl-3 font-story text-[15px] italic text-[#6b6b6b] line-clamp-2">{c.quote}</blockquote>}
                <p className="mt-2 whitespace-pre-line text-[15px] leading-6 text-[#242424] line-clamp-4">{c.body}</p>
                <p className="mt-2 text-[12px] text-[#9b9b9b]">{fmtDate(c.createdAt, locale)}{c.likeCount > 0 && ` · ♥ ${c.likeCount}`}</p>
              </article>
            )))}
        </div>
      )}
    </div>
  );
}

export default function LibraryPage() {
  return <Suspense><Library /></Suspense>;
}
