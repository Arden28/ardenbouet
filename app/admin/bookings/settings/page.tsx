'use client';
// /admin/bookings/settings — weekly availability, limits, meeting types, Google Calendar
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Plus, Trash2, Check, CalendarCheck, AlertCircle } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import '@/app/blog/story.css';

type Rule = { day: number; start: string; end: string };
type Type = { id: string; slug: string; title: string; titleFr: string; description: string; descriptionFr: string; durationMin: number; bufferMin: number; location: string; locationDetail: string; active: boolean; _count: { bookings: number } };
type Data = {
  config: { timezone: string; rules: Rule[]; minNoticeMin: number; maxDaysAhead: number; slotStepMin: number; googleCalendarId: string };
  google: { configured: boolean; connected: boolean; email: string | null };
  types: Type[];
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORDER = [1, 2, 3, 4, 5, 6, 0];
const input = 'rounded-md border border-[#e6e6e6] px-2.5 py-1.5 text-[14px] outline-none focus:border-[#242424]';

function zones(): string[] {
  try { return (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf('timeZone'); } catch { return ['Africa/Nairobi', 'UTC']; }
}

function TypeCard({ t, onSaved }: { t: Type; onSaved: () => void }) {
  const [d, setD] = useState(t);
  const [busy, setBusy] = useState(false);
  const dirty = JSON.stringify(d) !== JSON.stringify(t);
  const save = async () => {
    setBusy(true);
    await fetch('/api/admin/booking/types', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
    setBusy(false);
    onSaved();
  };
  const remove = async () => {
    if (!confirm(`Delete “${t.title}”?${t._count.bookings ? ' It has bookings, so it will be deactivated instead.' : ''}`)) return;
    await fetch('/api/admin/booking/types', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: t.id }) });
    onSaved();
  };
  return (
    <div className={`rounded-xl border bg-white p-5 ${d.active ? 'border-[#f2f2f2]' : 'border-dashed border-[#e6e6e6] opacity-70'}`}>
      <div className="grid gap-3 sm:grid-cols-2">
        <input value={d.title} onChange={e => setD({ ...d, title: e.target.value })} placeholder="Title (EN)" className={`${input} font-medium`} />
        <input value={d.titleFr} onChange={e => setD({ ...d, titleFr: e.target.value })} placeholder="Titre (FR)" className={input} />
        <textarea value={d.description} onChange={e => setD({ ...d, description: e.target.value })} rows={2} placeholder="Description (EN)" className={input} />
        <textarea value={d.descriptionFr} onChange={e => setD({ ...d, descriptionFr: e.target.value })} rows={2} placeholder="Description (FR)" className={input} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[14px] text-[#242424]">
        <label className="flex items-center gap-2">Duration <input type="number" min={5} step={5} value={d.durationMin} onChange={e => setD({ ...d, durationMin: Number(e.target.value) })} className={`${input} w-20`} /> min</label>
        <label className="flex items-center gap-2">Buffer <input type="number" min={0} step={5} value={d.bufferMin} onChange={e => setD({ ...d, bufferMin: Number(e.target.value) })} className={`${input} w-20`} /> min</label>
        <select value={d.location} onChange={e => setD({ ...d, location: e.target.value })} className={input}>
          <option value="GOOGLE_MEET">Google Meet (auto link)</option><option value="CUSTOM_LINK">Custom video link</option><option value="PHONE">Phone call</option><option value="IN_PERSON">In person</option>
        </select>
        {(d.location === 'CUSTOM_LINK' || d.location === 'IN_PERSON' || d.location === 'PHONE') && (
          <input value={d.locationDetail} onChange={e => setD({ ...d, locationDetail: e.target.value })} placeholder={d.location === 'CUSTOM_LINK' ? 'https://zoom.us/j/…' : d.location === 'PHONE' ? 'Number or “I’ll call you”' : 'Address'} className={`${input} min-w-[220px] flex-1`} />
        )}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <label className="flex items-center gap-2 text-[14px]"><input type="checkbox" checked={d.active} onChange={e => setD({ ...d, active: e.target.checked })} className="accent-[#1a8917]" /> Bookable</label>
        <span className="text-[12px] text-[#9b9b9b]">{t._count.bookings} bookings · ?book={t.slug}</span>
        <button type="button" onClick={remove} className="ml-auto rounded p-1.5 text-[#9b9b9b] hover:text-[#c94a4a]" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
        <button type="button" onClick={save} disabled={!dirty || busy} className="flex items-center gap-2 rounded-full bg-[#242424] px-4 py-1.5 text-[13px] text-white disabled:opacity-30">{busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Save</button>
      </div>
    </div>
  );
}

function Settings() {
  const googleStatus = useSearchParams().get('google');
  const [data, setData] = useState<Data | null>(null);
  const [cfg, setCfg] = useState<Data['config'] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = () => fetch('/api/admin/booking/config').then(r => r.json()).then((d: Data) => { setData(d); setCfg(d.config); });
  useEffect(() => { load(); }, []);

  const save = async (patch: Partial<Data['config']> & { disconnectGoogle?: boolean } = cfg!) => {
    setSaving(true);
    const res = await fetch('/api/admin/booking/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    const d = await res.json();
    setSaving(false);
    if (!res.ok) { alert(d.error); return; }
    setData(d); setCfg(d.config); setSaved(true); setTimeout(() => setSaved(false), 1500);
  };
  const addType = async () => {
    await fetch('/api/admin/booking/types', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New meeting', durationMin: 30 }) });
    load();
  };

  if (!data || !cfg) return <AdminShell title="Booking settings"><div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#9b9b9b]" /></div></AdminShell>;
  const rulesFor = (day: number) => cfg.rules.filter(r => r.day === day);
  const setRules = (rules: Rule[]) => setCfg({ ...cfg, rules });

  return (
    <AdminShell title="Booking settings">
      <div className="mx-auto max-w-[900px] space-y-10">
        {/* Google */}
        <section className="rounded-xl border border-[#f2f2f2] bg-white p-5">
          <div className="flex flex-wrap items-center gap-4">
            <CalendarCheck className="h-8 w-8 text-[#1a73e8]" strokeWidth={1.4} />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium text-[#242424]">Google Calendar</p>
              <p className="text-[13px] text-[#6b6b6b]">
                {data.google.connected ? `Connected${data.google.email ? ` as ${data.google.email}` : ''}, busy times are blocked and events with Meet links are created automatically.`
                  : data.google.configured ? 'Connect to avoid double bookings and create Google Meet links.'
                  : 'Set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET, and add /api/admin/booking/google/callback as an authorised redirect URI.'}
              </p>
            </div>
            {data.google.connected
              ? <button type="button" onClick={() => confirm('Disconnect Google Calendar?') && save({ disconnectGoogle: true })} className="rounded-full border border-[#e6e6e6] px-4 py-2 text-[13px] hover:border-[#242424]">Disconnect</button>
              : data.google.configured && <a href="/api/admin/booking/google/connect" className="rounded-full bg-[#1a73e8] px-4 py-2 text-[13px] text-white hover:bg-[#1765cc]">Connect Google Calendar</a>}
          </div>
          {googleStatus && googleStatus !== 'connected' && <p className="mt-3 flex items-center gap-2 text-[13px] text-[#c94a4a]"><AlertCircle className="h-4 w-4" /> Google connection: {googleStatus}</p>}
          {data.google.connected && (
            <label className="mt-4 flex items-center gap-2 text-[13px] text-[#6b6b6b]">Calendar ID
              <input value={cfg.googleCalendarId} onChange={e => setCfg({ ...cfg, googleCalendarId: e.target.value })} onBlur={() => save()} className={`${input} w-64`} />
            </label>
          )}
        </section>

        {/* Weekly hours */}
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-[18px] font-bold text-[#242424]">Weekly hours</h2>
              <p className="text-[13px] text-[#6b6b6b]">When people can book you, in your time zone.</p>
            </div>
            <select value={cfg.timezone} onChange={e => setCfg({ ...cfg, timezone: e.target.value })} className={`${input} max-w-[240px]`}>
              {zones().map(z => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="divide-y divide-[#f6f6f6] rounded-xl border border-[#f2f2f2] bg-white">
            {ORDER.map(day => {
              const list = rulesFor(day);
              return (
                <div key={day} className="flex flex-wrap items-start gap-4 p-4">
                  <label className="flex w-[130px] items-center gap-2 pt-1.5 text-[14px] font-medium text-[#242424]">
                    <input type="checkbox" checked={list.length > 0} onChange={e => setRules(e.target.checked ? [...cfg.rules, { day, start: '09:00', end: '17:00' }] : cfg.rules.filter(r => r.day !== day))} className="accent-[#1a8917]" />
                    {DAYS[day]}
                  </label>
                  <div className="flex-1 space-y-2">
                    {list.length === 0 && <p className="pt-1.5 text-[14px] text-[#9b9b9b]">Unavailable</p>}
                    {list.map((r, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input type="time" value={r.start} onChange={e => setRules(cfg.rules.map(x => (x === r ? { ...x, start: e.target.value } : x)))} className={input} />
                        <span className="text-[#9b9b9b]">–</span>
                        <input type="time" value={r.end} onChange={e => setRules(cfg.rules.map(x => (x === r ? { ...x, end: e.target.value } : x)))} className={input} />
                        <button type="button" onClick={() => setRules(cfg.rules.filter(x => x !== r))} className="rounded p-1 text-[#9b9b9b] hover:text-[#c94a4a]" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                  {list.length > 0 && (
                    <button type="button" onClick={() => setRules([...cfg.rules, { day, start: list[list.length - 1].end, end: '18:00' }])} className="rounded p-1.5 text-[#6b6b6b] hover:bg-[#f2f2f2]" aria-label="Add interval"><Plus className="h-4 w-4" /></button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[14px] text-[#242424]">
            <label className="flex items-center gap-2">Minimum notice <input type="number" min={0} value={Math.round(cfg.minNoticeMin / 60)} onChange={e => setCfg({ ...cfg, minNoticeMin: Number(e.target.value) * 60 })} className={`${input} w-16`} /> hours</label>
            <label className="flex items-center gap-2">Book up to <input type="number" min={1} value={cfg.maxDaysAhead} onChange={e => setCfg({ ...cfg, maxDaysAhead: Number(e.target.value) })} className={`${input} w-16`} /> days ahead</label>
            <label className="flex items-center gap-2">Start times every
              <select value={cfg.slotStepMin} onChange={e => setCfg({ ...cfg, slotStepMin: Number(e.target.value) })} className={input}>{[15, 20, 30, 45, 60].map(n => <option key={n} value={n}>{n} min</option>)}</select>
            </label>
            <button type="button" onClick={() => save()} disabled={saving} className="ml-auto flex items-center gap-2 rounded-full bg-[#1a8917] px-5 py-2 text-[14px] text-white disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null} Save availability
            </button>
          </div>
        </section>

        {/* Meeting types */}
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-[18px] font-bold text-[#242424]">Meeting types</h2>
              <p className="text-[13px] text-[#6b6b6b]">Visitors choose one when booking. Link a specific one with <code>?book=slug</code>.</p>
            </div>
            <button type="button" onClick={addType} className="flex items-center gap-1.5 rounded-full border border-[#e6e6e6] bg-white px-4 py-2 text-[13px] hover:border-[#242424]"><Plus className="h-4 w-4" /> New type</button>
          </div>
          <div className="space-y-3">{data.types.map(t => <TypeCard key={t.id + t.title + t.active} t={t} onSaved={load} />)}</div>
        </section>
      </div>
    </AdminShell>
  );
}

export default function BookingSettingsPage() {
  return <Suspense><Settings /></Suspense>;
}
