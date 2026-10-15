// app/blog/series/[slug]/page.tsx — one series: hero with cover + "start reading", then the parts in order on a timeline.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getLocale, lhref, alternates } from '@/lib/i18n/server';
import { blogT, fmtDate } from '@/lib/blog/strings';
import { getSeries } from '@/lib/blog/queries';
import { SeriesCover } from '../../_components/SeriesCover';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const s = await getSeries(params.slug);
  if (!s) return {};
  return {
    title: `${s.title} · ${blogT(getLocale())('series')} · Arden BOUET`,
    description: s.description || undefined,
    alternates: alternates(`/blog/series/${s.slug}`),
    openGraph: { title: s.title, description: s.description || undefined, ...(s.coverUrl ? { images: [{ url: s.coverUrl }] } : {}) },
  };
}

export default async function SeriesPage({ params }: { params: { slug: string } }) {
  const series = await getSeries(params.slug);
  if (!series || series.posts.length === 0) notFound();
  const locale = getLocale();
  const t = blogT(locale);
  const { posts } = series;
  const count = posts.length === 1 ? t('storyCount') : t('storiesCount', { n: posts.length });

  return (
    <main className="pb-24">
      <section className="border-b border-[#f2f2f2] bg-[#fafafa]">
        <div className="mx-auto grid max-w-[1100px] items-center gap-10 px-6 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
          <div>
            <Link href={lhref('/blog/series')} className="inline-flex items-center gap-1.5 text-[14px] text-[#6b6b6b] hover:text-[#242424]">
              <ArrowLeft className="h-4 w-4" /> {t('seriesAll')}
            </Link>
            <p className="mt-6 text-[13px] font-medium uppercase tracking-[0.12em] text-[#1a8917]">{t('series')}</p>
            <h1 className="mt-2 font-story text-[38px] font-bold leading-[1.1] tracking-[-0.02em] text-[#242424] sm:text-[50px]">{series.title}</h1>
            {series.description && <p className="mt-4 max-w-[560px] font-story text-[20px] leading-[1.55] text-[#6b6b6b]">{series.description}</p>}
            <p className="mt-6 flex flex-wrap gap-x-3 gap-y-1 text-[14px] text-[#6b6b6b]">
              <span className="font-medium text-[#242424]">{count}</span>
              <span>·</span><span>{t('seriesMinutes', { n: series.minutes })}</span>
              <span>·</span><span>{t('seriesUpdated', { date: fmtDate(series.updatedAt, locale) })}</span>
            </p>
            <Link href={lhref(`/blog/${posts[0].slug}`)} className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#1a8917] px-6 py-3 text-[15px] font-medium text-white transition-colors hover:bg-[#156d12]">
              {t('startReading')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <SeriesCover src={series.coverUrl} title={series.title} count={posts.length} className="pt-3" />
        </div>
      </section>

      <ol className="relative mx-auto mt-12 max-w-[760px] px-6">
        {/* the reading line */}
        <span aria-hidden className="absolute bottom-10 left-[43px] top-6 w-px bg-[#e6e6e6] sm:left-[47px]" />
        {posts.map((p, i) => (
          <li key={p.id} className="relative flex gap-5 pb-10 sm:gap-7">
            <span className="relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e6e6e6] bg-white font-story text-[17px] font-bold text-[#242424] sm:h-12 sm:w-12 sm:text-[19px]">
              {i + 1}
            </span>
            <Link href={lhref(`/blog/${p.slug}`)} className="group flex min-w-0 flex-1 gap-5 rounded-2xl p-1 pt-1.5">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-[#9b9b9b]">{t('partN', { n: i + 1 })}</p>
                <h2 className="mt-1 text-[20px] font-bold leading-snug tracking-[-0.01em] text-[#242424] group-hover:underline group-hover:decoration-[#c4c4c4] group-hover:underline-offset-4 sm:text-[22px]">{p.title}</h2>
                {(p.subtitle || p.excerpt) && <p className="mt-1.5 text-[15px] leading-6 text-[#6b6b6b] line-clamp-2">{p.subtitle || p.excerpt}</p>}
                <p className="mt-2.5 text-[13px] text-[#9b9b9b]">
                  {t('minRead', { n: p.readingMinutes })}{p.publishedAt && <> · {fmtDate(p.publishedAt, locale)}</>}
                </p>
              </div>
              {p.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.coverUrl} alt="" loading="lazy" className="hidden h-[84px] w-[128px] shrink-0 rounded-lg object-cover sm:block" />
              )}
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
