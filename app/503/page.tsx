// /503 — maintenance page. With MAINTENANCE_MODE=1 the middleware rewrites public pages here (status 503).
import type { Metadata } from 'next';
import { getLocale } from '@/lib/i18n/server';
import { uiT } from '@/lib/i18n/ui';
import { ErrorScreen } from '@/components/site/ErrorScreen';
import { MaintenanceRetry } from './MaintenanceRetry';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Back soon · Arden BOUET', robots: { index: false } };

export default function MaintenancePage() {
  const locale = getLocale();
  const ui = uiT(locale);
  return (
    <ErrorScreen code={503} eyebrow={ui('err.code', { code: 503 })} title={ui('err.503.title')} body={ui('err.503.body')}
      actions={<MaintenanceRetry locale={locale} />} />
  );
}
