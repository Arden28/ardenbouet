'use client';
// /admin/messages — contact form inbox (two-pane: list + reading pane)
import { useCallback, useEffect, useState } from 'react';
import { Archive, ArchiveRestore, Mail, Trash2, UserPlus, CalendarDays, Inbox } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Badge, Button, Empty, SearchInput, Spinner, Tabs } from '@/components/admin/ui';
import '@/app/blog/story.css';

type Msg = { id: number; createdAt: string; name: string; email: string; services: string[]; timeframe: string | null; budget: string | null; body: string; read: boolean; archived: boolean };
const BUDGET: Record<string, string> = { LOW: '< $500', MEDIUM: '$500 – 2k', HIGH: '$2 – 8k', PREMIUM: '$8 – 20k', ENTERPRISE: '$20k +' };

export default function MessagesPage() {
  const [filter, setFilter] = useState<'inbox' | 'unread' | 'archived'>('inbox');
  const [q, setQ] = useState('');
  const [list, setList] = useState<Msg[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [sel, setSel] = useState<Msg | null>(null);

  const load = useCallback(() => {
    fetch(`/api/admin/messages?filter=${filter}&q=${encodeURIComponent(q)}`, { cache: 'no-store' }).then(r => r.json()).then(d => { setList(d.messages); setCounts(d.counts); });
  }, [filter, q]);
  useEffect(() => { const id = setTimeout(load, q ? 250 : 0); return () => clearTimeout(id); }, [load, q]);

  const patch = async (m: Msg, data: Partial<Msg>) => {
    await fetch('/api/admin/messages', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id, ...data }) });
    load();
  };
  const open = (m: Msg) => { setSel({ ...m, read: true }); if (!m.read) patch(m, { read: true }); };
  const remove = async (m: Msg) => {
    if (!confirm('Delete this message permanently?')) return;
    await fetch('/api/admin/messages', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id }) });
    setSel(null);
    load();
  };
  const toLead = async (m: Msg) => {
    const res = await fetch('/api/admin/crm/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: m.name, email: m.email, status: 'LEAD', notes: m.body, tags: ['contact-form', ...m.services] }) });
    alert(res.ok ? `${m.name} was added to the CRM as a lead.` : 'Could not create the lead.');
  };

  return (
    <AdminShell title="Messages">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Tabs value={filter} onChange={f => { setFilter(f); setSel(null); }} items={[
            { key: 'inbox', label: 'Inbox', count: counts.inbox }, { key: 'unread', label: 'Unread', count: counts.unread, alert: true }, { key: 'archived', label: 'Archived', count: counts.archived },
          ]} />
          <SearchInput value={q} onChange={setQ} placeholder="Search messages" className="mb-3 w-full sm:w-64" />
        </div>

        {!list ? <Spinner /> : list.length === 0 ? <div className="mt-6"><Empty title="No messages" body="Messages sent from the contact form on the home page land here (and in your email)." /></div> : (
          <div className="mt-6 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
            <ul className="max-h-[calc(100vh-240px)] overflow-y-auto rounded-2xl border border-[#f0f0f0] bg-white">
              {list.map(m => (
                <li key={m.id}>
                  <button type="button" onClick={() => open(m)} className={`w-full border-b border-[#f6f6f6] px-4 py-3.5 text-left last:border-0 ${sel?.id === m.id ? 'bg-[#f6f6f6]' : 'hover:bg-[#fcfcfc]'}`}>
                    <span className="flex items-center gap-2">
                      {!m.read && <span className="h-2 w-2 shrink-0 rounded-full bg-[#1a8917]" />}
                      <span className={`flex-1 truncate text-[14px] ${m.read ? 'text-[#242424]' : 'font-semibold text-[#242424]'}`}>{m.name}</span>
                      <span className="shrink-0 text-[12px] text-[#9b9b9b]">{new Date(m.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </span>
                    <span className="mt-1 block truncate text-[13px] text-[#6b6b6b]">{m.body}</span>
                  </button>
                </li>
              ))}
            </ul>

            <section className="min-h-[300px] rounded-2xl border border-[#f0f0f0] bg-white p-6">
              {!sel ? (
                <div className="flex h-full flex-col items-center justify-center text-[#c4c4c4]"><Inbox className="h-10 w-10" strokeWidth={1.2} /><p className="mt-3 text-[14px]">Select a message</p></div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-[20px] font-bold text-[#242424]">{sel.name}</h2>
                      <a href={`mailto:${sel.email}`} className="text-[14px] text-[#6b6b6b] hover:text-[#242424]">{sel.email}</a>
                      <p className="mt-1 text-[12px] text-[#9b9b9b]">{new Date(sel.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="ghost" onClick={() => patch(sel, { archived: !sel.archived }).then(() => setSel(null))}>{sel.archived ? <><ArchiveRestore className="h-4 w-4" /> Unarchive</> : <><Archive className="h-4 w-4" /> Archive</>}</Button>
                      <Button size="sm" variant="ghost" onClick={() => patch(sel, { read: false }).then(() => setSel(null))}>Mark unread</Button>
                      <Button size="sm" variant="danger" onClick={() => remove(sel)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {sel.services.map(s => <Badge key={s} tone="blue">{s}</Badge>)}
                    {sel.budget && <Badge>{BUDGET[sel.budget] ?? sel.budget}</Badge>}
                    {sel.timeframe && <Badge>{sel.timeframe}</Badge>}
                  </div>
                  <p className="mt-6 whitespace-pre-line font-story text-[18px] leading-[30px] text-[#242424]">{sel.body}</p>
                  <div className="mt-8 flex flex-wrap gap-2 border-t border-[#f2f2f2] pt-5">
                    <a href={`mailto:${sel.email}?subject=${encodeURIComponent('Re: your message')}`} className="inline-flex items-center gap-2 rounded-full bg-[#242424] px-4 py-2 text-[14px] font-medium text-white hover:bg-black"><Mail className="h-4 w-4" /> Reply</a>
                    <Button onClick={() => toLead(sel)}><UserPlus className="h-4 w-4" /> Add to CRM</Button>
                    <a href={`/?book=1`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-[#e6e6e6] px-4 py-2 text-[14px] hover:border-[#242424]"><CalendarDays className="h-4 w-4" /> Booking page</a>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
