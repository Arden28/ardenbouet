// app/blog/[slug]/page.tsx — a story, Medium-style.
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getLocale, lhref } from '@/lib/i18n/server';
import { isAdminRequest } from '@/lib/apiUtil';
import { SITE_URL } from '@/lib/mailer';
import { mdToSafeHtml } from '@/lib/mardown';
import { blogT, fmtDate } from '@/lib/blog/strings';
import { collectHeadings, isDoc, type PMNode } from '@/lib/blog/doc';
import { StoryBody } from '@/lib/blog/render';
import { effectiveDate, getPostBySlug, getRelated, resolveEmbedsForDoc } from '@/lib/blog/queries';
import { GridCard } from '../_components/PostList';
import { SubscribeForm } from '../_components/SubscribeForm';
import { HighlightLayer, StoryActionBar, StoryProvider, TocRail } from './StoryClient';
import { Responses } from './Responses';
import { DonateCard } from './Donate';

export const dynamic = 'force-dynamic';

async function load(slug: string) {
  const isAdmin = await isAdminRequest();
  const post = await getPostBySlug(decodeURIComponent(slug), { includeDrafts: isAdmin });
  return { post, isAdmin };
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { post } = await load(params.slug);
  if (!post) return {};
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.subtitle || post.excerpt;
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: `${title} · ${post.author?.name ?? 'Arden BOUET'}`,
    description,
    alternates: { canonical: post.canonicalUrl || url },
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author?.name ?? 'Arden BOUET'],
      tags: post.tags,
      ...(post.coverUrl ? { images: [{ url: post.coverUrl }] } : {}),
    },
    twitter: { card: post.coverUrl ? 'summary_large_image' : 'summary', title, description },
  };
}

