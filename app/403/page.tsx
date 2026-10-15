// /403 — standalone "access denied" page (also rendered inline where access is checked, e.g. /write).
import type { Metadata } from 'next';
import { Forbidden } from '@/components/site/Forbidden';

export const metadata: Metadata = { title: 'Access denied · Arden BOUET', robots: { index: false } };

export default function ForbiddenPage() {
  return <Forbidden />;
}
