// app/blog/page.tsx — Medium-style home: tabbed feed + sidebar (featured, topics, newsletter)
import Link from 'next/link';
import type { Metadata } from 'next';
import { getLocale } from '@/lib/serverT';
import { blogT } from '@/lib/blog/strings';
import { countVisible, getFeatured, getTopTags, listPosts } from '@/lib/blog/queries';
import { CompactRow, FeedRow, TopicPills } from './_components/PostList';
import { SubscribeForm } from './_components/SubscribeForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog · Arden BOUET',
  description: 'Stories on software engineering, SaaS, product building and the craft of shipping production systems.',
  alternates: { types: { 'application/rss+xml': '/blog/rss.xml' } },
};

const PAGE = 12;

export default async function BlogHome({ searchParams }: { searchParams: { tab?: string; q?: string; page?: string } }) {
  const locale = getLocale();
  const t = blogT(locale);
  const q = searchParams.q?.trim() || '';
  const tab = searchParams.tab === 'popular' ? 'popular' : 'latest';
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [posts, featured, tags, total] = await Promise.all([
    listPosts({ q, sort: tab, take: PAGE + 1, skip: (page - 1) * PAGE }),
    getFeatured(3),
    getTopTags(9),
    countVisible(),
  ]);
  const hasMore = posts.length > PAGE;
  const shown = posts.slice(0, PAGE);

  const tabHref = (tb: string) => `/blog${tb === 'latest' ? '' : `?tab=${tb}`}`;
  const pageHref = (p: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (tab !== 'latest') sp.set('tab', tab);
    if (p > 1) sp.set('page', String(p));
    const s = sp.toString();
    return `/blog${s ? `?${s}` : ''}`;
  };

  return (
    <div className="mx-auto flex max-w-[1192px] justify-between gap-12 px-6">
      {/* ── Feed ─────────────────────────────────────────────────────────── */}
      <main className="min-w-0 max-w-[728px] flex-1 pt-6 sm:pt-10">
        {q ? (
          <h1 className="pb-6 text-[28px] font-bold leading-9 tracking-[-0.02em] text-[#6b6b6b] sm:text-[42px] sm:leading-[52px]">
            {t('searchResults')} <span className="text-[#242424]">{q}</span>
          </h1>
        ) : (
          <nav className="no-scrollbar sticky top-[57px] z-10 -mx-1 flex gap-8 overflow-x-auto border-b border-[#f2f2f2] bg-white px-1 text-[14px]" aria-label="Feed">
            {(['latest', 'popular'] as const).map(tb => (
              <Link
                key={tb}
                href={tabHref(tb)}
                className={`shrink-0 border-b py-4 ${tab === tb ? 'border-[#242424] text-[#242424]' : 'border-transparent text-[#6b6b6b] hover:text-[#242424]'}`}
              >
                {t(tb)}
              </Link>
            ))}
            {tags.slice(0, 6).map(({ tag }) => (
              <Link key={tag} href={`/blog/tag/${encodeURIComponent(tag)}`} className="shrink-0 border-b border-transparent py-4 capitalize text-[#6b6b6b] hover:text-[#242424]">
                {tag}
              </Link>
            ))}
          </nav>
        )}

        {shown.length === 0 && (
          <p className="py-24 text-center text-[16px] text-[#6b6b6b]">{q ? t('noResults') : t('noStories')}</p>
        )}

        <div>
          {shown.map((p, i) => <FeedRow key={p.id} post={p} locale={locale} t={t} priority={i < 3} />)}
        </div>

        {(hasMore || page > 1) && (
          <div className="flex items-center justify-between py-10 text-[14px]">
            {page > 1 ? <Link href={pageHref(page - 1)} className="rounded-full border border-[#242424] px-4 py-2 hover:bg-[#f9f9f9]">← {t('previous')}</Link> : <span />}
            {hasMore && <Link href={pageHref(page + 1)} className="rounded-full border border-[#242424] px-4 py-2 hover:bg-[#f9f9f9]">{t('next')} →</Link>}
          </div>
        )}
      </main>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="hidden w-[328px] shrink-0 border-l border-[#f2f2f2] pl-10 lg:block">
        <div className="sticky top-[57px] space-y-10 pb-10 pt-10">
          <section className="rounded-md bg-[#f6f6f6] p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/me.png" alt="" className="h-16 w-16 rounded-full object-cover" />
            <h2 className="mt-4 text-[16px] font-bold text-[#242424]">Arden BOUET</h2>
            <p className="text-[13px] text-[#6b6b6b]">{total === 1 ? t('storyCount') : t('storiesCount', { n: total })}</p>
            <p className="mt-3 text-[14px] leading-5 text-[#6b6b6b]">{t('aboutAuthor')}</p>
          </section>

          {featured.length > 0 && (
            <section>
              <h2 className="text-[16px] font-bold text-[#242424]">{t('staffPicks')}</h2>
              <ul className="mt-3">{featured.map(p => <CompactRow key={p.id} post={p} locale={locale} />)}</ul>
            </section>
          )}

          {tags.length > 0 && (
            <section>
              <h2 className="mb-4 text-[16px] font-bold text-[#242424]">{t('topics')}</h2>
              <TopicPills tags={tags} />
            </section>
          )}

          <section>
            <h2 className="text-[16px] font-bold text-[#242424]">{t('subscribeTitle')}</h2>
            <p className="mb-4 mt-1 text-[14px] leading-5 text-[#6b6b6b]">{t('subscribeBody')}</p>
            <SubscribeForm source="blog-sidebar" variant="stacked" />
          </section>
        </div>
      </aside>
    </div>
  );
}
