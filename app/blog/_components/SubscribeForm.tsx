'use client';
import { useState } from 'react';
import { useBlog } from './ReaderProvider';

export function SubscribeForm({ source, variant = 'inline' }: { source: string; variant?: 'inline' | 'stacked' }) {
  const { t } = useBlog();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'sent' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState('busy');
    const website = (new FormData(e.currentTarget).get('website') as string) || '';
    try {
      const res = await fetch('/api/blog/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, website }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('genericError'));
      setState('sent');
      setMsg(data.status === 'active' ? t('subscribeConfirmed') : t('subscribeSent'));
    } catch (err) {
      setState('error');
      setMsg(err instanceof Error ? err.message : t('genericError'));
    }
  };

  if (state === 'sent') return <p className="text-[15px] leading-6 text-[#1a8917]">{msg}</p>;

  return (
    <form onSubmit={submit} className={variant === 'stacked' ? 'flex flex-col gap-3' : 'flex flex-col gap-3 sm:flex-row'}>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder={t('emailPlaceholder')}
        aria-label="Email"
        className="min-w-0 flex-1 rounded-full border border-[#e6e6e6] bg-white px-5 py-2.5 text-[15px] text-[#242424] outline-none focus:border-[#242424]"
      />
      <button
        type="submit"
        disabled={state === 'busy'}
        className="rounded-full bg-[#1a8917] px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[#156d12] disabled:opacity-60"
      >
        {t('subscribe')}
      </button>
      {state === 'error' && <p className="text-[13px] text-[#c94a4a] sm:basis-full">{msg}</p>}
    </form>
  );
}
