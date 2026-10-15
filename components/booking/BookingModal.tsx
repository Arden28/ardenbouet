'use client';
// Calendly-style booking modal: host + meeting info, month calendar, time slots in the
// visitor's timezone, details form, confirmation with calendar links.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Video, Phone, MapPin, ChevronLeft, ChevronRight, Globe, ArrowLeft, Loader2, Check, CalendarPlus, Download, CalendarDays } from 'lucide-react';
import { dayKey, addDays } from '@/lib/booking/time';
import type { Locale } from '@/lib/i18n/config';

type MeetingType = { id: string; slug: string; title: string; titleFr: string; description: string; descriptionFr: string; durationMin: number; location: string; locationLabel: string };
type Info = { host: { name: string; avatar: string; timezone: string }; maxDaysAhead: number; types: MeetingType[] };
type Confirmed = { start: string; end: string; meetLink: string | null; token: string; location: string };

const T = {
  en: {
    pick: 'Select a date & time', tz: 'Time zone', noSlots: 'No times available on this day.', noMonth: 'No availability this month', nextAvailable: 'Jump to next available',
    next: 'Next', details: 'Enter details', name: 'Name', email: 'Email', notes: 'Please share anything that will help prepare for our meeting.',
    schedule: 'Schedule event', back: 'Back', scheduled: 'You are scheduled', invite: 'A calendar invitation has been sent to your email address.',
    join: 'Join link', addGoogle: 'Google Calendar', addIcs: 'Download .ics', manage: 'Need to cancel? Use the link in your confirmation email.',
    minutes: '{n} min', loading: 'Loading availability…', unavailable: 'Booking is temporarily unavailable.',
  },
  fr: {
    pick: 'Choisissez une date et une heure', tz: 'Fuseau horaire', noSlots: 'Aucun créneau disponible ce jour-là.', noMonth: 'Aucune disponibilité ce mois-ci', nextAvailable: 'Aller à la prochaine disponibilité',
    next: 'Suivant', details: 'Vos informations', name: 'Nom', email: 'E-mail', notes: 'Partagez ce qui m’aidera à préparer notre échange.',
    schedule: 'Confirmer le rendez-vous', back: 'Retour', scheduled: 'C’est réservé', invite: 'Une invitation a été envoyée à votre adresse e-mail.',
    join: 'Lien de la réunion', addGoogle: 'Google Agenda', addIcs: 'Télécharger .ics', manage: 'Besoin d’annuler ? Utilisez le lien dans l’e-mail de confirmation.',
    minutes: '{n} min', loading: 'Chargement des disponibilités…', unavailable: 'La réservation est momentanément indisponible.',
  },
};

const LocationIcon = ({ location, className = 'h-5 w-5' }: { location: string; className?: string }) =>
  location === 'PHONE' ? <Phone className={className} strokeWidth={1.6} /> : location === 'IN_PERSON' ? <MapPin className={className} strokeWidth={1.6} /> : <Video className={className} strokeWidth={1.6} />;

