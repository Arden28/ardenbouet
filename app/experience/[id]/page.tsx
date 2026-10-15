// app/experience/[id]/page.tsx — one role in depth: boarding-pass tenure card, career timeline, the story,
// impact, responsibilities, the projects built there (ordered from the projects admin) and a gallery.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, MapPin } from 'lucide-react';
import { getLocale, lhref, alternates } from '@/lib/i18n/server';
import { uiT } from '@/lib/i18n/ui';
import { mdToSafeHtml } from '@/lib/mardown';
import { careerTimeline, formatDuration, formatYm, loadExperience, monthsBetween } from '@/lib/experience';
import { Gallery } from '@/components/gallery/Gallery';
import { BookCallButton } from '@/app/projects/[id]/BookCallButton';

export const dynamic = 'force-dynamic';

const isVideo = (src: string) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(src);
const host = (url: string) => url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const d = await loadExperience(params.id, getLocale());
  if (!d) return {};
  const e = d.experience;
  const title = [e.job, e.title].filter(Boolean).join(' · ');
  return {
    title: `${title} · Experience · Arden BOUET`,
    description: e.logline || e.outcomes?.[0],
    alternates: alternates(`/experience/${e.id}`),
    openGraph: { title, description: e.logline, ...(e.poster ? { images: [{ url: e.poster }] } : {}) },
  };
}

