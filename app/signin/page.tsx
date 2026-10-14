// app/signin/page.tsx — Medium-style social sign-in / join page (also next-auth's error page).
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getLocale, lhref } from '@/lib/i18n/server';
import { uiT } from '@/lib/i18n/ui';
import { getReader, readerProviderIds } from '@/lib/readerAuth';
import { SignInClient } from './SignInClient';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Sign in · Arden BOUET', robots: { index: false } };

/** Only same-site relative paths are allowed as a post-sign-in destination. */
function safeCallback(v: string | undefined, fallback: string) {
  return v && v.startsWith('/') && !v.startsWith('//') ? v : fallback;
}

export default async function SignInPage({ searchParams }: { searchParams: { callbackUrl?: string; error?: string; mode?: string } }) {
  const locale = getLocale();
  const callbackUrl = safeCallback(searchParams.callbackUrl, lhref('/me'));
  if (await getReader()) redirect(callbackUrl);

  const t = uiT(locale);
  const errKey = searchParams.error ? (`auth.error.${searchParams.error}` as const) : null;
  const error = errKey
    ? (['auth.error.OAuthAccountNotLinked', 'auth.error.AccessDenied'].includes(errKey) ? t(errKey as 'auth.error.AccessDenied') : t('auth.error.default'))
    : undefined;

  return (
    <div className="blog-ui flex min-h-screen flex-col bg-white">
      <header className="flex h-[65px] items-center justify-between px-6">
        <Link href={lhref('/')} className="font-story text-[26px] font-bold text-[#242424]">Arden</Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-20 pt-6">
        <SignInClient
          providers={readerProviderIds}
          callbackUrl={callbackUrl}
          initialMode={searchParams.mode === 'signin' ? 'signin' : 'join'}
          locale={locale}
          error={error}
        />
      </main>
    </div>
  );
}
