'use client';
// Site-wide client context: reader session (next-auth), the sign-in dialog, locale-aware blog
// strings, admin flag and the signed-in reader's account summary (writer status etc.).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { X } from 'lucide-react';
import dynamic from 'next/dynamic';

// Heavy dialogs load on first open only, not with every page.
const AuthPanel = dynamic(() => import('@/components/auth/AuthPanel').then(m => m.AuthPanel), { ssr: false });
const BookingModal = dynamic(() => import('@/components/booking/BookingModal').then(m => m.BookingModal), { ssr: false });
import { authCopy } from '@/components/auth/authCopy';
import { blogT, type BlogLocale, type BlogT } from '@/lib/blog/strings';
import { uiT, type UiT } from '@/lib/i18n/ui';
import { localizeHref } from '@/lib/i18n/config';

export type SessionReader = { id: string; name: string; image: string | null };

export type MeSummary = {
  reader: { id: string; name: string; handle: string | null; image: string | null; stripeChargesEnabled: boolean };
  writer: { isWriter: boolean; canCreate: boolean; canPublish: boolean; scope: string | null; remaining: number | null };
  request: { status: string } | null;
} | null;

type Ctx = {
  locale: BlogLocale;
  t: BlogT;
  ui: UiT;
  href: (path: string) => string;
  isAdmin: boolean;
  providers: string[];
  openSignIn: (reason?: string) => void;
  me: MeSummary;
  refreshMe: () => void;
  /** Opens the Calendly-style booking modal (optionally preselecting a meeting type slug). */
  openBooking: (type?: string) => void;
};

const SiteCtx = createContext<Ctx | null>(null);

export function useSite() {
  const ctx = useContext(SiteCtx);
  if (!ctx) throw new Error('useSite must be used inside <SiteProviders>');
  return ctx;
}
/** Back-compat name used across the blog components. */
export const useBlog = useSite;

export function useReader(): { reader: SessionReader | null; loading: boolean } {
  const { data, status } = useSession();
  const reader = (data as { reader?: SessionReader } | null)?.reader ?? null;
  return { reader, loading: status === 'loading' };
}

function SignInDialog({ open, onClose, reason, providers, locale }: {
  open: boolean; onClose: () => void; reason?: string; providers: string[]; locale: BlogLocale;
}) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  const callbackUrl = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
  return (
    <div className="blog-ui fixed inset-0 z-[100] flex items-center justify-center bg-white/80 p-4 backdrop-blur-sm" onMouseDown={onClose}>
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

function Inner({ children, locale, isAdmin, providers }: { children: ReactNode; locale: BlogLocale; isAdmin: boolean; providers: string[] }) {
  const [dialog, setDialog] = useState<{ open: boolean; reason?: string }>({ open: false });
  const [me, setMe] = useState<MeSummary>(null);
  const [booking, setBooking] = useState<{ open: boolean; type?: string }>({ open: false });
  const [bookingLoaded, setBookingLoaded] = useState(false);
  const openBooking = useCallback((type?: string) => { setBookingLoaded(true); setBooking({ open: true, type }); }, []);
  // ?book=1 (e.g. from a cancellation email) opens the booking modal.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.has('book')) openBooking(sp.get('book') && sp.get('book') !== '1' ? sp.get('book')! : undefined);
  }, [openBooking]);
  const { reader } = useReader();
  const openSignIn = useCallback((reason?: string) => setDialog({ open: true, reason }), []);

  const refreshMe = useCallback(() => {
    fetch('/api/me', { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).then(setMe).catch(() => setMe(null));
  }, []);
  useEffect(() => { if (reader) refreshMe(); else setMe(null); }, [reader?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo<Ctx>(() => ({
    locale, t: blogT(locale), ui: uiT(locale), href: (p: string) => localizeHref(p, locale),
    isAdmin, providers, openSignIn, me, refreshMe, openBooking,
  }), [locale, isAdmin, providers, openSignIn, me, refreshMe, openBooking]);

  return (
    <SiteCtx.Provider value={value}>
      {children}
      {(booking.open || bookingLoaded) && <BookingModal open={booking.open} initialType={booking.type} locale={locale} onClose={() => setBooking(b => ({ ...b, open: false }))} />}
      <SignInDialog open={dialog.open} reason={dialog.reason} onClose={() => setDialog({ open: false })} providers={providers} locale={locale} />
    </SiteCtx.Provider>
  );
}

export function SiteProviders({ children, locale, isAdmin, providers }: {
  children: ReactNode; locale: BlogLocale; isAdmin: boolean; providers: string[];
}) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <Inner locale={locale} isAdmin={isAdmin} providers={providers}>{children}</Inner>
    </SessionProvider>
  );
}
