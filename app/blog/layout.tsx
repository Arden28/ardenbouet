// app/blog/layout.tsx — Medium-style shell for the blog (the site Header/Footer hide themselves on /blog).
import { Suspense } from 'react';
import Link from 'next/link';
import { Source_Serif_4 } from 'next/font/google';
import { getLocale } from '@/lib/serverT';
import { isAdminRequest } from '@/lib/apiUtil';
import { readerProviderIds } from '@/lib/readerAuth';
import { ReaderProvider } from './_components/ReaderProvider';
import { BlogHeader } from './_components/BlogHeader';
import './story.css';

const serif = Source_Serif_4({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' });

export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  const isAdmin = await isAdminRequest();

  return (
    <div className={`${serif.variable} blog-ui min-h-screen bg-white`}>
      <ReaderProvider locale={locale} isAdmin={isAdmin} providers={readerProviderIds}>
        <Suspense fallback={<div className="h-[57px] border-b border-[#f2f2f2]" />}>
          <BlogHeader />
        </Suspense>
        {children}
        <footer className="mt-24 border-t border-[#f2f2f2]">
          <div className="mx-auto flex max-w-[1192px] flex-wrap items-center gap-x-6 gap-y-2 px-6 py-8 text-[13px] text-[#6b6b6b]">
            <Link href="/" className="hover:text-[#242424]">ardenbouet.me</Link>
            <Link href="/blog" className="hover:text-[#242424]">Blog</Link>
            <Link href="/shop" className="hover:text-[#242424]">Shop</Link>
            <Link href="/blog/subscribe" className="hover:text-[#242424]">Newsletter</Link>
            <a href="/blog/rss.xml" className="hover:text-[#242424]">RSS</a>
            <span className="ml-auto">© {new Date().getFullYear()} Arden BOUET</span>
          </div>
        </footer>
      </ReaderProvider>
    </div>
  );
}
