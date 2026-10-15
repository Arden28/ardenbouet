'use client';
// Last-resort 500 when the root layout itself fails: no providers, fonts or stylesheet guarantees, so it is self-contained.
import { useEffect, useState } from 'react';

const COPY = {
  en: { eyebrow: 'Error 500', title: 'Something broke on my side.', body: 'It’s not you. The site hit an unexpected error. Try again in a moment.', retry: 'Try again', home: 'Back home', ref: 'Reference' },
  fr: { eyebrow: 'Erreur 500', title: 'Quelque chose a cassé de mon côté.', body: 'Ce n’est pas vous. Le site a rencontré une erreur inattendue. Réessayez dans un instant.', retry: 'Réessayer', home: 'Retour à l’accueil', ref: 'Référence' },
};

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [lang, setLang] = useState<'en' | 'fr'>('en');
  const [dark, setDark] = useState(false);
  useEffect(() => {
    console.error(error);
    setLang(location.pathname.startsWith('/fr') || document.cookie.includes('arden_lang=fr') ? 'fr' : 'en');
    try { setDark(localStorage.getItem('arden_theme') === 'dark' || (!localStorage.getItem('arden_theme') && matchMedia('(prefers-color-scheme: dark)').matches)); } catch { /* ignore */ }
  }, [error]);
  const t = COPY[lang];
  const ink = dark ? '#e6e6e6' : '#242424';
  const muted = dark ? '#a8a8a8' : '#6b6b6b';

  return (
    <html lang={lang}>
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: dark ? '#121212' : '#ffffff', color: ink, fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif', padding: 24 }}>
        <main style={{ maxWidth: 520 }}>
          <svg viewBox="0 0 120 80" width="120" height="80" aria-hidden style={{ display: 'block' }}>
            {[0, 1, 2].map(i => (
              <g key={i}>
                <rect x="10" y={6 + i * 24} width="100" height="18" rx="5" fill="none" stroke={ink} strokeWidth="2" />
                <circle cx="96" cy={15 + i * 24} r="3.5" fill={i === 2 ? '#c94a4a' : '#1a8917'} />
              </g>
            ))}
          </svg>
          <p style={{ marginTop: 28, fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c94a4a' }}>{t.eyebrow}</p>
          <h1 style={{ margin: '10px 0 0', fontFamily: 'Georgia, Charter, serif', fontSize: 44, lineHeight: 1.08, letterSpacing: '-0.02em' }}>{t.title}</h1>
          <p style={{ marginTop: 16, fontSize: 18, lineHeight: 1.6, color: muted }}>{t.body}</p>
          <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => reset()} style={{ border: 0, borderRadius: 999, padding: '11px 20px', fontSize: 15, fontWeight: 500, cursor: 'pointer', background: ink, color: dark ? '#121212' : '#ffffff' }}>{t.retry}</button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href={lang === 'fr' ? '/fr' : '/'} style={{ borderRadius: 999, padding: '10px 20px', fontSize: 15, color: ink, border: `1px solid ${dark ? '#4a4a4a' : '#d4d4d4'}`, textDecoration: 'none' }}>{t.home}</a>
          </div>
          {error.digest && <p style={{ marginTop: 28, fontSize: 13, color: muted, fontFamily: 'ui-monospace, monospace' }}>{t.ref} {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
