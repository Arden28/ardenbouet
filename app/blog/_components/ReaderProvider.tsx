'use client';
// Reader session + sign-in dialog + blog locale, shared by every client component under /blog.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { SessionProvider, signIn, useSession } from 'next-auth/react';
import { X } from 'lucide-react';
import { blogT, type BlogLocale, type BlogT } from '@/lib/blog/strings';

type Reader = { id: string; name: string; image: string | null };

type Ctx = {
  locale: BlogLocale;
  t: BlogT;
  isAdmin: boolean;
  providers: string[];
  openSignIn: (reason?: string) => void;
};

const BlogCtx = createContext<Ctx | null>(null);

export function useBlog() {
  const ctx = useContext(BlogCtx);
  if (!ctx) throw new Error('useBlog must be used inside <ReaderProvider>');
  return ctx;
}

export function useReader(): { reader: Reader | null; loading: boolean } {
  const { data, status } = useSession();
  const reader = (data as { reader?: Reader } | null)?.reader ?? null;
  return { reader, loading: status === 'loading' };
}

const PROVIDER_META: Record<string, { label: string; icon: ReactNode }> = {
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
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
        <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5z" />
      </svg>
    ),
  },
  dev: { label: 'Dev reader (local only)', icon: <span className="text-base">🧪</span> },
};

function SignInDialog({ open, onClose, reason, providers, t }: {
  open: boolean; onClose: () => void; reason?: string; providers: string[]; t: BlogT;
}) {
  const [devName, setDevName] = useState('');
  if (!open) return null;
  const callbackUrl = typeof window !== 'undefined' ? window.location.href : '/blog';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signin-title"
        className="relative w-full max-w-[440px] rounded-lg bg-white px-8 pb-10 pt-12 text-center shadow-[0_2px_30px_rgba(0,0,0,0.15)]"
        onMouseDown={e => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1.5 text-[#6b6b6b] hover:bg-[#f2f2f2]">
          <X className="h-5 w-5" />
        </button>
        <h2 id="signin-title" className="font-story text-[28px] leading-tight text-[#242424]">{t('signInTitle')}</h2>
        <p className="mx-auto mt-3 max-w-[320px] text-[15px] leading-6 text-[#6b6b6b]">{reason || t('signInBody')}</p>

        <div className="mt-8 flex flex-col items-center gap-3">
          {providers.length === 0 && (
            <p className="text-sm text-[#6b6b6b]">Sign-in is not configured yet.</p>
          )}
          {providers.filter(p => p !== 'dev').map(p => (
            <button
              key={p}
              type="button"
              onClick={() => signIn(p, { callbackUrl })}
              className="flex w-full max-w-[300px] items-center justify-center gap-3 rounded-full border border-[#242424] px-5 py-2.5 text-[15px] text-[#242424] transition-colors hover:bg-[#f9f9f9]"
            >
              {PROVIDER_META[p]?.icon}
              {t('continueWith', { provider: PROVIDER_META[p]?.label ?? p })}
            </button>
          ))}
          {providers.includes('dev') && (
            <form
              className="flex w-full max-w-[300px] gap-2"
              onSubmit={e => { e.preventDefault(); signIn('dev', { name: devName || 'Dev Reader', callbackUrl }); }}
            >
              <input
                value={devName}
                onChange={e => setDevName(e.target.value)}
                placeholder="Dev reader name"
                className="min-w-0 flex-1 rounded-full border border-dashed border-[#c4c4c4] px-4 py-2 text-sm outline-none focus:border-[#242424]"
              />
              <button type="submit" className="rounded-full bg-[#242424] px-4 py-2 text-sm text-white">🧪 Go</button>
            </form>
          )}
        </div>
        <p className="mx-auto mt-8 max-w-[300px] text-[13px] leading-5 text-[#6b6b6b]">{t('signInNote')}</p>
      </div>
    </div>
  );
}

export function ReaderProvider({ children, locale, isAdmin, providers }: {
  children: ReactNode; locale: BlogLocale; isAdmin: boolean; providers: string[];
}) {
  const [dialog, setDialog] = useState<{ open: boolean; reason?: string }>({ open: false });
  const openSignIn = useCallback((reason?: string) => setDialog({ open: true, reason }), []);
  const t = useMemo(() => blogT(locale), [locale]);
  const value = useMemo(() => ({ locale, t, isAdmin, providers, openSignIn }), [locale, t, isAdmin, providers, openSignIn]);

  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <BlogCtx.Provider value={value}>
        {children}
        <SignInDialog
          open={dialog.open}
          reason={dialog.reason}
          onClose={() => setDialog({ open: false })}
          providers={providers}
          t={t}
        />
      </BlogCtx.Provider>
    </SessionProvider>
  );
}
