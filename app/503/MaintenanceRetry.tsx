'use client';
// Re-checks the current URL every 30 s and reloads as soon as it stops answering 503.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, RotateCcw } from 'lucide-react';
import { uiT } from '@/lib/i18n/ui';
import { localizeHref, type Locale } from '@/lib/i18n/config';
import { errBtnGhost } from '@/components/site/ErrorScreen';

const EVERY = 30;

export function MaintenanceRetry({ locale }: { locale: Locale }) {
  const ui = uiT(locale);
  const [left, setLeft] = useState(EVERY);
  const [checking, setChecking] = useState(false);
  const [direct, setDirect] = useState(false);

  const check = async () => {
    setChecking(true);
    try {
      const res = await fetch(location.href, { method: 'HEAD', cache: 'no-store' });
      if (res.status !== 503) { location.reload(); return; }
    } catch { /* still down or offline */ }
    setChecking(false);
    setLeft(EVERY);
  };

  useEffect(() => {
    // Opened at /503 itself (not through the maintenance rewrite): nothing to wait for.
    if (/\/503\/?$/.test(location.pathname)) { setDirect(true); return; }
    const id = setInterval(() => setLeft(s => s - 1), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { if (left <= 0 && !checking) check(); }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  if (direct) return <Link href={localizeHref('/', locale)} className={errBtnGhost}><ArrowLeft className="h-4 w-4" /> {ui('err.home')}</Link>;

  return (
    <>
      <button type="button" onClick={check} disabled={checking} className={`${errBtnGhost} disabled:opacity-60`}>
        {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} {ui('err.retry')}
      </button>
      <span className="inline-flex items-center gap-3 text-[14px] text-[#6b6b6b]" aria-live="polite">
        <svg viewBox="0 0 36 36" className="h-6 w-6 -rotate-90" aria-hidden>
          <circle cx="18" cy="18" r="15" fill="none" className="stroke-[#ececec]" strokeWidth="3" />
          <circle cx="18" cy="18" r="15" fill="none" stroke="#1a8917" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${(Math.max(left, 0) / EVERY) * 94.2} 94.2`} className="transition-[stroke-dasharray] duration-1000 ease-linear" />
        </svg>
        {checking ? ui('err.503.checking') : ui('err.503.retryIn', { s: Math.max(left, 0) })}
      </span>
    </>
  );
}
