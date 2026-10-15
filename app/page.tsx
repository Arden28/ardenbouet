// app/page.tsx — home: presentation, selected work, experience, writing, contact.
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { getContentBundle, listPosts } from '@/lib/blog/queries';
import { getLocale, getT, lhref, alternates } from '@/lib/i18n/server';
import { localize, forLocale } from '@/lib/i18n/content';
import { blogT } from '@/lib/blog/strings';
import { uiT } from '@/lib/i18n/ui';
import { Hero } from '@/components/home/Hero';
import { Work, type WorkItem } from '@/components/home/Work';
import { Experience, type ExpItem } from '@/components/home/Experience';
import { projectCounts } from '@/lib/experience';
import { Contact } from '@/components/home/Contact';
import { GridCard } from './blog/_components/PostList';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const ui = uiT(getLocale());
  return {
    title: 'Arden BOUET · Software Engineer',
    description: `${ui('home.headline')} ${ui('home.headlineSub')}`,
    alternates: alternates('/'),
  };
}

const isVideo = (src: string) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src);

export default async function Home() {
  const locale = getLocale();
  const t = getT(locale);
  const ui = uiT(locale);
  const [bundle, posts] = await Promise.all([getContentBundle(), listPosts({ take: 3 })]);

  const focus = [0, 1, 2, 3].map(i => t(`hero.specialism${i}`)).filter(s => !s.startsWith('hero.'));
  const tagLabels: Record<string, string> = {
    saas: 'SaaS', client: t('projects.filters.client'), 'open-source': t('projects.filters.openSource'),
    mobile: t('projects.filters.mobile'), job: t('projects.filters.job'),
  };

  const work: WorkItem[] = forLocale(bundle.projects ?? [], locale).map(raw => {
    const p = localize(raw, locale);
    return {
      id: p.id, title: p.title, description: p.description, logoUrl: p.logoUrl, url: p.url, tags: p.tags ?? [], tech: p.tech ?? [],
      metric: p.metric, cover: p.caseFile?.images?.find(i => !isVideo(i.src))?.src, hasCase: !!p.caseFile,
    };
  });
  const counts = projectCounts(bundle.projects ?? []);
  const experience: ExpItem[] = forLocale(bundle.experiences ?? [], locale).map(raw => {
    const e = localize(raw, locale);
    return {
      id: e.id, title: e.title, job: e.job, fromTo: e.fromTo, type: e.type, location: e.location, logline: e.logline,
      outcomes: e.outcomes?.length ? e.outcomes : e.bullets ?? [], tags: e.tags ?? [],
      logoUrl: e.logoUrl, projects: counts[e.id] ?? 0,
    };
  });

  return (
    <main>
      <Hero focus={focus} />
      <Work items={work} tagLabels={tagLabels} />
      <Experience items={experience} />

      {posts.length > 0 && (
        <section aria-labelledby="writing-title" className="border-t border-[#f2f2f2]">
          <div className="mx-auto max-w-[1192px] px-6 py-16 lg:py-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 id="writing-title" className="font-story text-[40px] leading-[1.1] tracking-[-0.02em] text-[#242424] sm:text-[48px]">{ui('home.writing.title')}</h2>
                <p className="mt-3 text-[16px] text-[#6b6b6b]">{ui('home.writing.sub')}</p>
              </div>
              <Link href={lhref('/blog')} className="flex items-center gap-2 text-[15px] font-medium text-[#242424] underline decoration-[#d4d4d4] underline-offset-4 hover:decoration-[#242424]">
                {ui('home.writing.all')} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-12 grid gap-x-8 gap-y-12 md:grid-cols-3">
              {posts.map(p => <GridCard key={p.id} post={p} locale={locale} t={blogT(locale)} />)}
            </div>
          </div>
        </section>
      )}

      <Contact email={bundle.settings?.contactEmail} />
    </main>
  );
}
