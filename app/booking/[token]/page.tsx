'use client';
// /booking/[token] — the guest's view of a booking: details, calendar links, cancel.
import { useEffect, useState } from 'react';
import { CalendarDays, Globe, Video, Loader2, Check, X, CalendarPlus, Download } from 'lucide-react';
import { useSite } from '@/components/site/SiteProviders';

type B = { title: string; titleFr: string; start: string; end: string; status: string; name: string; guestTimezone: string; meetLink: string | null; location: string; googleCalendar: string };

const T = {
  en: { title: 'Your meeting', cancelled: 'This meeting was cancelled.', cancel: 'Cancel meeting', reason: 'Reason (optional)', confirm: 'Yes, cancel', keep: 'Keep it', done: 'Cancelled, you’ll get a confirmation email.', rebook: 'Book another time', past: 'This meeting has already taken place.', notFound: 'Booking not found.' },
  fr: { title: 'Votre rendez-vous', cancelled: 'Ce rendez-vous a été annulé.', cancel: 'Annuler le rendez-vous', reason: 'Motif (facultatif)', confirm: 'Oui, annuler', keep: 'Le garder', done: 'Annulé, vous recevrez un e-mail de confirmation.', rebook: 'Réserver un autre créneau', past: 'Ce rendez-vous a déjà eu lieu.', notFound: 'Rendez-vous introuvable.' },
};

export default function ManageBooking({ params }: { params: { token: string } }) {
  const { locale, openBooking } = useSite();
  const t = T[locale] ?? T.en;
  const [b, setB] = useState<B | null>(null);
  const [missing, setMissing] = useState(false);
  const [asking, setAsking] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => fetch(`/api/booking/${params.token}`).then(r => (r.ok ? r.json() : Promise.reject())).then(d => setB(d.booking)).catch(() => setMissing(true));
  useEffect(() => { load(); }, [params.token]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancel = async () => {
    setBusy(true);
    await fetch(`/api/booking/${params.token}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }) });
    setBusy(false);
    setAsking(false);
    load();
  };

  const fmt = (iso: string, tz: string) => new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { timeZone: tz, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(iso));

  return (
    <main className="blog-ui mx-auto max-w-[560px] px-6 py-16">
      <h1 className="font-story text-[34px] leading-[42px] text-[#242424]">{t.title}</h1>
      {missing ? <p className="mt-6 text-[#6b6b6b]">{t.notFound}</p> : !b ? <Loader2 className="mt-8 h-6 w-6 animate-spin text-[#9b9b9b]" /> : (
        <>
          <div className="mt-8 rounded-xl border border-[#ececec] p-6">
            <p className={`text-[17px] font-medium ${b.status === 'CANCELLED' ? 'text-[#9b9b9b] line-through' : 'text-[#242424]'}`}>{(locale === 'fr' && b.titleFr) || b.title}</p>
            <ul className="mt-4 space-y-3 text-[15px] text-[#6b6b6b]">
              <li className="flex items-start gap-3"><CalendarDays className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.6} /> {fmt(b.start, b.guestTimezone)}</li>
              <li className="flex items-center gap-3"><Globe className="h-5 w-5" strokeWidth={1.6} /> {b.guestTimezone.replace(/_/g, ' ')}</li>
              <li className="flex items-center gap-3"><Video className="h-5 w-5" strokeWidth={1.6} />
                {b.meetLink ? <a href={b.meetLink} target="_blank" rel="noopener noreferrer" className="truncate text-[#1a8917] underline">{b.meetLink.replace(/^https?:\/\//, '')}</a> : b.location}
              </li>
            </ul>
          </div>

          {b.status === 'CANCELLED' ? (
            <div className="mt-6 flex flex-col items-start gap-4">
              <p className="flex items-center gap-2 text-[15px] text-[#c94a4a]"><X className="h-4 w-4" /> {t.cancelled}</p>
              <button type="button" onClick={() => openBooking()} className="rounded-full bg-[#1a8917] px-5 py-2.5 text-[14px] text-white hover:bg-[#156d12]">{t.rebook}</button>
            </div>
          ) : new Date(b.start) < new Date() ? (
            <p className="mt-6 flex items-center gap-2 text-[15px] text-[#6b6b6b]"><Check className="h-4 w-4" /> {t.past}</p>
          ) : (
            <>
              <div className="mt-6 flex flex-wrap gap-2">
                <a href={b.googleCalendar} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border border-[#242424] px-4 py-2 text-[14px] hover:bg-[#f9f9f9]"><CalendarPlus className="h-4 w-4" /> Google Calendar</a>
                <a href={`/api/booking/${params.token}/ics`} className="flex items-center gap-2 rounded-full border border-[#242424] px-4 py-2 text-[14px] hover:bg-[#f9f9f9]"><Download className="h-4 w-4" /> .ics</a>
              </div>
              {asking ? (
                <div className="mt-8 rounded-xl bg-[#fdf6f6] p-5">
                  <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder={t.reason} className="w-full resize-none rounded-lg border border-[#ecd4d4] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#c94a4a]" />
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={cancel} disabled={busy} className="flex items-center gap-2 rounded-full bg-[#c94a4a] px-4 py-2 text-[14px] text-white disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{t.confirm}</button>
                    <button type="button" onClick={() => setAsking(false)} className="rounded-full px-4 py-2 text-[14px] hover:bg-white">{t.keep}</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setAsking(true)} className="mt-8 text-[14px] text-[#c94a4a] hover:underline">{t.cancel}</button>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
