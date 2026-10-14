// app/write — writer editor; signed-in writers only (the API enforces permissions per story).
import { redirect } from 'next/navigation';
import { getReader } from '@/lib/readerAuth';
import { getPathname, lhref } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Write · Arden BOUET', robots: { index: false } };

export default async function WriteLayout({ children }: { children: React.ReactNode }) {
  if (!(await getReader())) redirect(`${lhref('/signin')}?callbackUrl=${encodeURIComponent(getPathname())}`);
  return children;
}
