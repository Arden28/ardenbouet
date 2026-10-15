// Server components for listing stories — Medium's feed row, compact sidebar row and topic pills.
import Link from 'next/link';
import { Sparkles, MessageCircle } from 'lucide-react';
import type { PostCard } from '@/lib/blog/queries';
import { fmtCount, fmtDate, type BlogLocale, type BlogT } from '@/lib/blog/strings';
import { SaveButton } from './SaveButton';
import { localizeHref } from '@/lib/i18n/config';

type Author = PostCard['author'];

/** A story's author; null author = the site owner. */
export function AuthorChip({ author, size = 20, locale = 'en' }: { author?: Author; size?: number; locale?: BlogLocale }) {
  const name = author?.name ?? 'Arden BOUET';
  const image = author ? author.image : '/images/me.png';
  const inner = (
    <>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />
      ) : (
        <span className="inline-flex items-center justify-center rounded-full bg-[#242424] text-[10px] uppercase text-white" style={{ width: size, height: size }}>{name[0]}</span>
      )}
      {name}
    </>
  );
  return author?.handle
    ? <Link href={localizeHref(`/blog/author/${author.handle}`, locale)} className="flex items-center gap-2 text-[13px] text-[#242424] hover:underline">{inner}</Link>
    : <span className="flex items-center gap-2 text-[13px] text-[#242424]">{inner}</span>;
}

export function ClapIcon({ className = 'h-[18px] w-[18px]', filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 1.2}>
      <path fillRule="evenodd" d="M11.37.83 12 3.28l.63-2.45h-1.26zM15.42 1.84l-1.18-.39-.34 2.5zM9.76 1.45l-1.19.4 1.53 2.1zM20.25 11.84l-2.5-4.4a1.42 1.42 0 0 0-.93-.64.96.96 0 0 0-.75.18c-.25.19-.4.42-.45.7l.05.05 2.35 4.13c1.62 2.95 1.1 5.78-1.52 8.4l-.46.41c1-.13 1.93-.6 2.78-1.45 2.7-2.7 2.51-5.59 1.43-7.38zM12.07 9.01c-.13-.69.08-1.3.57-1.77l-2.06-2.07c-.56-.56-1.53-.56-2.09 0-.54.54-.56 1.46-.02 2.02l4.73 4.73-.23-2.37zM14.26 8.42c-.22-.3-.39-.57-.45-.8-.25-.89.69-1.83 1.43-1.32l3.66 6.42c1.15 2.03 1.37 4.6-1.28 7.25-1.4 1.4-2.94 2.02-4.53 2a6.28 6.28 0 0 1-4.27-1.88L4.65 15.92c-.5-.5-.5-1.34 0-1.84.24-.23.56-.37.9-.37.33 0 .65.13.88.37l2.42 2.42a.28.28 0 0 0 .4 0 .28.28 0 0 0 0-.4L5.57 12.4c-.5-.5-.5-1.34 0-1.84a1.34 1.34 0 0 1 1.84 0l3.68 3.68a.28.28 0 1 0 .4-.4L7.85 10.2c-.51-.51-.51-1.33 0-1.84a1.34 1.34 0 0 1 1.84 0l3.65 3.65a.28.28 0 1 0 .4-.4l-.72-.7-1.26-1.26.18.18 2.32-1.4z" />
    </svg>
  );
}

