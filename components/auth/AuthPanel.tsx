'use client';
// Medium-style social sign-in panel. Social-only: signing in and joining are the same flow
// (the account is created on first sign-in), the copy just changes.
import { useState, type ReactNode } from 'react';
import { signIn } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

export const PROVIDER_META: Record<string, { label: string; icon: ReactNode }> = {
  google: {
    label: 'Google',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8z" />
        <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8h-4v3.1A12 12 0 0 0 12 24z" />
        <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
        <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8z" />
      </svg>
    ),
  },
  github: {
    label: 'GitHub',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#181717" aria-hidden>
        <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z" />
      </svg>
    ),
  },
  linkedin: {
    label: 'LinkedIn',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <rect width="24" height="24" rx="4" fill="#0A66C2" />
        <path fill="#fff" d="M7.1 9.5H4.6V19h2.5V9.5zM5.9 5.5a1.45 1.45 0 1 0 0 2.9 1.45 1.45 0 0 0 0-2.9zM19.4 13.6c0-2.6-1.4-4.3-3.6-4.3-1.3 0-2.1.7-2.5 1.3V9.5h-2.4V19h2.5v-4.9c0-1.3.4-2.4 1.8-2.4 1.3 0 1.6 1.1 1.6 2.5V19h2.5v-5.4z" />
      </svg>
    ),
  },
  discord: {
    label: 'Discord',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#5865F2" aria-hidden>
        <path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.3a18.4 18.4 0 0 0-5.5 0L8.7 3a19.7 19.7 0 0 0-4.9 1.5C.7 9.1-.2 13.6.3 18a19.9 19.9 0 0 0 6 3l1.3-2.1a12.9 12.9 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4c-.6.4-1.3.7-2 1l1.3 2.1a19.8 19.8 0 0 0 6-3c.5-5.1-.8-9.6-3.8-13.6zM8.5 15.3c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.2 1.1 2.1 2.4c0 1.3-.9 2.4-2.1 2.4zm7 0c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.2 1.1 2.1 2.4c0 1.3-.9 2.4-2.1 2.4z" />
      </svg>
    ),
  },
  twitter: {
    label: 'X',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="#000" aria-hidden>
        <path d="M18.2 2.3h3.4l-7.4 8.4 8.7 11.5h-6.8l-5.3-7-6.1 7H1.3l7.9-9L.9 2.3h7l4.8 6.4 5.5-6.4zm-1.2 17.9h1.9L7.1 4.2H5.1L17 20.2z" />
      </svg>
    ),
  },
  facebook: {
    label: 'Facebook',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <circle cx="12" cy="12" r="12" fill="#1877F2" />
        <path fill="#fff" d="M13.4 24v-8.4h2.8l.4-3.3h-3.2v-2.1c0-.9.3-1.6 1.6-1.6h1.7V5.7c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H7.2v3.3H10V24h3.4z" />
      </svg>
    ),
  },
  dev: { label: 'Dev reader (local only)', icon: <span className="text-base">🧪</span> },
};

export type AuthCopy = {
  joinTitle: string;
  signInTitle: string;
  joinBody: string;
  signInBody: string;
  continueWith: (provider: string) => string;
  switchToSignIn: string;
  switchToJoin: string;
  haveAccount: string;
  noAccount: string;
  terms: ReactNode;
  notConfigured: string;
  error?: string;
};

export function AuthPanel({ providers, callbackUrl, copy, initialMode = 'join', reason }: {
  providers: string[];
  callbackUrl: string;
  copy: AuthCopy;
  initialMode?: 'join' | 'signin';
  reason?: string;
}) {
  const [mode, setMode] = useState<'join' | 'signin'>(initialMode);
  const [pending, setPending] = useState<string | null>(null);
  const [devName, setDevName] = useState('');

  const go = (provider: string, extra?: Record<string, string>) => {
    setPending(provider);
    signIn(provider, { callbackUrl }, extra).catch(() => setPending(null));
  };
  const social = providers.filter(p => p !== 'dev');

  return (
    <div className="mx-auto w-full max-w-[420px] text-center">
      <h1 className="font-story text-[28px] leading-9 text-[#242424] sm:text-[32px]">{mode === 'join' ? copy.joinTitle : copy.signInTitle}</h1>
      <p className="mx-auto mt-3 max-w-[340px] text-[15px] leading-6 text-[#6b6b6b]">{reason || (mode === 'join' ? copy.joinBody : copy.signInBody)}</p>

      {copy.error && <p className="mx-auto mt-5 max-w-[340px] rounded-md bg-[#fdf1f1] px-4 py-2.5 text-[13px] text-[#a33]">{copy.error}</p>}

      <div className="mt-9 flex flex-col items-center gap-3">
        {social.length === 0 && !providers.includes('dev') && <p className="text-[14px] text-[#6b6b6b]">{copy.notConfigured}</p>}
        {social.map(p => (
          <button
            key={p}
            type="button"
            disabled={!!pending}
            onClick={() => go(p)}
            className="relative flex h-11 w-full max-w-[300px] items-center justify-center rounded-full border border-[#242424] px-12 text-[15px] text-[#242424] transition-colors hover:bg-[#f9f9f9] disabled:opacity-60"
          >
            <span className="absolute left-4 flex w-6 justify-center">{pending === p ? <Loader2 className="h-5 w-5 animate-spin" /> : PROVIDER_META[p]?.icon}</span>
            {copy.continueWith(PROVIDER_META[p]?.label ?? p)}
          </button>
        ))}
        {providers.includes('dev') && (
          <form className="flex w-full max-w-[300px] gap-2" onSubmit={e => { e.preventDefault(); go('dev', { name: devName || 'Dev Reader' }); }}>
            <input value={devName} onChange={e => setDevName(e.target.value)} placeholder="Dev reader name" className="min-w-0 flex-1 rounded-full border border-dashed border-[#c4c4c4] px-4 py-2 text-sm outline-none focus:border-[#242424]" />
            <button type="submit" className="rounded-full bg-[#242424] px-4 py-2 text-sm text-white">🧪 Go</button>
          </form>
        )}
      </div>

      <p className="mt-8 text-[15px] text-[#242424]">
        {mode === 'join' ? copy.haveAccount : copy.noAccount}{' '}
        <button type="button" onClick={() => setMode(m => (m === 'join' ? 'signin' : 'join'))} className="font-bold text-[#1a8917] hover:text-[#156d12]">
          {mode === 'join' ? copy.switchToSignIn : copy.switchToJoin}
        </button>
      </p>
      <p className="mx-auto mt-10 max-w-[340px] text-[13px] leading-5 text-[#6b6b6b]">{copy.terms}</p>
    </div>
  );
}