export default async function StoryPage({ params }: { params: { slug: string } }) {
  const { post, isAdmin } = await load(params.slug);
  if (!post) {
    // Slugs can change after publishing; fall back to a legacy note id.
    const legacy = await prisma.post.findFirst({ where: { legacyNoteId: params.slug }, select: { slug: true } });
    if (legacy) permanentRedirect(`/blog/${legacy.slug}`);
    notFound();
  }

  const locale = getLocale();
  const t = blogT(locale);
  const doc = isDoc(post.content) ? (post.content as PMNode) : null;
  const [embeds, related] = await Promise.all([resolveEmbedsForDoc(doc), getRelated(post.id, post.tags, 4)]);
  const responses = await prisma.comment.count({ where: { postId: post.id, status: 'VISIBLE' } });
  const toc = doc ? collectHeadings(doc) : [];
  const published = effectiveDate(post);
  const isVisible = post.status === 'PUBLISHED' || (post.status === 'SCHEDULED' && !!post.scheduledAt && post.scheduledAt <= new Date());
  const url = `${SITE_URL}${lhref(`/blog/${post.slug}`)}`;
  const authorName = post.author?.name ?? 'Arden BOUET';
  const authorImage = post.author ? post.author.image : '/images/me.png';
  const authorHref = post.author?.handle ? lhref(`/blog/author/${post.author.handle}`) : lhref('/');
  const authorBio = post.author ? post.author.bio : t('aboutAuthor');

  const series = post.series;
  const seriesIndex = series ? series.posts.findIndex(p => p.id === post.id) : -1;
  const prev = series && seriesIndex > 0 ? series.posts[seriesIndex - 1] : null;
  const next = series && seriesIndex >= 0 && seriesIndex < series.posts.length - 1 ? series.posts[seriesIndex + 1] : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.subtitle || post.excerpt,
    image: post.coverUrl || undefined,
    datePublished: published?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { '@type': 'Person', name: authorName, url: SITE_URL + authorHref },
    mainEntityOfPage: url,
    keywords: post.tags.join(', '),
    wordCount: post.wordCount || undefined,
  };

  return (
    <StoryProvider slug={post.slug} title={post.title} url={url} responses={responses} interactive={isVisible}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <TocRail entries={toc} />

      {!isVisible && (
        <div className="bg-[#fdf6e7] px-6 py-3 text-center text-[14px] text-[#7a5a00]">
          {t('draftPreview')}{' '}
          {isAdmin && <Link href={`/admin/blog/${post.id}`} className="font-medium underline">{t('edit')} →</Link>}
        </div>
      )}

      <div className="px-6">
        <header className="mx-auto max-w-[680px] pt-10 sm:pt-14">
          {series && seriesIndex >= 0 && (
            <Link href={lhref(`/blog/series/${series.slug}`)} className="mb-6 block rounded-md bg-[#f9f9f9] px-4 py-3 text-[14px] text-[#6b6b6b] hover:bg-[#f2f2f2]">
              {t('inSeries', { n: seriesIndex + 1, total: series.posts.length })} <span className="font-medium text-[#242424]">{series.title}</span>
            </Link>
          )}
          <h1 className="text-[32px] font-bold leading-[40px] tracking-[-0.016em] text-[#242424] sm:text-[42px] sm:leading-[52px]">
            {post.title}
          </h1>
          {post.subtitle && (
            <p className="mt-3 text-[20px] leading-[28px] text-[#6b6b6b] sm:text-[22px]">{post.subtitle}</p>
          )}

          <div className="mt-8 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {authorImage ? <img src={authorImage} alt="" className="h-11 w-11 rounded-full object-cover" /> : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#242424] text-[18px] uppercase text-white">{authorName[0]}</span>}
            <div className="text-[14px] leading-5">
              <p className="flex items-center gap-2 text-[#242424]">
                <Link href={authorHref} className="hover:underline">{authorName}</Link>
                <span className="text-[#6b6b6b]">·</span>
                <Link href={lhref('/blog/subscribe')} className="text-[#1a8917] hover:text-[#156d12]">{t('follow')}</Link>
              </p>
              <p className="text-[#6b6b6b]">
                {t('minRead', { n: post.readingMinutes })}
                {published && <> · <time dateTime={published.toISOString()}>{fmtDate(published, locale)}</time></>}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <StoryActionBar position="top" />
          </div>
        </header>

        {post.coverUrl && (
          <figure className="mx-auto mt-10 max-w-[1000px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.coverUrl} alt={post.coverAlt ?? ''} className="mx-auto w-full" fetchPriority="high" />
            {post.coverCaption && <figcaption className="mt-2.5 text-center text-[14px] text-[#6b6b6b]">{post.coverCaption}</figcaption>}
          </figure>
        )}

        <HighlightLayer>
          <article className="story mt-10">
            {doc ? (
              <StoryBody doc={doc} embeds={embeds} />
            ) : (
              <div className="legacy-md" dangerouslySetInnerHTML={{ __html: mdToSafeHtml(post.bodyMd ?? '') }} />
            )}
          </article>
        </HighlightLayer>

        <footer className="mx-auto mt-12 max-w-[680px]">
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <Link key={tag} href={lhref(`/blog/tag/${encodeURIComponent(tag)}`)} className="rounded-full bg-[#f2f2f2] px-4 py-2 text-[14px] text-[#242424] hover:bg-[#e6e6e6]">
                  {tag}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8">
            <StoryActionBar position="bottom" />
          </div>

          {isVisible && post.donationsEnabled && <DonateCard slug={post.slug} />}

          {(prev || next) && (
            <nav className="mt-10 grid gap-3 sm:grid-cols-2" aria-label={t('series')}>
              {prev ? (
                <Link href={lhref(`/blog/${prev.slug}`)} className="rounded-md border border-[#e6e6e6] p-4 hover:border-[#c4c4c4]">
                  <span className="text-[13px] text-[#6b6b6b]">← {t('previous')}</span>
                  <span className="mt-1 block font-bold text-[#242424] line-clamp-2">{prev.title}</span>
                </Link>
              ) : <span />}
              {next && (
                <Link href={lhref(`/blog/${next.slug}`)} className="rounded-md border border-[#e6e6e6] p-4 text-right hover:border-[#c4c4c4]">
                  <span className="text-[13px] text-[#6b6b6b]">{t('next')} →</span>
                  <span className="mt-1 block font-bold text-[#242424] line-clamp-2">{next.title}</span>
                </Link>
              )}
            </nav>
          )}
        </footer>
      </div>

      {/* Author + responses band */}
      <div className="mt-16 bg-[#f9f9f9] px-6 py-12">
        <div className="mx-auto max-w-[680px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {authorImage ? <img src={authorImage} alt="" className="h-16 w-16 rounded-full object-cover" /> : <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#242424] text-[24px] uppercase text-white">{authorName[0]}</span>}
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-[24px] font-bold tracking-[-0.016em] text-[#242424]"><Link href={authorHref} className="hover:underline">{t('writtenBy', { name: authorName })}</Link></h2>
              {authorBio && <p className="mt-2 max-w-[460px] text-[14px] leading-5 text-[#6b6b6b]">{authorBio}</p>}
            </div>
          </div>
          <div className="mt-6 max-w-[480px]"><SubscribeForm source={`post:${post.slug}`} /></div>

          <div className="mt-12 border-t border-[#e6e6e6] pt-10">
            <Responses commentsOpen={post.commentsOpen} />
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="px-6 py-14">
          <div className="mx-auto max-w-[1000px]">
            <h2 className="mb-8 border-b border-[#f2f2f2] pb-4 text-[20px] font-bold text-[#242424]">{t('recommended')}</h2>
            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2">
              {related.map(p => <GridCard key={p.id} post={p} locale={locale} t={t} />)}
            </div>
            <div className="mt-12">
              <Link href={lhref('/blog')} className="inline-block rounded-full border border-[#242424] px-5 py-2 text-[14px] text-[#242424] hover:bg-[#f9f9f9]">
                {t('seeAll')}
              </Link>
            </div>
          </div>
        </section>
      )}
    </StoryProvider>
  );
}
