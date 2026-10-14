'use client';
// Reader session + sign-in dialog + blog locale, shared by every client component under /blog.
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { authCopy } from '@/app/signin/SignInClient';
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

function SignInDialog({ open, onClose, reason, providers, locale }: {
  open: boolean; onClose: () => void; reason?: string; providers: string[]; locale: BlogLocale;
}) {
  if (!open) return null;
  const callbackUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/blog';
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[560px] rounded-lg bg-white px-6 pb-12 pt-16 shadow-[0_2px_30px_rgba(0,0,0,0.15)] sm:px-14"
        onMouseDown={e => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1.5 text-[#6b6b6b] hover:bg-[#f2f2f2]">
          <X className="h-5 w-5" />
        </button>
        <AuthPanel providers={providers} callbackUrl={callbackUrl} copy={authCopy(locale)} reason={reason} />
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
          locale={locale}
        />
      </BlogCtx.Provider>
    </SessionProvider>
  );
}
