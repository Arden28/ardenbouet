'use client';
// /me/settings — language, data export, account deletion
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { Download, Loader2 } from 'lucide-react';
import { useSite } from '@/components/site/SiteProviders';
import { LOCALES, LOCALE_LABELS, localizeHref, type Locale } from '@/lib/i18n/config';

export default function SettingsPage() {
  const { ui, locale } = useSite();
  const [handle, setHandle] = useState<string | null>(null);
  const [lang, setLang] = useState<Locale>(locale);
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/me', { cache: 'no-store' }).then(r => r.json()).then(d => { setHandle(d.reader.handle ?? d.reader.name); setLang(d.reader.locale ?? locale); });
  }, [locale]);

  const changeLang = async (l: Locale) => {
    setLang(l);
    await fetch('/api/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ locale: l }) });
    if (l !== locale) window.location.assign(localizeHref('/me/settings', l) + (l === 'en' ? '?lang=en' : ''));
  };

  const del = async () => {
    setBusy(true);
    setError('');
    const res = await fetch('/api/me', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm }) });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setBusy(false); setError(d.error || 'Could not delete'); return; }
    await signOut({ callbackUrl: localizeHref('/', locale) });
  };

  const row = 'flex flex-col gap-3 border-b border-[#f2f2f2] py-7 sm:flex-row sm:items-center sm:justify-between';
  return (
    <div>
      <h1 className="text-[32px] font-bold tracking-[-0.02em] text-[#242424] sm:text-[42px]">{ui('me.settings')}</h1>

      <section className={`${row} mt-6`}>
        <div>
          <h2 className="text-[15px] text-[#242424]">{ui('me.set.language')}</h2>
          <p className="mt-1 text-[13px] text-[#6b6b6b]">{ui('me.set.languageHint')}</p>
        </div>
        <div className="flex gap-1.5">
          {LOCALES.map(l => (
            <button key={l} type="button" onClick={() => changeLang(l)} className={`rounded-full px-4 py-1.5 text-[14px] ${lang === l ? 'bg-[#242424] text-white' : 'border border-[#e6e6e6] text-[#242424] hover:border-[#242424]'}`}>
              {LOCALE_LABELS[l].name}
            </button>
          ))}
        </div>
      </section>

      <section className={row}>
        <div>
          <h2 className="text-[15px] text-[#242424]">{ui('me.set.export')}</h2>
          <p className="mt-1 text-[13px] text-[#6b6b6b]">{ui('me.set.exportHint')}</p>
        </div>
        <a href="/api/me/export" className="flex items-center gap-2 self-start rounded-full border border-[#242424] px-4 py-1.5 text-[14px] text-[#242424] hover:bg-[#f9f9f9] sm:self-auto">
          <Download className="h-4 w-4" /> JSON
        </a>
      </section>

      <section className="py-7">
        <h2 className="text-[15px] text-[#c94a4a]">{ui('me.set.delete')}</h2>
        <p className="mt-1 max-w-[520px] text-[13px] leading-5 text-[#6b6b6b]">{ui('me.set.deleteHint')}</p>
        {handle && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder={ui('me.set.deleteConfirm', { handle })}
              className="min-w-0 flex-1 rounded-full border border-[#e6e6e6] px-4 py-2 text-[14px] outline-none focus:border-[#c94a4a]" />
            <button type="button" onClick={del} disabled={confirm !== handle || busy}
              className="flex items-center justify-center gap-2 rounded-full bg-[#c94a4a] px-5 py-2 text-[14px] text-white disabled:opacity-40">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}{ui('me.set.deleteButton')}
            </button>
          </div>
        )}
        {error && <p className="mt-2 text-[13px] text-[#c94a4a]">{error}</p>}
      </section>
    </div>
  );
}
