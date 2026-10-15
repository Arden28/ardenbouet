// app/blog/series/page.tsx — every series that has published stories
import Link from 'next/link';
import type { Metadata } from 'next';
import { getLocale, lhref, alternates } from '@/lib/i18n/server';
import { blogT, fmtDate } from '@/lib/blog/strings';
import { listSeries } from '@/lib/blog/queries';
import { SeriesCover } from '../_components/SeriesCover';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = blogT(getLocale());
  return { title: `${t('seriesIndexTitle')} · Blog · Arden BOUET`, description: t('seriesIndexSub'), alternates: alternates('/blog/series') };
}

export default async function SeriesIndex() {
  const locale = getLocale();
  const t = blogT(locale);
  const series = await listSeries();

  return (
    <main className="mx-auto max-w-[1100px] px-6 pb-24 pt-12 sm:pt-16">
      <header className="max-w-[640px]">
        <Link href={lhref('/blog')} className="text-[14px] text-[#6b6b6b] hover:text-[#242424]">{t('brand')}</Link>
        <h1 className="mt-3 font-story text-[40px] font-bold leading-[1.1] tracking-[-0.02em] text-[#242424] sm:text-[52px]">{t('seriesIndexTitle')}</h1>
        <p className="mt-3 font-story text-[20px] leading-[1.5] text-[#6b6b6b]">{t('seriesIndexSub')}</p>
      </header>

      {series.length === 0 ? (
        <p className="py-24 text-center text-[16px] text-[#6b6b6b]">{t('seriesNone')}</p>
      ) : (
        <ul className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {series.map(s => (
            <li key={s.id}>
              <Link href={lhref(`/blog/series/${s.slug}`)} className="group block">
                <SeriesCover src={s.coverUrl} title={s.title} count={s.count} badge={s.count === 1 ? t('storyCount') : t('storiesCount', { n: s.count })} className="pt-3" />
                <h2 className="mt-5 text-[20px] font-bold leading-snug tracking-[-0.01em] text-[#242424] group-hover:underline group-hover:decoration-[#c4c4c4] group-hover:underline-offset-4">{s.title}</h2>
                {s.description && <p className="mt-1.5 text-[15px] leading-6 text-[#6b6b6b] line-clamp-2">{s.description}</p>}
                <p className="mt-3 text-[13px] text-[#9b9b9b]">
                  {t('seriesMinutes', { n: s.minutes })} · {t('seriesUpdated', { date: fmtDate(s.updatedAt, locale) })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
