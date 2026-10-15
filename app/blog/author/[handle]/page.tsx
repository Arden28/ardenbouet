// app/blog/author/[handle]/page.tsx — a writer's public profile (Medium-style)
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MapPin, Link2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getLocale } from '@/lib/i18n/server';
import { blogT, fmtDate } from '@/lib/blog/strings';
import { listPosts } from '@/lib/blog/queries';
import { FeedRow } from '../../_components/PostList';

export const dynamic = 'force-dynamic';

async function load(handle: string) {
  return prisma.reader.findFirst({
    where: { handle: decodeURIComponent(handle).toLowerCase().replace(/^@/, ''), banned: false },
    select: { id: true, name: true, handle: true, image: true, bio: true, website: true, location: true, createdAt: true },
  });
}

export async function generateMetadata({ params }: { params: { handle: string } }): Promise<Metadata> {
  const a = await load(params.handle);
  return a ? { title: `${a.name} · Blog · Arden BOUET`, description: a.bio || `Stories by ${a.name}` } : {};
}

export default async function AuthorPage({ params }: { params: { handle: string } }) {
  const author = await load(params.handle);
  if (!author) notFound();
  const locale = getLocale();
  const t = blogT(locale);
  const posts = await listPosts({ authorId: author.id, take: 50 });

  return (
    <div className="mx-auto flex max-w-[1192px] flex-col-reverse gap-10 px-6 pt-10 lg:flex-row lg:justify-between">
      <main className="min-w-0 max-w-[728px] flex-1">
        <h1 className="hidden text-[42px] font-bold leading-[52px] tracking-[-0.02em] text-[#242424] lg:block">{author.name}</h1>
        <nav className="mt-8 border-b border-[#f2f2f2] text-[14px]"><span className="-mb-px inline-block border-b border-[#242424] pb-3 text-[#242424]">{t('storiesBy', { name: author.name })}</span></nav>
        {posts.length === 0 ? <p className="py-16 text-center text-[#6b6b6b]">{t('noStories')}</p> : posts.map(p => <FeedRow key={p.id} post={p} locale={locale} t={t} />)}
      </main>
      <aside className="lg:w-[328px] lg:shrink-0 lg:border-l lg:border-[#f2f2f2] lg:pl-10">
        <div className="lg:sticky lg:top-[80px] lg:pt-2">
          {author.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={author.image} alt="" className="h-[88px] w-[88px] rounded-full object-cover" />
          ) : (
            <span className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[#242424] text-[34px] uppercase text-white">{author.name[0]}</span>
          )}
          <h2 className="mt-4 text-[16px] font-bold text-[#242424] lg:text-[16px]">{author.name}</h2>
          <p className="text-[14px] text-[#6b6b6b]">@{author.handle} · {posts.length === 1 ? t('storyCount') : t('storiesCount', { n: posts.length })}</p>
          {author.bio && <p className="mt-3 text-[14px] leading-5 text-[#6b6b6b]">{author.bio}</p>}
          <div className="mt-4 space-y-1.5 text-[13px] text-[#6b6b6b]">
            {author.location && <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {author.location}</p>}
            {author.website && <a href={author.website} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1.5 hover:text-[#242424]"><Link2 className="h-3.5 w-3.5" /> {author.website.replace(/^https?:\/\//, '')}</a>}
            <p>{fmtDate(author.createdAt, locale)}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
