'use client';
// Home presentation: editorial intro, booking card with live next slots, profile buttons, portrait.
import { useEffect, useState } from 'react';
import { ArrowUpRight, CalendarDays, Clock, Video, ArrowDown } from 'lucide-react';
import { useSite } from '@/components/site/SiteProviders';
import { GitHubMark, LinkedInMark, UpworkMark } from '@/components/site/BrandIcons';
import { OWNER, PROFILES } from '@/lib/site';
import { dayKey } from '@/lib/booking/time';

type Slot = string;

function useLocalTime(tz: string, locale: string) {
  const [now, setNow] = useState<string>('');
  useEffect(() => {
    const fmt = () => setNow(new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(new Date()));
    fmt();
    const id = setInterval(fmt, 30_000);
    return () => clearInterval(id);
  }, [tz, locale]);
  return now;
}

function useNextSlots() {
  const [state, setState] = useState<{ type: { id: string; durationMin: number; locationLabel: string } | null; slots: Slot[]; loading: boolean }>({ type: null, slots: [], loading: true });
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const info = await fetch('/api/booking').then(r => r.json());
        const type = info.types?.[0];
        if (!type) { if (alive) setState({ type: null, slots: [], loading: false }); return; }
        const d = await fetch(`/api/booking/slots?type=${type.id}`).then(r => r.json());
        const all: Slot[] = Object.values(d.days ?? {}).flat() as Slot[];
        // one per day, first three days
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const seen = new Set<string>();
        const picks = all.sort().filter(s => { const k = dayKey(new Date(s), tz); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 3);
        if (alive) setState({ type, slots: picks, loading: false });
      } catch { if (alive) setState(s => ({ ...s, loading: false })); }
    })();
    return () => { alive = false; };
  }, []);
  return state;
}

const PROFILE_LINKS = [
  { key: 'github', href: PROFILES.github, label: 'GitHub', sub: 'home.github', handle: 'arden28', Icon: GitHubMark, hover: 'group-hover:bg-[#181717] group-hover:text-white' },
  { key: 'linkedin', href: PROFILES.linkedin, label: 'LinkedIn', sub: 'home.linkedin', handle: 'arden-bouet', Icon: LinkedInMark, hover: 'group-hover:bg-[#0a66c2] group-hover:text-white' },
  { key: 'upwork', href: PROFILES.upwork, label: 'Upwork', sub: 'home.upwork', handle: 'Arden B.', Icon: UpworkMark, hover: 'group-hover:bg-[#14a800] group-hover:text-white' },
] as const;

