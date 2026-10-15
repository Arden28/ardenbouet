// app/blog/search/page.tsx — mobile search entry (results render on /blog?q=)
import { redirect } from 'next/navigation';
import { getLocale } from '@/lib/serverT';
import { blogT } from '@/lib/blog/strings';
import { getTopTags } from '@/lib/blog/queries';
import { TopicPills } from '../_components/PostList';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  if (searchParams.q?.trim()) redirect(`/blog?q=${encodeURIComponent(searchParams.q.trim())}`);
  const t = blogT(getLocale());
  const tags = await getTopTags(16);
  return (
    <main className="mx-auto max-w-[728px] px-6 pt-8">
      <form action="/blog" role="search">
        <input
          name="q"
          autoFocus
          placeholder={t('search')}
          className="w-full border-b border-[#e6e6e6] pb-3 text-[28px] font-bold tracking-[-0.02em] text-[#242424] outline-none placeholder:text-[#c4c4c4]"
        />
      </form>
      {tags.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-[16px] font-bold text-[#242424]">{t('topics')}</h2>
          <TopicPills tags={tags} />
        </section>
      )}
    </main>
  );
}
