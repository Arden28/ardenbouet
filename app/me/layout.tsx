// app/me/layout.tsx — the signed-in reader's account area (Medium-style settings layout).
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getReader } from '@/lib/readerAuth';
import { getPathname, lhref } from '@/lib/i18n/server';
import { MeNav } from './MeNav';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your account · Arden BOUET', robots: { index: false } };

export default async function MeLayout({ children }: { children: React.ReactNode }) {
  const reader = await getReader();
  if (!reader) redirect(`${lhref('/signin')}?callbackUrl=${encodeURIComponent(lhref(getPathname()))}`);
  return (
    <div className="blog-ui mx-auto flex max-w-[1192px] flex-col gap-8 px-6 pb-16 pt-8 lg:flex-row lg:gap-16 lg:pt-14">
      <MeNav />
      <main className="min-w-0 max-w-[720px] flex-1">{children}</main>
    </div>
  );
}