function guessTz() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
}
function allTimeZones(): string[] {
  try { return (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf('timeZone'); } catch { return ['UTC', 'Africa/Nairobi', 'Europe/Paris', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Dubai']; }
}
function tzLabel(tz: string, locale: Locale) {
  try {
    const name = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value ?? '';
    const time = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(new Date());
    return `${tz.replace(/_/g, ' ')} (${name}) · ${time}`;
  } catch { return tz; }
}

const monthStart = (day: string) => `${day.slice(0, 7)}-01`;
const addMonths = (month: string, n: number) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 10);
};

export function BookingModal({ open, onClose, locale, initialType }: { open: boolean; onClose: () => void; locale: Locale; initialType?: string }) {
  const t = T[locale] ?? T.en;
  const fmtLocale = locale === 'fr' ? 'fr-FR' : 'en-US';
  const [info, setInfo] = useState<Info | null>(null);
  const [failed, setFailed] = useState(false);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [tz, setTz] = useState(guessTz);
  const today = useMemo(() => dayKey(new Date(), tz), [tz]);
  const [month, setMonth] = useState(() => monthStart(dayKey(new Date(), guessTz())));
  const [slots, setSlots] = useState<Record<string, string[]>>({}); // owner-day → ISO
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [day, setDay] = useState<string | null>(null); // guest-local day
  const [time, setTime] = useState<string | null>(null); // ISO
  const [step, setStep] = useState<'pick' | 'details' | 'done'>('pick');
  const [form, setForm] = useState({ name: '', email: '', notes: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Load host + meeting types once
  useEffect(() => {
    if (!open || info) return;
    fetch('/api/booking').then(r => (r.ok ? r.json() : Promise.reject())).then((d: Info) => {
      setInfo(d);
      setTypeId((initialType && d.types.find(x => x.slug === initialType || x.id === initialType)?.id) || d.types[0]?.id || null);
    }).catch(() => setFailed(true));
  }, [open, info, initialType]);

  // Reset when the modal closes
  useEffect(() => {
    if (open) return;
    const id = setTimeout(() => { setStep('pick'); setDay(null); setTime(null); setConfirmed(null); setError(''); }, 250);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    setTimeout(() => dialogRef.current?.focus(), 0);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', k); };
  }, [open, onClose]);

  // Fetch the visible month (+ a day each side for timezone overlap)
  const loadMonth = useCallback(async (m: string, type: string) => {
    const key = `${type}:${m}`;
    if (loaded.has(key)) return;
    setLoading(true);
    try {
      const from = addDays(m, -1);
      const to = addDays(addMonths(m, 1), 1);
      const res = await fetch(`/api/booking/slots?type=${type}&from=${from}&to=${to}`);
      const d = await res.json();
      setSlots(s => ({ ...s, ...d.days }));
      setLoaded(l => new Set(l).add(key));
    } finally { setLoading(false); }
  }, [loaded]);

  useEffect(() => { if (open && typeId) loadMonth(month, typeId); }, [open, typeId, month, loadMonth]);
  useEffect(() => { setSlots({}); setLoaded(new Set()); setDay(null); setTime(null); }, [typeId]);

  // Regroup slots by the guest's local day
  const byDay = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const iso of Object.values(slots).flat()) {
      const k = dayKey(new Date(iso), tz);
      (out[k] ??= []).push(iso);
    }
    for (const k of Object.keys(out)) out[k] = Array.from(new Set(out[k])).sort();
    return out;
  }, [slots, tz]);

  const type = info?.types.find(x => x.id === typeId) ?? null;
  const title = type ? (locale === 'fr' && type.titleFr ? type.titleFr : type.title) : '';
  const description = type ? (locale === 'fr' && type.descriptionFr ? type.descriptionFr : type.description) : '';
  const lastDay = info ? addDays(today, info.maxDaysAhead) : today;

  // Calendar grid (weeks start Monday)
  const grid = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const first = new Date(Date.UTC(y, m - 1, 1));
    const lead = (first.getUTCDay() + 6) % 7;
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const cells: (string | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= days; d++) cells.push(`${month.slice(0, 8)}${String(d).padStart(2, '0')}`);
    return cells;
  }, [month]);
  const weekdays = useMemo(() => Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(fmtLocale, { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 1 + i))).toUpperCase()), [fmtLocale]);
  const monthLabel = new Intl.DateTimeFormat(fmtLocale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}T12:00:00Z`));
  const monthHasSlots = grid.some(d => d && byDay[d]?.length);
  const nextAvailable = Object.keys(byDay).filter(d => d >= today).sort()[0];

  const fmtTime = (iso: string) => new Intl.DateTimeFormat(fmtLocale, { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(new Date(iso));
  const fmtDayLong = (d: string) => new Intl.DateTimeFormat(fmtLocale, { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${d}T12:00:00Z`));
  const fmtRange = (iso: string) => {
    const start = new Date(iso);
    const end = new Date(start.getTime() + (type?.durationMin ?? 30) * 60_000);
    const time = (d: Date) => new Intl.DateTimeFormat(fmtLocale, { hour: 'numeric', minute: '2-digit', timeZone: tz }).format(d);
    return `${time(start)} – ${time(end)}, ${new Intl.DateTimeFormat(fmtLocale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: tz }).format(start)}`;
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!type || !time) return;
    setBusy(true);
    setError('');
    const website = (new FormData(e.currentTarget).get('website') as string) || '';
    const res = await fetch('/api/booking', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ typeId: type.id, start: time, ...form, timezone: tz, locale, website }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(d.error || 'Something went wrong');
      if (res.status === 409 && typeId) { setLoaded(new Set()); setSlots({}); loadMonth(month, typeId); setStep('pick'); setTime(null); }
      return;
    }
    setConfirmed(d.booking);
    setStep('done');
  };

  if (!open || typeof document === 'undefined') return null;

  const hostPanel = info && type && (
    <div className="border-b border-[#ececec] p-6 md:w-[300px] md:shrink-0 md:border-b-0 md:border-r md:p-8">
      {step === 'details' && (
        <button type="button" onClick={() => setStep('pick')} className="mb-5 flex h-10 w-10 items-center justify-center rounded-full border border-[#e6e6e6] text-[#1a8917] hover:bg-[#f6fbf6]" aria-label={t.back}>
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={info.host.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
      <p className="mt-4 text-[14px] font-medium text-[#6b6b6b]">{info.host.name}</p>
      <h2 className="mt-1 font-story text-[26px] leading-8 text-[#242424]">{title}</h2>
      <ul className="mt-5 space-y-3 text-[14px] text-[#6b6b6b]">
        <li className="flex items-center gap-3"><Clock className="h-5 w-5" strokeWidth={1.6} /> {t.minutes.replace('{n}', String(type.durationMin))}</li>
        <li className="flex items-center gap-3"><LocationIcon location={type.location} /> {type.locationLabel}</li>
        {time && (
          <li className="flex items-start gap-3 font-medium text-[#1a6b17]"><CalendarDays className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.6} /> {fmtRange(time)}</li>
        )}
        {time && <li className="flex items-center gap-3"><Globe className="h-5 w-5" strokeWidth={1.6} /> {tz.replace(/_/g, ' ')}</li>}
      </ul>
      {description && step !== 'done' && <p className="mt-5 text-[14px] leading-[22px] text-[#6b6b6b]">{description}</p>}
      {info.types.length > 1 && step === 'pick' && (
        <div className="mt-6 flex flex-wrap gap-2">
          {info.types.map(x => (
            <button key={x.id} type="button" onClick={() => setTypeId(x.id)}
              className={`rounded-full px-3 py-1.5 text-[13px] ${x.id === typeId ? 'bg-[#242424] text-white' : 'border border-[#e6e6e6] text-[#242424] hover:border-[#242424]'}`}>
              {(locale === 'fr' && x.titleFr) || x.title} · {x.durationMin}′
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return createPortal(
    <div className="blog-ui fixed inset-0 z-[300] flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Book a meeting'}
        onMouseDown={e => e.stopPropagation()}
        className="relative flex max-h-[94vh] w-full max-w-[1060px] flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.25)] outline-none sm:rounded-2xl md:flex-row"
      >
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 z-10 rounded-full p-2 text-[#6b6b6b] hover:bg-[#f2f2f2]"><X className="h-5 w-5" /></button>

        {failed ? (
          <p className="w-full p-16 text-center text-[15px] text-[#6b6b6b]">{t.unavailable}</p>
        ) : !info || !type ? (
          <div className="flex w-full items-center justify-center p-24"><Loader2 className="h-6 w-6 animate-spin text-[#9b9b9b]" /></div>
        ) : step === 'done' && confirmed ? (
          <div className="w-full overflow-y-auto p-8 text-center sm:p-14">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef7ee]"><Check className="h-8 w-8 text-[#1a8917]" /></span>
            <h2 className="mt-6 font-story text-[32px] leading-10 text-[#242424]">{t.scheduled}</h2>
            <p className="mt-2 text-[15px] text-[#6b6b6b]">{t.invite}</p>
            <div className="mx-auto mt-8 max-w-[420px] rounded-xl border border-[#ececec] p-6 text-left">
              <p className="font-medium text-[#242424]">{title}</p>
              <ul className="mt-3 space-y-2.5 text-[14px] text-[#6b6b6b]">
                <li className="flex items-start gap-3"><CalendarDays className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.6} /> {fmtRange(confirmed.start)}</li>
                <li className="flex items-center gap-3"><Globe className="h-5 w-5" strokeWidth={1.6} /> {tz.replace(/_/g, ' ')}</li>
                <li className="flex items-center gap-3"><LocationIcon location={type.location} />
                  {confirmed.meetLink ? <a href={confirmed.meetLink} target="_blank" rel="noopener noreferrer" className="truncate text-[#1a8917] underline">{confirmed.meetLink.replace(/^https?:\/\//, '')}</a> : confirmed.location}
                </li>
              </ul>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <a href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`${title} — ${info.host.name}`)}&dates=${new Date(confirmed.start).toISOString().replace(/[-:]|\.\d{3}/g, '')}/${new Date(confirmed.end).toISOString().replace(/[-:]|\.\d{3}/g, '')}${confirmed.meetLink ? `&location=${encodeURIComponent(confirmed.meetLink)}` : ''}`}
                target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-full border border-[#242424] px-4 py-2 text-[14px] hover:bg-[#f9f9f9]">
                <CalendarPlus className="h-4 w-4" /> {t.addGoogle}
              </a>
              <a href={`/api/booking/${confirmed.token}/ics`} className="flex items-center gap-2 rounded-full border border-[#242424] px-4 py-2 text-[14px] hover:bg-[#f9f9f9]">
                <Download className="h-4 w-4" /> {t.addIcs}
              </a>
            </div>
            <p className="mt-8 text-[13px] text-[#9b9b9b]">{t.manage}</p>
          </div>
        ) : (
          <>
            {hostPanel}
            {step === 'pick' ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row">
                {/* Calendar */}
                <div className="flex-1 p-6 md:p-8">
                  <h3 className="text-[19px] font-bold text-[#242424]">{t.pick}</h3>
                  <div className="mt-6 flex items-center justify-between">
                    <button type="button" onClick={() => setMonth(addMonths(month, -1))} disabled={month <= monthStart(today)} aria-label="Previous month"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[#1a8917] hover:bg-[#eef7ee] disabled:text-[#d4d4d4] disabled:hover:bg-transparent"><ChevronLeft className="h-5 w-5" /></button>
                    <span className="text-[15px] capitalize text-[#242424]">{monthLabel}</span>
                    <button type="button" onClick={() => setMonth(addMonths(month, 1))} disabled={addMonths(month, 1) > lastDay} aria-label="Next month"
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[#1a8917] hover:bg-[#eef7ee] disabled:text-[#d4d4d4] disabled:hover:bg-transparent"><ChevronRight className="h-5 w-5" /></button>
                  </div>
                  <div className="mt-4 grid grid-cols-7 gap-y-2 text-center">
                    {weekdays.map(w => <span key={w} className="pb-2 text-[11px] font-medium tracking-wider text-[#6b6b6b]">{w}</span>)}
                    {grid.map((d, i) => {
                      if (!d) return <span key={`e${i}`} />;
                      const has = !!byDay[d]?.length;
                      const selected = d === day;
                      const isToday = d === today;
                      return (
                        <div key={d} className="flex justify-center">
                          <button
                            type="button"
                            disabled={!has}
                            onClick={() => { setDay(d); setTime(null); }}
                            aria-pressed={selected}
                            aria-label={fmtDayLong(d)}
                            className={`relative flex h-11 w-11 items-center justify-center rounded-full text-[15px] transition-colors ${
                              selected ? 'bg-[#1a8917] font-bold text-white'
                              : has ? 'bg-[#eef7ee] font-bold text-[#1a6b17] hover:bg-[#dcefdc]'
                              : 'text-[#c4c4c4]'
                            }`}
                          >
                            {Number(d.slice(8))}
                            {isToday && <span className={`absolute bottom-1.5 h-1 w-1 rounded-full ${selected ? 'bg-white' : 'bg-[#242424]'}`} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {loading && <p className="mt-4 flex items-center gap-2 text-[13px] text-[#9b9b9b]"><Loader2 className="h-3.5 w-3.5 animate-spin" /> {t.loading}</p>}
                  {!loading && !monthHasSlots && (
                    <div className="mt-6 rounded-lg bg-[#f9f9f9] p-4 text-center text-[14px] text-[#6b6b6b]">
                      {t.noMonth}
                      {nextAvailable && nextAvailable > `${month.slice(0, 7)}-31` && (
                        <button type="button" onClick={() => { setMonth(monthStart(nextAvailable)); setDay(nextAvailable); }} className="mt-2 block w-full font-medium text-[#1a8917] hover:underline">{t.nextAvailable} →</button>
                      )}
                    </div>
                  )}
                  <label className="mt-8 block">
                    <span className="text-[13px] font-medium text-[#242424]">{t.tz}</span>
                    <span className="mt-2 flex items-center gap-2 text-[14px] text-[#6b6b6b]">
                      <Globe className="h-4 w-4 shrink-0" />
                      <select value={tz} onChange={e => { setTz(e.target.value); setDay(null); setTime(null); }} className="min-w-0 flex-1 cursor-pointer truncate bg-transparent outline-none">
                        {allTimeZones().map(z => <option key={z} value={z}>{tzLabel(z, locale)}</option>)}
                      </select>
                    </span>
                  </label>
                </div>

                {/* Times */}
                {day && (
                  <div className="border-t border-[#ececec] p-6 md:w-[240px] md:shrink-0 md:border-l md:border-t-0 md:px-5 md:py-8">
                    <p className="text-[15px] text-[#242424]">{fmtDayLong(day)}</p>
                    <div className="thin-scroll mt-5 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                      {(byDay[day] ?? []).length === 0 && <p className="text-[14px] text-[#6b6b6b]">{t.noSlots}</p>}
                      {(byDay[day] ?? []).map(iso => (
                        time === iso ? (
                          <div key={iso} className="grid grid-cols-2 gap-2">
                            <span className="flex h-12 items-center justify-center rounded-lg bg-[#5b5b5b] text-[15px] font-semibold text-white">{fmtTime(iso)}</span>
                            <button type="button" onClick={() => setStep('details')} className="h-12 rounded-lg bg-[#1a8917] text-[15px] font-semibold text-white hover:bg-[#156d12]">{t.next}</button>
                          </div>
                        ) : (
                          <button key={iso} type="button" onClick={() => setTime(iso)}
                            className="h-12 w-full rounded-lg border border-[#1a8917]/40 text-[15px] font-semibold text-[#1a8917] transition-colors hover:border-[#1a8917] hover:border-2">
                            {fmtTime(iso)}
                          </button>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={submit} className="flex-1 overflow-y-auto p-6 md:p-8">
                <h3 className="text-[19px] font-bold text-[#242424]">{t.details}</h3>
                <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
                <label className="mt-6 block">
                  <span className="text-[14px] font-medium text-[#242424]">{t.name} *</span>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoComplete="name"
                    className="mt-2 w-full rounded-lg border border-[#d4d4d4] px-3.5 py-3 text-[15px] outline-none focus:border-[#1a8917] focus:ring-1 focus:ring-[#1a8917]" />
                </label>
                <label className="mt-5 block">
                  <span className="text-[14px] font-medium text-[#242424]">{t.email} *</span>
                  <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} autoComplete="email"
                    className="mt-2 w-full rounded-lg border border-[#d4d4d4] px-3.5 py-3 text-[15px] outline-none focus:border-[#1a8917] focus:ring-1 focus:ring-[#1a8917]" />
                </label>
                <label className="mt-5 block">
                  <span className="text-[14px] font-medium text-[#242424]">{t.notes}</span>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={4} maxLength={2000}
                    className="mt-2 w-full resize-none rounded-lg border border-[#d4d4d4] px-3.5 py-3 text-[15px] outline-none focus:border-[#1a8917] focus:ring-1 focus:ring-[#1a8917]" />
                </label>
                {error && <p className="mt-4 text-[14px] text-[#c94a4a]">{error}</p>}
                <button type="submit" disabled={busy} className="mt-6 flex items-center gap-2 rounded-full bg-[#1a8917] px-6 py-3 text-[15px] font-semibold text-white hover:bg-[#156d12] disabled:opacity-60">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}{t.schedule}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
