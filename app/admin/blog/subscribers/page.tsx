'use client';
// /admin/blog/subscribers — newsletter audience
import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Search, Trash2 } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import '@/app/blog/story.css';

type Sub = { id: string; email: string; status: 'PENDING' | 'ACTIVE' | 'UNSUBSCRIBED'; createdAt: string; confirmedAt: string | null; source: string | null };

const CHIP = { ACTIVE: 'bg-[#eef7ee] text-[#1a8917]', PENDING: 'bg-[#fdf6e7] text-[#7a5a00]', UNSUBSCRIBED: 'bg-[#f2f2f2] text-[#9b9b9b]' };

export default function SubscribersPage() {
  const [subs, setSubs] = useState<Sub[] | null>(null);
  const [q, setQ] = useState('');
  const load = () => fetch('/api/admin/blog/subscribers', { cache: 'no-store' }).then(r => r.json()).then(d => setSubs(d.subscribers ?? []));
  useEffect(() => { load(); }, []);

  const shown = useMemo(() => (subs ?? []).filter(s => !q || s.email.includes(q.toLowerCase())), [subs, q]);
  const count = (st: Sub['status']) => subs?.filter(s => s.status === st).length ?? 0;

  const remove = async (s: Sub) => {
    if (!confirm(`Remove ${s.email}?`)) return;
    await fetch('/api/admin/blog/subscribers', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id }) });
    load();
  };

  return (
    <AdminShell
      title="Subscribers"
      actions={
        <a href="/api/admin/blog/subscribers?format=csv" className="flex items-center gap-2 rounded-full border border-[#e6e6e6] bg-white px-4 py-2 text-[14px] text-[#242424] hover:border-[#242424]">
          <Download className="h-4 w-4" /> Export CSV
        </a>
      }
    >
      <div className="mx-auto max-w-[900px]">
        <div className="grid grid-cols-3 gap-3">
          {(['ACTIVE', 'PENDING', 'UNSUBSCRIBED'] as const).map(st => (
            <div key={st} className="rounded-xl border border-[#f2f2f2] bg-white p-4">
              <p className="text-[13px] capitalize text-[#6b6b6b]">{st.toLowerCase()}</p>
              <p className="mt-1 text-[26px] font-semibold text-[#242424]">{count(st)}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[13px] text-[#9b9b9b]">
          Readers subscribe from the blog sidebar, the end of every story and /blog/subscribe, then confirm by email (double opt-in).
          Send a published story to active subscribers from its Publish dialog.
        </p>

        <div className="mt-6 flex items-center gap-2 rounded-full bg-white px-3 py-2 ring-1 ring-[#e6e6e6] focus-within:ring-[#242424]">
          <Search className="h-4 w-4 text-[#9b9b9b]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by email" className="flex-1 bg-transparent text-[14px] outline-none" />
        </div>

        <div className="mt-4 overflow-x-auto rounded-xl border border-[#f2f2f2] bg-white">
          <table className="w-full text-left text-[14px]">
            <thead className="border-b border-[#f2f2f2] text-[12px] uppercase tracking-[0.04em] text-[#9b9b9b]">
              <tr><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Joined</th><th className="px-4 py-3 font-medium">Source</th><th /></tr>
            </thead>
            <tbody>
              {subs === null && <tr><td colSpan={5} className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-[#9b9b9b]" /></td></tr>}
              {subs && shown.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-[#9b9b9b]">No subscribers yet.</td></tr>}
              {shown.map(s => (
                <tr key={s.id} className="border-b border-[#f9f9f9] last:border-0">
                  <td className="px-4 py-3 text-[#242424]">{s.email}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[12px] ${CHIP[s.status]}`}>{s.status.toLowerCase()}</span></td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{new Date(s.confirmedAt ?? s.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-[#9b9b9b]">{s.source ?? ''}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => remove(s)} className="rounded p-1 text-[#9b9b9b] hover:text-[#c94a4a]" aria-label={`Remove ${s.email}`}><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
