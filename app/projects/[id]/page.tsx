// app/projects/[id]/page.tsx — project case study in the story layout
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { Experience, Project } from '@/app/admin/types';
import { uiT } from '@/lib/i18n/ui';
import { getContentBundle } from '@/lib/blog/queries';
import { getLocale, lhref, alternates, getT } from '@/lib/i18n/server';
import { makeT } from '@/lib/serverT';
import { localize } from '@/lib/i18n/content';
import { Gallery } from '@/components/gallery/Gallery';
import { BookCallButton } from './BookCallButton';

export const dynamic = 'force-dynamic';

const isVideo = (src: string) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src);

async function load(id: string) {
  const bundle = await getContentBundle();
  const list = bundle.projects ?? [];
  const idx = list.findIndex(p => p.id === id);
  if (idx < 0) return null;
  const locale = getLocale();
  const exp = (bundle.experiences ?? []).find(e => e.id === list[idx].experienceId);
  return {
    experience: exp ? (localize(exp, locale) as Experience) : null,
    project: localize(list[idx], locale) as Project,
    prev: idx > 0 ? (localize(list[idx - 1], locale) as Project) : null,
    next: idx < list.length - 1 ? (localize(list[idx + 1], locale) as Project) : null,
  };
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const r = await load(params.id);
  if (!r) return {};
  const cover = r.project.caseFile?.images?.find(i => !isVideo(i.src))?.src;
  return {
    title: `${r.project.title} · Projects · Arden BOUET`,
    description: r.project.description,
    alternates: alternates(`/projects/${r.project.id}`),
    openGraph: { title: r.project.title, description: r.project.description, images: [{ url: cover || r.project.logoUrl }] },
  };
}

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const r = await load(params.id);
  if (!r) notFound();
  const { project: p, prev, next, experience } = r;
  const locale = getLocale();
  const t = makeT(locale);
  const it = getT(locale);
  const cf = p.caseFile;
  const images = cf?.images ?? [];
  const cover = images.find(i => !isVideo(i.src));
  const gallery = images.filter(i => i !== cover).map(i => ({ src: i.src, alt: i.alt, caption: i.alt }));
  const tech = Array.from(new Set([...(p.tech ?? []), ...(cf?.tech ?? [])]));
  const TAGS: Record<string, string> = { saas: 'SaaS', client: it('projects.filters.client'), 'open-source': it('projects.filters.openSource'), mobile: it('projects.filters.mobile'), job: it('projects.filters.job') };
  const fact = (label: string, value: React.ReactNode) => (
    <div className="border-t border-[#ececec] py-4">
      <dt className="text-[12px] font-medium uppercase tracking-[0.1em] text-[#9b9b9b]">{label}</dt>
      <dd className="mt-1.5 text-[15px] leading-6 text-[#242424]">{value}</dd>
    </div>
  );

  return (
    <main className="blog-ui pb-12">
      <div className="mx-auto max-w-[1192px] px-6 pt-8">
        <Link href={lhref('/#work')} className="inline-flex items-center gap-1.5 text-[14px] text-[#6b6b6b] hover:text-[#242424]"><ArrowLeft className="h-4 w-4" /> {t('projectDetail.back').replace(/^←\s*/, '')}</Link>
      </div>

      {/* Header */}
      <header className="mx-auto max-w-[1192px] px-6 pt-10">
        <div className="flex items-center gap-3">
          {p.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.logoUrl} alt="" className="h-10 w-10 rounded-xl border border-[#ececec] bg-white object-contain p-1.5" />
          )}
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#9b9b9b]">{(p.tags ?? []).map(tg => TAGS[tg]).filter(Boolean).join(' · ')}</p>
        </div>
        <h1 className="mt-6 max-w-[900px] font-story text-[44px] leading-[1.05] tracking-[-0.025em] text-[#242424] sm:text-[64px]">{p.title}</h1>
        <p className="mt-5 max-w-[760px] font-story text-[22px] leading-[1.5] text-[#6b6b6b]">{p.description}</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          {p.metric && <span className="rounded-full bg-[#eef7ee] px-4 py-2 text-[14px] font-medium text-[#1a6b17]">{p.metric}</span>}
          {p.url && (
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-full bg-[#242424] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-black">
              {t('projectDetail.visitSite')} <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </header>

      {cover && (
        <figure className="mx-auto mt-14 max-w-[1336px] px-0 sm:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover.src} alt={cover.alt} className="aspect-[16/8] w-full object-cover sm:rounded-3xl" />
          {cover.alt && <figcaption className="mt-3 text-center text-[14px] text-[#6b6b6b]">{cover.alt}</figcaption>}
        </figure>
      )}

      <div className="mx-auto mt-16 grid max-w-[1192px] gap-14 px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-20">
        <article className="min-w-0">
          {cf ? (
            <>
              <section>
                <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-[#9b9b9b]">{t('projectDetail.brief')}</h2>
                <p className="mt-5 font-story text-[22px] leading-[1.65] text-[#242424] first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:font-bold first-letter:leading-[0.85] first-letter:text-[66px]">{cf.problem}</p>
              </section>

              {cf.approach?.length > 0 && (
                <section className="mt-16">
                  <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-[#9b9b9b]">{t('projectDetail.approach')}</h2>
                  <ol className="mt-6 space-y-7">
                    {cf.approach.map((step, i) => (
                      <li key={i} className="grid grid-cols-[56px_minmax(0,1fr)] gap-4">
                        <span className="font-story text-[40px] leading-none text-[#d4d4d4]">{String(i + 1).padStart(2, '0')}</span>
                        <p className="pt-1 font-story text-[20px] leading-[1.6] text-[#242424]">{step}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {cf.result && (
                <section className="mt-16">
                  <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-[#9b9b9b]">{t('projectDetail.result')}</h2>
                  <blockquote className="mt-6 border-l-[3px] border-[#1a8917] pl-6 font-story text-[28px] italic leading-[1.45] text-[#242424] sm:text-[32px]">{cf.result}</blockquote>
                </section>
              )}
            </>
          ) : (
            <section className="rounded-3xl bg-[#fafafa] p-10">
              <h2 className="font-story text-[28px] text-[#242424]">{t('projectDetail.comingSoonTitle')}</h2>
              <p className="mt-3 max-w-[520px] text-[16px] leading-[26px] text-[#6b6b6b]">{t('projectDetail.comingSoonBody')}</p>
            </section>
          )}
        </article>

        <aside>
          <dl className="lg:sticky lg:top-24">
            <p className="pb-3 text-[15px] font-semibold text-[#242424]">{t('projectDetail.quickFacts')}</p>
            {experience && fact(uiT(locale)('exp.builtDuring'), (
              <Link href={lhref(`/experience/${experience.id}`)} className="group inline-flex items-center gap-2 text-[#242424]">
                {experience.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={experience.logoUrl} alt="" className="h-6 w-6 rounded-md border border-[#ececec] bg-[#ffffff] object-contain p-0.5" />
                )}
                <span className="group-hover:underline">{[experience.job, experience.title].filter(Boolean).join(' · ')}</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#9b9b9b]" />
              </Link>
            ))}
            {(p.tags ?? []).length > 0 && fact(t('projectDetail.category'), (p.tags ?? []).map(tg => TAGS[tg]).filter(Boolean).join(', '))}
            {tech.length > 0 && fact(t('projectDetail.stack'), (
              <span className="mt-1 flex flex-wrap gap-1.5">{tech.map(x => <span key={x} className="rounded-full bg-[#f2f2f2] px-2.5 py-1 text-[13px]">{x}</span>)}</span>
            ))}
            {p.metric && fact('Impact', p.metric)}
            {p.url && fact('Live', <a href={p.url} target="_blank" rel="noopener noreferrer" className="break-all text-[#1a8917] underline underline-offset-4">{p.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>)}
          </dl>
        </aside>
      </div>

      {gallery.length > 0 && (
        <section className="mx-auto mt-20 max-w-[1192px] px-6">
          <h2 className="mb-6 text-[13px] font-medium uppercase tracking-[0.12em] text-[#9b9b9b]">{t('projectDetail.gallery')}</h2>
          <Gallery items={gallery} />
        </section>
      )}

      <section className="mx-auto mt-24 max-w-[1192px] px-6">
        <div className="flex flex-col items-start gap-6 rounded-3xl bg-[#242424] px-8 py-12 text-white sm:flex-row sm:items-center sm:justify-between sm:px-12">
          <div>
            <p className="font-story text-[32px] leading-tight">{t('projectDetail.questions')}</p>
            <p className="mt-2 text-[15px] text-white/70">{t('projectDetail.discuss')}</p>
          </div>
          <BookCallButton />
        </div>
      </section>

      {(prev || next) && (
        <nav className="mx-auto mt-16 grid max-w-[1192px] gap-4 px-6 sm:grid-cols-2" aria-label="Projects">
          {prev ? (
            <Link href={lhref(`/projects/${prev.id}`)} className="group rounded-2xl border border-[#ececec] p-6 transition-colors hover:border-[#242424]">
              <span className="flex items-center gap-1.5 text-[13px] text-[#6b6b6b]"><ArrowLeft className="h-4 w-4" /> Previous</span>
              <span className="mt-2 block text-[20px] font-bold tracking-[-0.01em] text-[#242424]">{prev.title}</span>
            </Link>
          ) : <span />}
          {next && (
            <Link href={lhref(`/projects/${next.id}`)} className="group rounded-2xl border border-[#ececec] p-6 text-right transition-colors hover:border-[#242424]">
              <span className="flex items-center justify-end gap-1.5 text-[13px] text-[#6b6b6b]">Next <ArrowRight className="h-4 w-4" /></span>
              <span className="mt-2 block text-[20px] font-bold tracking-[-0.01em] text-[#242424]">{next.title}</span>
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