export function FeedRow({ post, locale, t, priority = false }: { post: PostCard; locale: BlogLocale; t: BlogT; priority?: boolean }) {
  const href = localizeHref(`/blog/${post.slug}`, locale);
  return (
    <article className="border-b border-[#f2f2f2] py-6 sm:py-8">
      <div className="mb-2 flex items-center gap-2">
        <AuthorChip author={post.author} locale={locale} />
        {post.seriesTitle && post.seriesSlug && <Link href={localizeHref(`/blog/series/${post.seriesSlug}`, locale)} className="truncate text-[13px] text-[#6b6b6b] hover:text-[#242424] hover:underline">{t('inSeriesShort', { title: post.seriesTitle })}</Link>}
      </div>
      <div className="flex gap-6 sm:gap-14">
        <div className="min-w-0 flex-1">
          <Link href={href} className="group block">
            <h2 className="line-clamp-3 text-[20px] font-bold leading-[24px] tracking-[-0.016em] text-[#242424] sm:line-clamp-2 sm:text-[24px] sm:leading-[30px]">
              {post.title}
            </h2>
            {(post.subtitle || post.excerpt) && (
              <p className="mt-2 hidden text-[16px] leading-6 text-[#6b6b6b] line-clamp-2 sm:block">{post.subtitle || post.excerpt}</p>
            )}
          </Link>
          <div className="mt-4 flex items-center gap-4 text-[13px] text-[#6b6b6b]">
            {post.featured && <Sparkles className="h-4 w-4 fill-[#ffc017] text-[#ffc017]" aria-label="Featured" />}
            <time dateTime={post.publishedAt ?? undefined}>{fmtDate(post.publishedAt, locale)}</time>
            <span>{t('minRead', { n: post.readingMinutes })}</span>
            {post.claps > 0 && (
              <span className="flex items-center gap-1"><ClapIcon className="h-4 w-4" />{fmtCount(post.claps)}</span>
            )}
            {post.responses > 0 && (
              <span className="flex items-center gap-1"><MessageCircle className="h-4 w-4" strokeWidth={1.4} />{post.responses}</span>
            )}
            <span className="ml-auto flex items-center gap-1">
              {post.tags[0] && (
                <Link href={localizeHref(`/blog/tag/${encodeURIComponent(post.tags[0])}`, locale)} className="hidden rounded-full bg-[#f2f2f2] px-2.5 py-1 text-[12px] text-[#242424] sm:inline">
                  {post.tags[0]}
                </Link>
              )}
              <SaveButton slug={post.slug} />
            </span>
          </div>
        </div>
        {post.coverUrl && (
          <Link href={href} className="shrink-0" tabIndex={-1} aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverUrl}
              alt=""
              loading={priority ? 'eager' : 'lazy'}
              className="h-[56px] w-[80px] object-cover sm:h-[107px] sm:w-[160px]"
            />
          </Link>
        )}
      </div>
    </article>
  );
}

export function CompactRow({ post, locale }: { post: PostCard; locale: BlogLocale }) {
  return (
    <li className="py-3">
      <div className="mb-1.5"><AuthorChip author={post.author} size={16} locale={locale} /></div>
      <Link href={localizeHref(`/blog/${post.slug}`, locale)} className="block text-[16px] font-bold leading-5 tracking-[-0.01em] text-[#242424] line-clamp-2 hover:underline">
        {post.title}
      </Link>
      <div className="mt-1.5 flex items-center gap-2 text-[13px] text-[#6b6b6b]">
        {post.featured && <Sparkles className="h-3.5 w-3.5 fill-[#ffc017] text-[#ffc017]" />}
        <span>{fmtDate(post.publishedAt, locale)}</span>
      </div>
    </li>
  );
}

export function TopicPills({ tags, active, locale = 'en' }: { tags: { tag: string; count: number }[]; active?: string; locale?: BlogLocale }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(({ tag }) => (
        <Link
          key={tag}
          href={localizeHref(`/blog/tag/${encodeURIComponent(tag)}`, locale)}
          className={`rounded-full px-4 py-2 text-[14px] transition-colors ${
            active === tag ? 'bg-[#242424] text-white' : 'bg-[#f2f2f2] text-[#242424] hover:bg-[#e6e6e6]'
          }`}
        >
          {tag}
        </Link>
      ))}
    </div>
  );
}

export function GridCard({ post, locale, t }: { post: PostCard; locale: BlogLocale; t: BlogT }) {
  return (
    <article className="flex flex-col">
      <Link href={localizeHref(`/blog/${post.slug}`, locale)} className="group block" tabIndex={-1} aria-hidden>
        <div className="aspect-[16/9] w-full overflow-hidden bg-[#f2f2f2]">
          {post.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
          )}
        </div>
      </Link>
      {/* The author chip can be a link itself, so it sits outside the card links (no nested <a>). */}
      <div className="mt-4"><AuthorChip author={post.author} locale={locale} /></div>
      <Link href={localizeHref(`/blog/${post.slug}`, locale)} className="group block">
        <h3 className="mt-2 text-[20px] font-bold leading-6 tracking-[-0.016em] text-[#242424] line-clamp-2">{post.title}</h3>
        {(post.subtitle || post.excerpt) && (
          <p className="mt-2 text-[16px] leading-[22px] text-[#6b6b6b] line-clamp-2">{post.subtitle || post.excerpt}</p>
        )}
      </Link>
      <div className="mt-3 flex items-center gap-3 text-[13px] text-[#6b6b6b]">
        <span>{fmtDate(post.publishedAt, locale)}</span>
        <span>{t('minRead', { n: post.readingMinutes })}</span>
        {post.claps > 0 && <span className="flex items-center gap-1"><ClapIcon className="h-4 w-4" />{fmtCount(post.claps)}</span>}
        <span className="ml-auto"><SaveButton slug={post.slug} /></span>
      </div>
    </article>
  );
}
