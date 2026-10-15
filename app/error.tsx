'use client';
// 500 — error boundary for every route below the root layout (header, footer and providers stay up).
import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, RotateCcw } from 'lucide-react';
import { useSite } from '@/components/site/SiteProviders';
import { ErrorScreen, errBtnGhost, errBtnPrimary } from '@/components/site/ErrorScreen';
import { OWNER } from '@/lib/site';

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { ui, href } = useSite();
  useEffect(() => { console.error(error); }, [error]);
  const ref = error.digest;
  const mail = `mailto:${OWNER.supportEmail}?subject=${encodeURIComponent(`Site error${ref ? ` ${ref}` : ''}`)}&body=${encodeURIComponent(`Page: ${typeof window !== 'undefined' ? window.location.href : ''}\n`)}`;

  return (
    <ErrorScreen
      code={500}
      eyebrow={ui('err.code', { code: 500 })}
      title={ui('err.500.title')}
      body={ui('err.500.body')}
      actions={<>
        <button type="button" onClick={() => reset()} className={errBtnPrimary}><RotateCcw className="h-4 w-4" /> {ui('err.retry')}</button>
        <Link href={href('/')} className={errBtnGhost}><ArrowLeft className="h-4 w-4" /> {ui('err.home')}</Link>
      </>}
    >
      <p className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[#9b9b9b]">
        {ref && <span className="font-mono">{ui('err.ref', { id: ref })}</span>}
        <a href={mail} className="inline-flex items-center gap-1.5 underline decoration-[#d4d4d4] underline-offset-4 hover:text-[#242424]"><Mail className="h-3.5 w-3.5" /> {ui('err.contact')}</a>
      </p>
    </ErrorScreen>
  );
}
