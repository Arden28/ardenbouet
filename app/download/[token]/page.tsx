import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Download, AlertCircle, Clock, ShieldCheck } from 'lucide-react';

interface PageProps { params: { token: string } }

function formatTimeLeft(expiresAt: Date): string {
  const ms   = expiresAt.getTime() - Date.now();
  const h    = Math.floor(ms / 3_600_000);
  const m    = Math.floor((ms % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return 'less than a minute';
}

function ErrorPage({ kind }: { kind: 'invalid' | 'expired' | 'exhausted' }) {
  const copy = {
    invalid:   { title: 'Link not found.',     body: 'This download link is invalid. Please check your email for the correct link.' },
    expired:   { title: 'Link expired.',        body: 'This download link has expired (valid for 48 hours). Please contact us and we\'ll send a new one.' },
    exhausted: { title: 'Download limit reached.', body: 'This link has been used the maximum number of times. Contact us if you need access again.' },
  }[kind];

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          {/* Header */}
          <div className="bg-zinc-900 dark:bg-zinc-950 border-b border-zinc-800 px-8 py-6">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500 mb-3">
              ARDEN BOUET · SHOP
            </p>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" style={{ color: '#ef4444' }} />
              <h1 className="font-mono text-lg font-black tracking-tight text-white">
                {copy.title}
              </h1>
            </div>
          </div>
          {/* Body */}
          <div className="px-8 py-7">
            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              {copy.body}
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <a
                href="mailto:laudbouetoumoussa@gmail.com"
                className="flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-50 px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
              >
                Contact support →
              </a>
              <Link
                href="/shop"
                className="flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-700 px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-100 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                ← Back to shop
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default async function DownloadPage({ params }: PageProps) {
  const { token } = params;

  const record = await prisma.downloadToken.findUnique({ where: { id: token } });

  if (!record) return <ErrorPage kind="invalid" />;

  const now  = new Date();
  if (record.expiresAt < now) return <ErrorPage kind="expired" />;
  if (record.downloadCount >= record.maxDownloads) return <ErrorPage kind="exhausted" />;

  const timeLeft      = formatTimeLeft(record.expiresAt);
  const downloadsLeft = record.maxDownloads - record.downloadCount;

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">

          {/* Dark header */}
          <div className="px-8 py-7 border-l-4 border-[#2467AC] bg-[#09090b]">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-500 mb-4">
              ARDEN BOUET · SHOP
            </p>
            <h1 className="font-mono text-2xl font-black tracking-tight text-white leading-tight">
              Your download<br />is ready.
            </h1>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              Hi <strong className="text-zinc-200">{record.customerName}</strong> — your file is waiting below.
            </p>
          </div>

          {/* Product block */}
          <div className="border-b border-zinc-100 dark:border-zinc-800 px-8 py-5">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 mb-1">
              Product
            </p>
            <p className="font-mono text-base font-bold text-zinc-900 dark:text-zinc-50">
              {record.productTitle}
            </p>
          </div>

          {/* Token stats */}
          <div className="border-b border-zinc-100 dark:border-zinc-800 px-8 py-4 flex gap-6">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <div>
                <p className="font-mono text-[8px] uppercase tracking-widest text-zinc-400">Expires in</p>
                <p className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-50">{timeLeft}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Download className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <div>
                <p className="font-mono text-[8px] uppercase tracking-widest text-zinc-400">Downloads left</p>
                <p className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  {downloadsLeft} of {record.maxDownloads}
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="px-8 py-7">
            <a
              href={`/api/download/${token}`}
              className="flex w-full items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-700 dark:bg-zinc-50 dark:hover:bg-zinc-200 px-6 py-4 font-mono text-[11px] uppercase tracking-widest text-white dark:text-zinc-900 transition-colors duration-150"
            >
              <Download className="h-4 w-4" />
              Download {record.productTitle} →
            </a>
            <p className="mt-4 text-center font-mono text-[9px] text-zinc-400 leading-relaxed">
              Save this file somewhere safe — each click uses one of your {record.maxDownloads} downloads.
            </p>
          </div>

          {/* Security footer */}
          <div className="border-t border-zinc-100 dark:border-zinc-800 px-8 py-3">
            <div className="flex items-center gap-2 text-zinc-400">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <p className="font-mono text-[9px] uppercase tracking-widest">
                Secure · Time-limited · Single-use token
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-zinc-900 dark:bg-zinc-950 px-8 py-4">
            <p className="font-mono text-[9px] text-zinc-600 leading-relaxed">
              Issues with your download?{' '}
              <a
                href="mailto:laudbouetoumoussa@gmail.com"
                className="text-zinc-400 underline underline-offset-2 hover:text-zinc-200 transition-colors"
              >
                laudbouetoumoussa@gmail.com
              </a>
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/shop"
            className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            ← Back to shop
          </Link>
        </div>
      </div>
    </main>
  );
}
