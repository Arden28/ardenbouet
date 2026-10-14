'use client';
// /me/writer — ask to become a writer (or see the status of the request / current access)
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Feather, Clock, Check } from 'lucide-react';
import { useSite } from '@/components/site/SiteProviders';

type State = { writer: { isWriter: boolean }; request: { status: 'PENDING' | 'APPROVED' | 'REJECTED'; decisionNote: string } | null };

export default function BecomeWriterPage() {
  const { ui, href, refreshMe } = useSite();
  const [state, setState] = useState<State | null>(null);
  const [form, setForm] = useState({ message: '', sampleUrl: '', topics: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = () => fetch('/api/me', { cache: 'no-store' }).then(r => r.json()).then(setState);
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/me/writer-request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, topics: form.topics.split(',').map(s => s.trim()).filter(Boolean) }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(d.error || 'Could not send'); return; }
    load();
    refreshMe();
  };

  if (!state) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#9b9b9b]" /></div>;
  const pending = state.request?.status === 'PENDING';
  const rejected = state.request?.status === 'REJECTED';

  return (
    <div>
      <Feather className="h-8 w-8 text-[#1a8917]" strokeWidth={1.4} />
      <h1 className="mt-4 font-story text-[34px] leading-[42px] text-[#242424]">{ui('me.writer.title')}</h1>
      <p className="mt-3 max-w-[560px] text-[16px] leading-[26px] text-[#6b6b6b]">{ui('me.writer.body')}</p>

      {state.writer.isWriter ? (
        <div className="mt-10 flex items-center gap-4 rounded-lg bg-[#eef7ee] p-5">
          <Check className="h-6 w-6 text-[#1a8917]" />
          <p className="flex-1 text-[15px] text-[#1a6b17]">{ui('me.writer.active')}</p>
          <Link href={href('/me/stories')} className="rounded-full bg-[#1a8917] px-4 py-2 text-[14px] text-white">{ui('me.writer.goStories')}</Link>
        </div>
      ) : pending ? (
        <div className="mt-10 flex items-start gap-4 rounded-lg bg-[#f6f6f6] p-5">
          <Clock className="mt-0.5 h-5 w-5 text-[#6b6b6b]" />
          <p className="text-[15px] leading-6 text-[#242424]">{ui('me.writer.pending')}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-10 space-y-6">
          {rejected && (
            <div className="rounded-lg bg-[#fdf6e7] p-4 text-[14px] leading-6 text-[#7a5a00]">
              {ui('me.writer.rejected')} {state.request?.decisionNote && <>“{state.request.decisionNote}” </>}{ui('me.writer.again')}
            </div>
          )}
          <label className="block">
            <span className="text-[15px] font-medium text-[#242424]">{ui('me.writer.message')}</span>
            <textarea required minLength={30} rows={6} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
              className="mt-2 w-full rounded-md border border-[#e6e6e6] p-4 font-story text-[17px] leading-7 text-[#242424] outline-none focus:border-[#242424]" />
            <span className="mt-1 block text-[12px] text-[#9b9b9b]">{ui('me.writer.messageHint')}</span>
          </label>
          <label className="block">
            <span className="text-[14px] text-[#242424]">{ui('me.writer.sample')}</span>
            <input type="url" value={form.sampleUrl} onChange={e => setForm({ ...form, sampleUrl: e.target.value })} placeholder="https://"
              className="mt-2 w-full rounded-md border border-[#e6e6e6] px-4 py-2.5 text-[15px] outline-none focus:border-[#242424]" />
          </label>
          <label className="block">
            <span className="text-[14px] text-[#242424]">{ui('me.writer.topics')}</span>
            <input value={form.topics} onChange={e => setForm({ ...form, topics: e.target.value })} placeholder="engineering, saas, mobility"
              className="mt-2 w-full rounded-md border border-[#e6e6e6] px-4 py-2.5 text-[15px] outline-none focus:border-[#242424]" />
          </label>
          {error && <p className="text-[13px] text-[#c94a4a]">{error}</p>}
          <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-full bg-[#1a8917] px-6 py-2.5 text-[15px] text-white hover:bg-[#156d12] disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}{ui('me.writer.submit')}
          </button>
        </form>
      )}
    </div>
  );
}
