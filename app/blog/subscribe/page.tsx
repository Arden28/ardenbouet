// app/blog/subscribe/page.tsx — newsletter signup + confirmation / unsubscribe landing
import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale } from '@/lib/serverT';
import { blogT } from '@/lib/blog/strings';
import { SubscribeForm } from '../_components/SubscribeForm';

export const metadata: Metadata = { title: 'Newsletter · Blog · Arden BOUET' };

export default function SubscribePage({ searchParams }: { searchParams: { status?: string } }) {
  const t = blogT(getLocale());
  const status = searchParams.status;
  const message =
    status === 'confirmed' ? t('subscribeConfirmed')
    : status === 'unsubscribed' ? t('unsubscribed')
    : status === 'invalid' ? t('subscribeInvalid')
    : null;

  return (
    <main className="mx-auto max-w-[560px] px-6 pt-20 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/me.png" alt="" className="mx-auto h-20 w-20 rounded-full object-cover" />
      {message ? (
        <>
          <h1 className="mt-8 font-story text-[32px] leading-[40px] text-[#242424]">{message}</h1>
          <Link href="/blog" className="mt-8 inline-block rounded-full bg-[#242424] px-5 py-2.5 text-[14px] text-white hover:bg-black">
            {t('backToBlog')}
          </Link>
        </>
      ) : (
        <>
          <h1 className="mt-8 font-story text-[32px] leading-[40px] text-[#242424]">{t('subscribeTitle')}</h1>
          <p className="mx-auto mt-4 max-w-[420px] text-[16px] leading-6 text-[#6b6b6b]">{t('subscribeBody')}</p>
          <div className="mx-auto mt-8 max-w-[440px] text-left"><SubscribeForm source="subscribe-page" /></div>
        </>
      )}
    </main>
  );
}
