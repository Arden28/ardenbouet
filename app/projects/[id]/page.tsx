// app/projects/[id]/page.tsx — Header provided by layout.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { ContentBundle, Project } from '@/app/admin/types';
import { getLocale, makeT } from '@/lib/serverT';
import ProjectGallery from './ProjectGallery';

export const dynamic = 'force-dynamic';

const TAG_LABELS: Record<string, string> = {
  saas: 'SaaS',
  client: 'Client',
  'open-source': 'Open Source',
  mobile: 'Mobile',
  job: 'Job Role',
};

async function getProject(id: string): Promise<Project | null> {
  try {
    const { prisma } = await import('@/lib/prisma');
    const row = await prisma.content.findUnique({ where: { id: 1 } });
    const bundle = row?.data as ContentBundle | null;
    return bundle?.projects?.find(p => p.id === id) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const project = await getProject(params.id);
  if (!project) return {};
  const cover = project.caseFile?.images?.find(img => !/\.(mp4|webm|ogg|mov)(\?|$)/i.test(img.src));
  return {
    title: `${project.title} · Projects · Arden BOUET`,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      images: [{ url: cover?.src || project.logoUrl }],
    },
  };
}

function Rule({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}

const ordinal = (n: number) => String(n).padStart(2, '0');

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const project = await getProject(params.id);
  if (!project) notFound();

  const t = makeT(getLocale());
  const cf = project.caseFile;
  const hasLiveUrl = Boolean(project.url && project.url.trim() !== '');

  const categories = Array.from(new Set([...(project.tags ?? []), ...((cf?.tags ?? []) as string[])]));
  const stack = Array.from(new Set([...(project.tech ?? []), ...(cf?.tech ?? [])]));
  const images = cf?.images?.filter(img => img?.src) ?? [];

  return (
    <>
      {/* ── DARK HERO ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-zinc-950 text-white">
        <div className="absolute inset-y-0 left-0 w-[3px] bg-[#2467AC]" />

        <div className="mx-auto max-w-6xl px-6 pb-14 pt-10 sm:pt-16">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-zinc-600"
          >
            <Link href="/#projects" className="transition-colors duration-150 hover:text-zinc-300">
              Projects
            </Link>
            <span aria-hidden>·</span>
            <span className="truncate text-zinc-400 max-w-[220px]">{project.title}</span>
          </nav>

          {/* Category badges */}
          {categories.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {categories.map(tag => (
                <span
                  key={tag}
                  className="border border-zinc-700 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-500"
                >
                  {TAG_LABELS[tag] ?? tag.replace('-', ' ')}
                </span>
              ))}
            </div>
          )}

          {/* Metric */}
          {project.metric && (
            <p className="mt-6 font-mono text-xl font-bold text-[#3a8ceb] sm:text-2xl">
              {project.metric}
            </p>
          )}

          {/* Title */}
          <h1 className="mt-3 font-heading text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
            {project.title}
          </h1>

          {/* Description */}
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-zinc-400">
            {project.description}
          </p>

          {/* CTA row */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            {hasLiveUrl && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-[#2467AC] px-6 py-3 font-mono text-[11px] uppercase tracking-widest text-zinc-950 transition-colors duration-150 hover:bg-white"
              >
                {t('projectDetail.visitSite')} ↗
              </a>
            )}
            <a
              href="/#contact"
              className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 transition-colors duration-150 hover:text-zinc-200"
            >
              {t('projectDetail.discuss')} →
            </a>
          </div>
        </div>
      </section>

      {/* ── BODY ──────────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-14 sm:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_320px] lg:gap-16">

          {/* Left: narrative + gallery */}
          <div className="min-w-0">
            {cf ? (
              <>
                {/* 01 — Problem */}
                <section className="mb-10">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="font-mono text-[10px] font-bold text-zinc-400 dark:text-zinc-600">
                      {ordinal(1)}
                    </span>
                    <Rule className="flex-1" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                      {t('projectDetail.brief')}
                    </span>
                  </div>
                  <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {cf.problem}
                  </p>
                </section>

                {/* 02 — Approach */}
                {cf.approach?.length > 0 && (
                  <section className="mb-10">
                    <div className="mb-4 flex items-center gap-3">
                      <span className="font-mono text-[10px] font-bold text-zinc-400 dark:text-zinc-600">
                        {ordinal(2)}
                      </span>
                      <Rule className="flex-1" />
                      <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                        {t('projectDetail.approach')}
                      </span>
                    </div>
                    <ol className="space-y-4">
                      {cf.approach.map((step, i) => (
                        <li key={i} className="flex gap-4">
                          <span className="shrink-0 pt-0.5 font-mono text-xs font-bold text-zinc-400 dark:text-zinc-600">
                            {ordinal(i + 1)}
                          </span>
                          <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                            {step}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                {/* 03 — Result */}
                <section className="mb-12">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="font-mono text-[10px] font-bold text-zinc-400 dark:text-zinc-600">
                      {ordinal(3)}
                    </span>
                    <Rule className="flex-1" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                      {t('projectDetail.result')}
                    </span>
                  </div>
                  <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {cf.result}
                  </p>
                </section>

                {/* Gallery */}
                {images.length > 0 && (
                  <section>
                    <p className="mb-6 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600">
                      {t('projectDetail.gallery')}
                    </p>
                    <ProjectGallery images={images} />
                  </section>
                )}
              </>
            ) : (
              <div className="border border-dashed border-zinc-200 p-8 dark:border-zinc-800">
                <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                  {t('projectDetail.comingSoonTitle')}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {t('projectDetail.comingSoonBody')}
                </p>
              </div>
            )}

            {/* Back link — mobile only */}
            <div className="mt-12 lg:hidden">
              <Link
                href="/#projects"
                className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                {t('projectDetail.back')}
              </Link>
            </div>
          </div>

          {/* Right: sticky quick facts */}
          <div className="self-start space-y-4 lg:sticky lg:top-28">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600">
              {t('projectDetail.quickFacts')}
            </p>
            <div className="divide-y divide-zinc-200 border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {categories.length > 0 && (
                <div className="p-6">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                    {t('projectDetail.category')}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {categories.map(tag => (
                      <span
                        key={tag}
                        className="border border-zinc-200 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-500 dark:border-zinc-700 dark:text-zinc-500"
                      >
                        {TAG_LABELS[tag] ?? tag.replace('-', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {stack.length > 0 && (
                <div className="p-6">
                  <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                    {t('projectDetail.stack')}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {stack.map(tech => (
                      <span
                        key={tech}
                        className="border border-zinc-200 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-500 dark:border-zinc-700 dark:text-zinc-500"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 p-6">
                {hasLiveUrl && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center bg-zinc-900 px-5 py-3 font-mono text-[11px] uppercase tracking-widest text-white transition-colors duration-150 hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {t('projectDetail.visitSite')}
                  </a>
                )}
                <a
                  href="/#contact"
                  className="flex w-full items-center justify-center border border-zinc-200 px-5 py-3 font-mono text-[11px] uppercase tracking-widest text-zinc-600 transition-colors duration-150 hover:border-zinc-900 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-100 dark:hover:text-zinc-100"
                >
                  {t('projectDetail.discuss')}
                </a>
              </div>
            </div>

            {/* Questions */}
            <div className="border border-dashed border-zinc-200 p-4 dark:border-zinc-800">
              <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                {t('projectDetail.questions')}
              </p>
              <a
                href="mailto:laudbouetoumoussa@gmail.com"
                className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                laudbouetoumoussa@gmail.com
              </a>
            </div>

            {/* Back link — desktop */}
            <Link
              href="/#projects"
              className="hidden font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100 lg:block"
            >
              {t('projectDetail.back')}
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
