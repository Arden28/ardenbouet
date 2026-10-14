// app/blog/reading-list/page.tsx — the signed-in reader's saved stories
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getReader } from '@/lib/readerAuth';
import { getLocale } from '@/lib/serverT';
import { blogT } from '@/lib/blog/strings';
import { getPostCardsByIds } from '@/lib/blog/queries';
import { FeedRow } from '../_components/PostList';
import { SignInPrompt } from './SignInPrompt';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Reading list · Blog · Arden BOUET', robots: { index: false } };

export default async function ReadingListPage() {
  const locale = getLocale();
  const t = blogT(locale);
  const reader = await getReader();
  const ids = reader
    ? (await prisma.bookmark.findMany({ where: { readerId: reader.id }, orderBy: { createdAt: 'desc' }, select: { postId: true } })).map(b => b.postId)
    : [];
  const posts = await getPostCardsByIds(ids);

  return (
    <main className="mx-auto max-w-[728px] px-6 pt-12">
      <h1 className="text-[36px] font-bold leading-[44px] tracking-[-0.02em] text-[#242424] sm:text-[42px] sm:leading-[52px]">{t('readingList')}</h1>
      {reader && (
        <p className="mt-3 text-[14px] text-[#6b6b6b]">
          {reader.name} · {posts.length === 1 ? t('storyCount') : t('storiesCount', { n: posts.length })}
        </p>
      )}
      <div className="mt-8 border-t border-[#f2f2f2]">
        {!reader ? (
          <SignInPrompt />
        ) : posts.length === 0 ? (
          <p className="py-16 text-center text-[16px] text-[#6b6b6b]">{t('readingListEmpty')}</p>
        ) : (
          posts.map(p => <FeedRow key={p.id} post={p} locale={locale} t={t} />)
        )}
      </div>
    </main>
  );
}
