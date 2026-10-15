// 403 screen. `writer` explains the editor is for writers and links to the request form.
import Link from 'next/link';
import { ArrowLeft, LogIn, PenLine } from 'lucide-react';
import { getLocale, lhref } from '@/lib/i18n/server';
import { uiT } from '@/lib/i18n/ui';
import { ErrorScreen, errBtnGhost, errBtnPrimary } from '@/components/site/ErrorScreen';

export function Forbidden({ reason = 'default' }: { reason?: 'default' | 'writer' }) {
  const ui = uiT(getLocale());
  return (
    <ErrorScreen
      code={403}
      eyebrow={ui('err.code', { code: 403 })}
      title={ui('err.403.title')}
      body={reason === 'writer' ? ui('err.403.writerBody') : ui('err.403.body')}
      actions={reason === 'writer' ? (
        <>
          <Link href={lhref('/me/writer')} className={errBtnPrimary}><PenLine className="h-4 w-4" /> {ui('err.403.writerCta')}</Link>
          <Link href={lhref('/blog')} className={errBtnGhost}>{ui('nav.writing')}</Link>
        </>
      ) : (
        <>
          <Link href={lhref('/signin')} className={errBtnPrimary}><LogIn className="h-4 w-4" /> {ui('err.signin')}</Link>
          <Link href={lhref('/')} className={errBtnGhost}><ArrowLeft className="h-4 w-4" /> {ui('err.home')}</Link>
        </>
      )}
    />
  );
}
