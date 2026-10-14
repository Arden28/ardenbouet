'use client';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { authCopy } from '@/components/auth/authCopy';
import type { Locale } from '@/lib/i18n/config';

export { authCopy };

export function SignInClient({ providers, callbackUrl, initialMode, locale, error }: {
  providers: string[]; callbackUrl: string; initialMode: 'join' | 'signin'; locale: Locale; error?: string;
}) {
  return <AuthPanel providers={providers} callbackUrl={callbackUrl} initialMode={initialMode} copy={authCopy(locale, error)} />;
}
