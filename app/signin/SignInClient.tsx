'use client';
import { AuthPanel, type AuthCopy } from '@/components/auth/AuthPanel';
import { uiT } from '@/lib/i18n/ui';
import type { Locale } from '@/lib/i18n/config';

export function authCopy(locale: Locale, error?: string): AuthCopy {
  const t = uiT(locale);
  return {
    joinTitle: t('auth.joinTitle'),
    signInTitle: t('auth.signInTitle'),
    joinBody: t('auth.joinBody'),
    signInBody: t('auth.signInBody'),
    continueWith: provider => t('auth.continueWith', { provider }),
    haveAccount: t('auth.haveAccount'),
    noAccount: t('auth.noAccount'),
    switchToSignIn: t('auth.switchToSignIn'),
    switchToJoin: t('auth.switchToJoin'),
    terms: t('auth.terms'),
    notConfigured: t('auth.notConfigured'),
    error,
  };
}

export function SignInClient({ providers, callbackUrl, initialMode, locale, error }: {
  providers: string[]; callbackUrl: string; initialMode: 'join' | 'signin'; locale: Locale; error?: string;
}) {
  return <AuthPanel providers={providers} callbackUrl={callbackUrl} initialMode={initialMode} copy={authCopy(locale, error)} />;
}
