// app/blog/tag/[tag]/page.tsx — Medium-style topic page
import Link from 'next/link';
import type { Metadata } from 'next';
import { getLocale } from '@/lib/serverT';
import { blogT } from '@/lib/blog/strings';
import { countVisible, getTopTags, listPosts } from '@/lib/blog/queries';
import { GridCard, TopicPills } from '../../_components/PostList';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { tag: string } }): Metadata {
  const tag = decodeURIComponent(params.tag);
  return { title: `${tag} · Blog · Arden BOUET`, description: `Stories about ${tag} by Arden BOUET.` };
}

export default async function TagPage({ params, searchParams }: { params: { tag: string }; searchParams: { page?: string } }) {
  const tag = decodeURIComponent(params.tag);
  const locale = getLocale();
  const t = blogT(locale);
  const page = Math.max(1, Number(searchParams.page) || 1);
  const PAGE = 12;
  const [posts, count, tags] = await Promise.all([
    listPosts({ tag, take: PAGE + 1, skip: (page - 1) * PAGE }),
    countVisible(tag),
    getTopTags(12),
  ]);
  const hasMore = posts.length > PAGE;

  return (
    <main className="mx-auto max-w-[1192px] px-6 pt-12">
      <div className="no-scrollbar mx-auto max-w-[900px] overflow-x-auto pb-2">
        <TopicPills tags={tags.filter(x => x.tag !== tag).slice(0, 8)} />
      </div>

      <header className="mx-auto mt-14 max-w-[900px] text-center">
        <h1 className="text-[36px] font-bold capitalize leading-[44px] tracking-[-0.02em] text-[#242424] sm:text-[48px] sm:leading-[60px]">{tag}</h1>
        <p className="mt-3 text-[16px] text-[#6b6b6b]">
          {t('tagged')} · {count === 1 ? t('storyCount') : t('storiesCount', { n: count })}
        </p>
      </header>

      <div className="mx-auto mt-14 grid max-w-[1000px] gap-x-8 gap-y-12 border-t border-[#f2f2f2] pt-12 sm:grid-cols-2">
        {posts.slice(0, PAGE).map(p => <GridCard key={p.id} post={p} locale={locale} t={t} />)}
      </div>
      {posts.length === 0 && <p className="py-20 text-center text-[#6b6b6b]">{t('noStories')}</p>}

      {(hasMore || page > 1) && (
        <div className="mx-auto mt-12 flex max-w-[1000px] justify-between text-[14px]">
          {page > 1 ? <Link href={`?page=${page - 1}`} className="rounded-full border border-[#242424] px-4 py-2">← {t('previous')}</Link> : <span />}
          {hasMore && <Link href={`?page=${page + 1}`} className="rounded-full border border-[#242424] px-4 py-2">{t('next')} →</Link>}
        </div>
      )}
    </main>
  );
}