export default async function ExperiencePage({ params }: { params: { id: string } }) {
  const locale = getLocale();
  const d = await loadExperience(params.id, locale);
  if (!d) notFound();
  const ui = uiT(locale);
  const { experience: e, projects, newer, older, all } = d;
  const months = monthsBetween(e.startDate, e.endDate);
  const duration = formatDuration(months, ui);
  const from = formatYm(e.startDate, locale);
  const to = e.startDate ? (e.endDate ? formatYm(e.endDate, locale) : ui('exp.present')) : '';
  const timeline = careerTimeline(all, e.id);
  const gallery = (e.gallery ?? []).filter(g => g.src).map(g => ({ src: g.src, alt: g.alt, caption: g.alt, kind: isVideo(g.src) ? 'video' as const : 'image' as const }));
  const tags = e.tags ?? [];
  const outcomes = e.outcomes ?? [];
  const bullets = e.bullets ?? [];
  const eyebrow = [e.type, e.location].filter(Boolean).join(' · ');

  const fact = (label: string, value: React.ReactNode) => (
    <div className="border-t border-[#ececec] py-4">
      <dt className="text-[12px] font-medium uppercase tracking-[0.1em] text-[#9b9b9b]">{label}</dt>
      <dd className="mt-1.5 text-[15px] leading-6 text-[#242424]">{value}</dd>
    </div>
  );

  return (
    <main className="blog-ui pb-12">
      <div className="mx-auto max-w-[1192px] px-6 pt-8">
        <Link href={lhref('/#experience')} className="inline-flex items-center gap-1.5 text-[14px] text-[#6b6b6b] hover:text-[#242424]"><ArrowLeft className="h-4 w-4" /> {ui('exp.back')}</Link>
      </div>

      {/* ── Hero: words + boarding-pass tenure card ── */}
      <header className="mx-auto grid max-w-[1192px] items-center gap-12 px-6 pt-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-16">
        <div className="min-w-0">
          {eyebrow && <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#1a8917]">{eyebrow}</p>}
          <h1 className="mt-4 font-story text-[42px] font-bold leading-[1.04] tracking-[-0.025em] text-[#242424] sm:text-[60px]">{e.job || e.title}</h1>
          {e.job && (
            <p className="mt-3 text-[22px] text-[#6b6b6b]">
              {e.companyUrl
                ? <a href={e.companyUrl} target="_blank" rel="noopener noreferrer" className="text-[#242424] underline decoration-[#d4d4d4] underline-offset-[6px] hover:decoration-[#242424]">{e.title}</a>
                : <span className="text-[#242424]">{e.title}</span>}
            </p>
          )}
          {e.logline && <p className="mt-6 max-w-[620px] font-story text-[22px] leading-[1.55] text-[#6b6b6b]">{e.logline}</p>}
          <div className="mt-7 flex flex-wrap gap-2">
            {e.fromTo && <span className="rounded-full bg-[#f2f2f2] px-3.5 py-1.5 text-[13px] text-[#242424]">{e.fromTo}</span>}
            {e.place && <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f2f2] px-3.5 py-1.5 text-[13px] text-[#242424]"><MapPin className="h-3.5 w-3.5" /> {e.place}</span>}
            {projects.length > 0 && <span className="rounded-full bg-[#eef7ee] px-3.5 py-1.5 text-[13px] font-medium text-[#1a6b17]">{projects.length === 1 ? ui('exp.projectCount') : ui('exp.projectsCount', { n: projects.length })}</span>}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[440px]" aria-label={ui('exp.facts')}>
          <div className="flex overflow-hidden rounded-[28px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05),0_12px_40px_rgba(0,0,0,0.08)] ring-1 ring-[#ececec]">
            {/* main part */}
            <div className="min-w-0 flex-1 p-6">
              <div className="flex items-center gap-3">
                {e.logoUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={e.logoUrl} alt="" className="h-11 w-11 rounded-xl border border-[#ececec] bg-[#ffffff] object-contain p-1.5" />
                  : <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#242424] font-story text-[20px] font-bold text-white">{(e.title || e.job || '?').slice(0, 1)}</span>}
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-[#242424]">{e.title}</p>
                  <p className="truncate text-[12px] text-[#9b9b9b]">{e.type}{e.location ? ` · ${e.location}` : ''}</p>
                </div>
              </div>
              <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9b9b9b]">{ui('exp.from')}</p>
                  <p className="mt-1 font-story text-[24px] font-bold leading-none tracking-[-0.02em] text-[#242424]">{from || e.fromTo.split(/[–-]/)[0]?.trim() || '·'}</p>
                </div>
                <svg viewBox="0 0 64 16" className="mb-1.5 h-4 w-14 text-[#c4c4c4]" fill="none" aria-hidden>
                  <path d="M1 8h54" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                  <path d="M54 3l7 5-7 5" stroke="#1a8917" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="text-right">
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9b9b9b]">{ui('exp.to')}</p>
                  <p className={`mt-1 font-story text-[24px] font-bold leading-none tracking-[-0.02em] ${e.startDate && !e.endDate ? 'text-[#1a8917]' : 'text-[#242424]'}`}>{to || e.fromTo.split(/[–-]/)[1]?.trim() || ui('exp.now')}</p>
                </div>
              </div>
              {e.place && <p className="mt-6 flex items-center gap-1.5 text-[13px] text-[#6b6b6b]"><MapPin className="h-3.5 w-3.5" /> {e.place}</p>}
            </div>
            {/* perforation + stub */}
            <div className="relative w-px shrink-0 border-l-2 border-dashed border-[#e6e6e6]">
              <span className="absolute -left-[13px] -top-3 h-6 w-6 rounded-full bg-white ring-1 ring-[#ececec]" />
              <span className="absolute -bottom-3 -left-[13px] h-6 w-6 rounded-full bg-white ring-1 ring-[#ececec]" />
            </div>
            <div className="flex w-[120px] shrink-0 flex-col items-center justify-center bg-[#fafafa] px-3 text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9b9b9b]">{ui('exp.duration')}</p>
              <p className="mt-2 font-story text-[26px] font-bold leading-[1.05] tracking-[-0.02em] text-[#242424]">{duration || '·'}</p>
              {projects.length > 0 && <p className="mt-3 text-[12px] text-[#6b6b6b]">{projects.length === 1 ? ui('exp.projectCount') : ui('exp.projectsCount', { n: projects.length })}</p>}
            </div>
          </div>
        </div>
      </header>

      {e.poster && (
        <figure className="mx-auto mt-16 max-w-[1336px] px-0 sm:px-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={e.poster} alt="" className="aspect-[16/7] w-full object-cover sm:rounded-3xl" />
        </figure>
      )}

      {/* ── Career timeline ── */}
      {timeline && timeline.segments.length > 1 && (
        <section className="mx-auto mt-16 max-w-[1192px] px-6" aria-label={ui('exp.career')}>
          <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-[#9b9b9b]">{ui('exp.career')}</p>
          <div className="relative mt-10 h-14">
            <div className="absolute inset-x-0 top-5 h-px bg-[#e6e6e6]" />
            {timeline.segments.map(s => {
              const bar = <span className={`absolute top-[14px] h-3 rounded-full transition-colors ${s.current ? 'bg-[#1a8917]' : 'bg-[#d4d4d4] group-hover:bg-[#9b9b9b]'}`} style={{ left: `${s.left}%`, width: `${s.width}%` }} />;
              return s.current ? (
                <div key={s.id}>
                  {bar}
                  <span className="absolute -top-6 whitespace-nowrap text-[12px] font-semibold text-[#1a6b17]" style={{ left: `${s.left}%` }}>{s.label}</span>
                </div>
              ) : (
                <Link key={s.id} href={lhref(`/experience/${s.id}`)} title={[s.role, s.label].filter(Boolean).join(' · ')} className="group">{bar}</Link>
              );
            })}
            {timeline.ticks.map(t => (
              <span key={t.year} className="absolute top-8 -translate-x-1/2 text-[11px] tabular-nums text-[#9b9b9b]" style={{ left: `${t.left}%` }}>{t.year}</span>
            ))}
          </div>
        </section>
      )}

      {/* ── Story + facts ── */}
      <div className="mx-auto mt-16 grid max-w-[1192px] gap-14 px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-20">
        <article className="min-w-0">
          {e.story && (
            <section>
              <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-[#9b9b9b]">{ui('exp.story')}</h2>
              <div className="story mt-5 [&>*]:!mx-0 [&>*]:!max-w-none [&_:is(h1,h2,h3,h4)>a[href^='#']:first-child]:hidden" dangerouslySetInnerHTML={{ __html: mdToSafeHtml(e.story) }} />
            </section>
          )}

          {outcomes.length > 0 && (
            <section className={e.story ? 'mt-16' : ''}>
              <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-[#9b9b9b]">{ui('exp.impact')}</h2>
              <ol className="mt-6 grid gap-4 sm:grid-cols-2">
                {outcomes.map((o, i) => (
                  <li key={i} className="rounded-2xl border border-[#ececec] p-6">
                    <span className="font-story text-[34px] font-bold leading-none text-[#d4d4d4]">{String(i + 1).padStart(2, '0')}</span>
                    <p className="mt-3 font-story text-[19px] leading-[1.5] text-[#242424]">{o}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {bullets.length > 0 && (
            <section className="mt-16">
              <h2 className="text-[13px] font-medium uppercase tracking-[0.12em] text-[#9b9b9b]">{ui('exp.role')}</h2>
              <ul className="mt-6 space-y-3.5">
                {bullets.map((b, i) => (
                  <li key={i} className="flex gap-3 text-[17px] leading-[1.6] text-[#242424]">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eef7ee]"><Check className="h-3 w-3 text-[#1a8917]" strokeWidth={3} /></span>
                    {b}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>

        <aside>
          <dl className="lg:sticky lg:top-24">
            <p className="pb-3 text-[15px] font-semibold text-[#242424]">{ui('exp.facts')}</p>
            {fact(ui('exp.company'), e.companyUrl
              ? <a href={e.companyUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#1a8917] hover:underline">{e.title} <ArrowUpRight className="h-3.5 w-3.5" /></a>
              : e.title)}
            {e.fromTo && fact(ui('exp.period'), e.fromTo)}
            {duration && fact(ui('exp.duration'), duration)}
            {fact(ui('exp.type'), e.type)}
            {e.location && fact(ui('exp.mode'), e.location)}
            {e.place && fact(ui('exp.place'), e.place)}
            {tags.length > 0 && fact(ui('exp.stack'), <span className="mt-1 flex flex-wrap gap-1.5">{tags.map(x => <span key={x} className="rounded-full bg-[#f2f2f2] px-2.5 py-1 text-[13px]">{x}</span>)}</span>)}
            {e.companyUrl && (
              <a href={e.companyUrl} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-1.5 rounded-full border border-[#242424] px-4 py-2.5 text-[14px] text-[#242424] hover:bg-[#f9f9f9]">
                {ui('exp.visit', { name: host(e.companyUrl) })} <ArrowUpRight className="h-4 w-4" />
              </a>
            )}
          </dl>
        </aside>
      </div>

      {/* ── Projects built during this role ── */}
      {projects.length > 0 && (
        <section className="mx-auto mt-24 max-w-[1192px] px-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#ececec] pb-6">
            <div>
              <h2 className="font-story text-[34px] font-bold leading-tight tracking-[-0.02em] text-[#242424] sm:text-[40px]">{ui('exp.built')}</h2>
              <p className="mt-2 text-[16px] text-[#6b6b6b]">{ui('exp.builtSub')}</p>
            </div>
            <span className="font-story text-[64px] font-bold leading-none text-[#ececec]">{String(projects.length).padStart(2, '0')}</span>
          </div>
          <ol>
            {projects.map((p, i) => {
              const cover = p.caseFile?.images?.find(img => !isVideo(img.src))?.src;
              const tech = Array.from(new Set([...(p.tech ?? []), ...(p.caseFile?.tech ?? [])])).slice(0, 5);
              return (
                <li key={p.id} className="border-b border-[#ececec]">
                  <Link href={lhref(`/projects/${p.id}`)} className="group grid items-center gap-6 py-8 sm:grid-cols-[64px_minmax(0,1fr)_260px] sm:gap-8">
                    <span className="font-story text-[40px] font-bold leading-none text-[#d4d4d4] transition-colors group-hover:text-[#1a8917]">{String(i + 1).padStart(2, '0')}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        {p.logoUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.logoUrl} alt="" className="h-8 w-8 rounded-lg border border-[#ececec] bg-[#ffffff] object-contain p-1" />
                        )}
                        <h3 className="text-[22px] font-bold leading-snug tracking-[-0.01em] text-[#242424] group-hover:underline group-hover:decoration-[#c4c4c4] group-hover:underline-offset-4">{p.title}</h3>
                      </div>
                      <p className="mt-2 max-w-[620px] text-[16px] leading-[1.6] text-[#6b6b6b]">{p.description}</p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {p.metric && <span className="rounded-full bg-[#eef7ee] px-3 py-1 text-[13px] font-medium text-[#1a6b17]">{p.metric}</span>}
                        {tech.map(x => <span key={x} className="rounded-full bg-[#f2f2f2] px-2.5 py-1 text-[12px] text-[#6b6b6b]">{x}</span>)}
                      </div>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#242424]">{ui('exp.viewCase')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                    </div>
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt="" loading="lazy" className="hidden aspect-[4/3] w-full rounded-2xl object-cover transition-transform duration-500 group-hover:scale-[1.02] sm:block" />
                    ) : <span className="hidden aspect-[4/3] rounded-2xl bg-[#f6f6f6] sm:block" />}
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="mx-auto mt-24 max-w-[1192px] px-6">
          <h2 className="mb-6 text-[13px] font-medium uppercase tracking-[0.12em] text-[#9b9b9b]">{ui('exp.gallery')}</h2>
          <Gallery items={gallery} />
        </section>
      )}

      <section className="mx-auto mt-24 max-w-[1192px] px-6">
        <div className="flex flex-col items-start gap-6 rounded-3xl bg-[#242424] px-8 py-12 text-white sm:flex-row sm:items-center sm:justify-between sm:px-12">
          <div>
            <p className="font-story text-[32px] leading-tight">{ui('exp.ctaTitle')}</p>
            <p className="mt-2 text-[15px] text-white/70">{ui('exp.ctaSub')}</p>
          </div>
          <BookCallButton />
        </div>
      </section>

      {(older || newer) && (
        <nav className="mx-auto mt-16 grid max-w-[1192px] gap-4 px-6 sm:grid-cols-2" aria-label="Experience">
          {older ? (
            <Link href={lhref(`/experience/${older.id}`)} className="group rounded-2xl border border-[#ececec] p-6 transition-colors hover:border-[#242424]">
              <span className="flex items-center gap-1.5 text-[13px] text-[#6b6b6b]"><ArrowLeft className="h-4 w-4" /> {ui('exp.prev')}</span>
              <span className="mt-2 block text-[20px] font-bold tracking-[-0.01em] text-[#242424]">{older.job || older.title}</span>
              <span className="text-[14px] text-[#6b6b6b]">{older.job ? older.title : ''}{older.fromTo ? ` · ${older.fromTo}` : ''}</span>
            </Link>
          ) : <span />}
          {newer && (
            <Link href={lhref(`/experience/${newer.id}`)} className="group rounded-2xl border border-[#ececec] p-6 text-right transition-colors hover:border-[#242424]">
              <span className="flex items-center justify-end gap-1.5 text-[13px] text-[#6b6b6b]">{ui('exp.next')} <ArrowRight className="h-4 w-4" /></span>
              <span className="mt-2 block text-[20px] font-bold tracking-[-0.01em] text-[#242424]">{newer.job || newer.title}</span>
              <span className="text-[14px] text-[#6b6b6b]">{newer.job ? newer.title : ''}{newer.fromTo ? ` · ${newer.fromTo}` : ''}</span>
            </Link>
          )}
        </nav>
      )}
    </main>
  );
}
