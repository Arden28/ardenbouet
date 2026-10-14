// app/blog/series/[slug]/page.tsx — an ordered collection of stories
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale } from '@/lib/serverT';
import { blogT } from '@/lib/blog/strings';
import { getPostCardsByIds, getSeries } from '@/lib/blog/queries';
import { FeedRow } from '../../_components/PostList';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const s = await getSeries(params.slug);
  return s ? { title: `${s.title} · Series · Arden BOUET`, description: s.description } : {};
}

export default async function SeriesPage({ params }: { params: { slug: string } }) {
  const series = await getSeries(params.slug);
  if (!series) notFound();
  const locale = getLocale();
  const t = blogT(locale);
  const posts = await getPostCardsByIds(series.posts.map(p => p.id));

  return (
    <main className="mx-auto max-w-[728px] px-6 pt-12">
      {series.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={series.coverUrl} alt="" className="mb-8 aspect-[21/9] w-full rounded-md object-cover" />
      )}
      <p className="text-[13px] font-medium uppercase tracking-[0.08em] text-[#1a8917]">{t('series')}</p>
      <h1 className="mt-2 text-[36px] font-bold leading-[44px] tracking-[-0.02em] text-[#242424]">{series.title}</h1>
      {series.description && <p className="mt-3 font-story text-[20px] leading-[30px] text-[#6b6b6b]">{series.description}</p>}
      <p className="mt-4 text-[14px] text-[#6b6b6b]">{posts.length === 1 ? t('storyCount') : t('storiesCount', { n: posts.length })}</p>

      <ol className="mt-8 border-t border-[#f2f2f2]">
        {posts.map((p, i) => (
          <li key={p.id} className="flex gap-5">
            <span className="pt-8 font-story text-[28px] font-bold text-[#e6e6e6] sm:pt-10">{String(i + 1).padStart(2, '0')}</span>
            <div className="min-w-0 flex-1"><FeedRow post={p} locale={locale} t={t} /></div>
          </li>
        ))}
      </ol>
    </main>
  );
}
