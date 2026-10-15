// app/write — writer editor; signed-in writers only (the API still enforces permissions per story).
import { redirect } from 'next/navigation';
import { getReader } from '@/lib/readerAuth';
import { writerStatus } from '@/lib/accounts';
import { Forbidden } from '@/components/site/Forbidden';
import { getPathname, lhref } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Write · Arden BOUET', robots: { index: false } };

export default async function WriteLayout({ children }: { children: React.ReactNode }) {
  const reader = await getReader();
  if (!reader) redirect(`${lhref('/signin')}?callbackUrl=${encodeURIComponent(getPathname())}`);
  if (!(await writerStatus(reader.id)).isWriter) return <Forbidden reason="writer" />;
  return children;
}
