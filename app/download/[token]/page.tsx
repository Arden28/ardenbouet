// app/download/[token]/page.tsx — time-limited download page for a purchased file.
import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle, Clock, Download, Mail, ShieldCheck } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getLocale, lhref } from '@/lib/i18n/server';
import { uiT, type UiT } from '@/lib/i18n/ui';
import { OWNER } from '@/lib/site';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Your download · Arden BOUET', robots: { index: false } };

function formatTimeLeft(expiresAt: Date): string {
  const ms = expiresAt.getTime() - Date.now();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(m, 1)}m`;
}

function ErrorPage({ kind, ui }: { kind: 'invalid' | 'expired' | 'exhausted'; ui: UiT }) {
  return (
    <main className="blog-ui flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-[460px] text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fdf1f1]"><AlertCircle className="h-6 w-6 text-[#c94a4a]" /></span>
        <h1 className="mt-6 text-[30px] font-bold tracking-[-0.02em] text-[#242424]">{ui(`dl.${kind}.title`)}</h1>
        <p className="mt-3 font-story text-[18px] leading-[1.55] text-[#6b6b6b]">{ui(`dl.${kind}.body`)}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={`mailto:${OWNER.supportEmail}`} className="inline-flex items-center gap-2 rounded-full bg-[#242424] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-black"><Mail className="h-4 w-4" /> {ui('dl.contact')}</a>
          <Link href={lhref('/shop')} className="rounded-full border border-[#242424] px-5 py-2.5 text-[14px] text-[#242424] hover:bg-[#f9f9f9]">{ui('co.backShop')}</Link>
        </div>
      </div>
    </main>
  );
}

export default async function DownloadPage({ params }: { params: { token: string } }) {
  const ui = uiT(getLocale());
  const record = await prisma.downloadToken.findUnique({ where: { id: params.token } });
  if (!record) return <ErrorPage kind="invalid" ui={ui} />;
  if (record.expiresAt < new Date()) return <ErrorPage kind="expired" ui={ui} />;
  if (record.downloadCount >= record.maxDownloads) return <ErrorPage kind="exhausted" ui={ui} />;

  const left = record.maxDownloads - record.downloadCount;

  return (
    <main className="blog-ui flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-[520px]">
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eef7ee]"><Download className="h-6 w-6 text-[#1a8917]" /></span>
          <h1 className="mt-6 text-[32px] font-bold tracking-[-0.02em] text-[#242424]">{ui('dl.ready')}</h1>
          <p className="mt-2 font-story text-[18px] text-[#6b6b6b]">{ui('dl.hi', { name: record.customerName.split(/\s+/)[0] || record.customerName })}</p>
        </div>

        <div className="mt-10 rounded-2xl border border-[#ececec] bg-white">
          <div className="p-6">
            <p className="text-[18px] font-semibold text-[#242424]">{record.productTitle}</p>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-[14px]">
              <div className="flex items-start gap-2.5">
                <Clock className="mt-0.5 h-4 w-4 text-[#9b9b9b]" />
                <div><dt className="text-[12px] text-[#9b9b9b]">{ui('dl.expires')}</dt><dd className="font-medium tabular-nums text-[#242424]">{formatTimeLeft(record.expiresAt)}</dd></div>
              </div>
              <div className="flex items-start gap-2.5">
                <Download className="mt-0.5 h-4 w-4 text-[#9b9b9b]" />
                <div><dt className="text-[12px] text-[#9b9b9b]">{ui('dl.left')}</dt><dd className="font-medium tabular-nums text-[#242424]">{ui('dl.of', { n: left, max: record.maxDownloads })}</dd></div>
              </div>
            </dl>
            <a href={`/api/download/${params.token}`} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#1a8917] py-3.5 text-[15px] font-medium text-white hover:bg-[#156d12]">
              <Download className="h-4 w-4" /> {ui('dl.cta')}
            </a>
            <p className="mt-3 text-center text-[12px] text-[#9b9b9b]">{ui('dl.note')}</p>
          </div>
          <p className="flex items-center gap-2 rounded-b-2xl bg-[#fafafa] px-6 py-4 text-[13px] text-[#6b6b6b]">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>{ui('dl.help', { email: OWNER.supportEmail })}</span>
          </p>
        </div>

        <p className="mt-6 text-center"><Link href={lhref('/shop')} className="text-[14px] text-[#6b6b6b] hover:text-[#242424]">{ui('co.backShop')}</Link></p>
      </div>
    </main>
  );
}