export function Hero({ focus }: { focus: string[] }) {
  const { ui, locale, openBooking, href } = useSite();
  const localTime = useLocalTime(OWNER.timezone, locale);
  const { type, slots, loading } = useNextSlots();
  const fmtLocale = locale === 'fr' ? 'fr-FR' : 'en-US';
  const slotLabel = (iso: string) => {
    const d = new Date(iso);
    return {
      day: new Intl.DateTimeFormat(fmtLocale, { weekday: 'short', day: 'numeric' }).format(d),
      time: new Intl.DateTimeFormat(fmtLocale, { hour: 'numeric', minute: '2-digit' }).format(d),
    };
  };

  return (
    <section aria-labelledby="hero-title" className="mx-auto max-w-[1192px] px-6 pb-16 pt-10 sm:pt-16 lg:pb-24 lg:pt-20">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-20">
        {/* ── Copy ─────────────────────────────────────────────── */}
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-[#6b6b6b]">
            <span className="flex items-center gap-2 text-[#1a6b17]">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1a8917] opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#1a8917]" /></span>
              {ui('home.available')}
            </span>
            <span aria-hidden className="text-[#d4d4d4]">/</span>
            <span>{ui('home.eyebrow')}</span>
          </p>

          <h1 id="hero-title" className="mt-7 max-w-[760px] font-story text-[44px] font-normal leading-[1.05] tracking-[-0.025em] text-[#242424] sm:text-[60px] lg:text-[72px]">
            {ui('home.headline')}
          </h1>
          <p className="mt-6 max-w-[620px] font-story text-[21px] leading-[1.5] text-[#6b6b6b] sm:text-[23px]">{ui('home.headlineSub')}</p>
          <p className="mt-5 max-w-[600px] text-[16px] leading-[1.7] text-[#242424]/80">{ui('home.lead')}</p>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <button type="button" onClick={() => openBooking()} className="group flex items-center gap-2.5 rounded-full bg-[#242424] py-3 pl-5 pr-6 text-[15px] font-medium text-white transition-colors hover:bg-black">
              <CalendarDays className="h-[18px] w-[18px]" strokeWidth={1.8} /> {ui('home.book.cta')}
            </button>
            <a href={href('/#work')} className="flex items-center gap-2 text-[15px] text-[#242424] underline decoration-[#d4d4d4] underline-offset-[6px] transition-colors hover:decoration-[#242424]">
              {ui('home.work.title')} <ArrowDown className="h-4 w-4" />
            </a>
          </div>

          {/* Profiles */}
          <div className="mt-14">
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#9b9b9b]">{ui('home.profiles')}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {PROFILE_LINKS.map(({ key, href: link, label, sub, handle, Icon, hover }) => (
                <a key={key} href={link} target="_blank" rel="noopener noreferrer me"
                  className="group flex items-center gap-3.5 rounded-2xl border border-[#ececec] bg-white p-3.5 pr-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#242424] hover:shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f4f4f4] text-[#242424] transition-colors duration-200 ${hover}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-[15px] font-semibold text-[#242424]">{label}<ArrowUpRight className="h-3.5 w-3.5 text-[#9b9b9b] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#242424]" /></span>
                    <span className="block truncate text-[13px] text-[#6b6b6b]">{ui(sub)}</span>
                    <span className="sr-only">{handle}</span>
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Portrait + booking ──────────────────────────────── */}
        <div className="relative mx-auto w-full max-w-[400px] lg:mx-0">
          <figure className="relative overflow-hidden rounded-[28px] bg-[#f2f2f2]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={OWNER.avatar} alt={OWNER.fullName} className="aspect-[4/5] w-full object-cover" />
            <figcaption className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[12px] text-[#242424] shadow-sm backdrop-blur">
              <Clock className="h-3.5 w-3.5 text-[#6b6b6b]" /> {localTime ? ui('home.localTime', { time: localTime }) : OWNER.location}
            </figcaption>
          </figure>

          <div className="relative -mt-10 mx-4 rounded-2xl border border-[#ececec] bg-white p-5 shadow-[0_18px_50px_rgba(0,0,0,0.10)] sm:mx-6">
            <p className="text-[15px] font-semibold text-[#242424]">{ui('home.book.title', { n: type?.durationMin ?? 30 })}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-[#6b6b6b]"><Video className="h-3.5 w-3.5" /> {ui('home.book.meta', { location: type?.locationLabel ?? 'Google Meet' })}</p>
            <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.1em] text-[#9b9b9b]">{ui('home.book.next')}</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {loading
                ? [0, 1, 2].map(i => <span key={i} className="h-[54px] animate-pulse rounded-xl bg-[#f4f4f4]" />)
                : slots.length
                  ? slots.map(s => {
                      const l = slotLabel(s);
                      return (
                        <button key={s} type="button" onClick={() => openBooking()} className="flex flex-col items-center rounded-xl border border-[#1a8917]/30 py-2 transition-colors hover:border-[#1a8917] hover:bg-[#f3faf3]">
                          <span className="text-[11px] capitalize text-[#6b6b6b]">{l.day}</span>
                          <span className="text-[14px] font-semibold text-[#1a6b17]">{l.time}</span>
                        </button>
                      );
                    })
                  : <p className="col-span-3 text-[13px] text-[#6b6b6b]">{ui('home.book.none')}</p>}
            </div>
            <button type="button" onClick={() => openBooking()} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#1a8917] py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#156d12]">
              {ui('home.book.all')} <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {focus.length > 0 && (
        <div className="mt-16 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-[#f2f2f2] pt-6 lg:mt-20">
          <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#9b9b9b]">{ui('home.focus')}</span>
          {focus.map((f, i) => (
            <span key={f} className="flex items-center gap-6 font-story text-[19px] text-[#242424]">
              {f}{i < focus.length - 1 && <span aria-hidden className="text-[#d4d4d4]">·</span>}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
