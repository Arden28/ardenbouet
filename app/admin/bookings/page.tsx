'use client';
// /admin/bookings — upcoming / past / cancelled meetings
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Video, Mail, Settings2, X, ExternalLink } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import '@/app/blog/story.css';

type Booking = {
  id: string; start: string; end: string; name: string; email: string; notes: string; guestTimezone: string; status: string;
  meetLink: string | null; googleEventId: string | null; crmClientId: string | null; cancelReason: string;
  meetingType: { title: string; durationMin: number; location: string };
};

export default function BookingsPage() {
  const [scope, setScope] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [rows, setRows] = useState<Booking[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const load = () => { setRows(null); fetch(`/api/admin/bookings?scope=${scope}`).then(r => r.json()).then(d => { setRows(d.bookings); setCounts(d.counts); }); };
  useEffect(load, [scope]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancel = async (b: Booking) => {
    const reason = window.prompt(`Cancel the meeting with ${b.name}? Optional message for them:`, '');
    if (reason === null) return;
    await fetch('/api/admin/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.id, action: 'cancel', reason }) });
    load();
  };

  // Group by day (owner's browser timezone)
  const groups = (rows ?? []).reduce<Record<string, Booking[]>>((acc, b) => {
    const k = new Date(b.start).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    (acc[k] ??= []).push(b);
    return acc;
  }, {});

  return (
    <AdminShell title="Bookings" actions={<Link href="/admin/bookings/settings" className="flex items-center gap-2 rounded-full border border-[#e6e6e6] bg-white px-4 py-2 text-[14px] hover:border-[#242424]"><Settings2 className="h-4 w-4" /> Availability & settings</Link>}>
      <div className="mx-auto max-w-[900px]">
        <nav className="flex gap-6 border-b border-[#f2f2f2] text-[14px]">
          {(['upcoming', 'past', 'cancelled'] as const).map(s => (
            <button key={s} type="button" onClick={() => setScope(s)} className={`-mb-px border-b pb-3 capitalize ${scope === s ? 'border-[#242424] text-[#242424]' : 'border-transparent text-[#6b6b6b] hover:text-[#242424]'}`}>
              {s} <span className="text-[#9b9b9b]">{counts[s] ?? ''}</span>
            </button>
          ))}
        </nav>
        {rows === null ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#9b9b9b]" /></div>
          : rows.length === 0 ? <p className="py-16 text-center text-[15px] text-[#6b6b6b]">{scope === 'upcoming' ? 'No upcoming meetings. Visitors book from the “Book a call” button on the home page.' : 'Nothing here.'}</p>
          : Object.entries(groups).map(([day, list]) => (
            <section key={day} className="mt-8">
              <h2 className="mb-2 text-[13px] font-medium uppercase tracking-[0.06em] text-[#9b9b9b]">{day}</h2>
              <ul className="overflow-hidden rounded-xl border border-[#f2f2f2] bg-white">
                {list.map(b => (
                  <li key={b.id} className="flex flex-wrap items-start gap-4 border-b border-[#f6f6f6] p-4 last:border-0">
                    <div className="w-[110px] shrink-0">
                      <p className="text-[15px] font-semibold text-[#242424]">{new Date(b.start).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</p>
                      <p className="text-[12px] text-[#9b9b9b]">{b.meetingType.durationMin} min</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] text-[#242424]"><b className="font-medium">{b.name}</b> · {b.meetingType.title}</p>
                      <p className="flex flex-wrap items-center gap-x-3 text-[13px] text-[#6b6b6b]">
                        <a href={`mailto:${b.email}`} className="flex items-center gap-1 hover:text-[#242424]"><Mail className="h-3.5 w-3.5" /> {b.email}</a>
                        <span>their time: {new Date(b.start).toLocaleString(undefined, { timeZone: b.guestTimezone, hour: 'numeric', minute: '2-digit', weekday: 'short' })} ({b.guestTimezone})</span>
                      </p>
                      {b.notes && <p className="mt-2 whitespace-pre-line rounded-md bg-[#fafafa] p-2.5 text-[13px] text-[#242424]">{b.notes}</p>}
                      {b.status === 'CANCELLED' && b.cancelReason && <p className="mt-2 text-[13px] text-[#c94a4a]">Cancelled: {b.cancelReason}</p>}
                      <div className="mt-2 flex flex-wrap gap-3 text-[12px]">
                        {b.meetLink && b.status === 'CONFIRMED' && <a href={b.meetLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[#1a8917] hover:underline"><Video className="h-3.5 w-3.5" /> Join</a>}
                        {b.crmClientId && <Link href="/admin?tab=crm" className="flex items-center gap-1 text-[#6b6b6b] hover:text-[#242424]"><ExternalLink className="h-3 w-3" /> CRM lead</Link>}
                        {!b.googleEventId && b.status === 'CONFIRMED' && <span className="text-[#9b9b9b]">not on Google Calendar</span>}
                      </div>
                    </div>
                    {scope === 'upcoming' && (
                      <button type="button" onClick={() => cancel(b)} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] text-[#c94a4a] hover:bg-[#fdf1f1]"><X className="h-3.5 w-3.5" /> Cancel</button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </div>
    </AdminShell>
  );
}
