'use client';
// /join/writer?token= — accept a writer invitation (sign in first if needed)
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Feather, Loader2 } from 'lucide-react';
import { useReader, useSite } from '@/components/site/SiteProviders';

function Join() {
  const { ui, href, openSignIn, refreshMe } = useSite();
  const { reader, loading } = useReader();
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';
  const [invite, setInvite] = useState<{ summary: string; note: string } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/invites/accept?token=${encodeURIComponent(token)}`).then(async r => {
      const d = await r.json();
      if (!r.ok) setError(d.error || ui('invite.invalid')); else setInvite(d.invite);
    }).catch(() => setError(ui('invite.invalid')));
  }, [token, ui]);

  const accept = async () => {
    setBusy(true);
    const res = await fetch('/api/invites/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(d.error || ui('invite.invalid')); return; }
    refreshMe();
    router.push(href('/me/stories'));
  };

  return (
    <main className="blog-ui mx-auto flex min-h-[70vh] max-w-[560px] flex-col items-center justify-center px-6 py-16 text-center">
      <Feather className="h-10 w-10 text-[#1a8917]" strokeWidth={1.3} />
      <h1 className="mt-6 font-story text-[34px] leading-[42px] text-[#242424]">{ui('invite.title')}</h1>
      {error ? (
        <p className="mt-4 text-[16px] text-[#6b6b6b]">{error}</p>
      ) : !invite ? (
        <Loader2 className="mt-6 h-6 w-6 animate-spin text-[#9b9b9b]" />
      ) : (
        <>
          <p className="mt-4 text-[16px] leading-[26px] text-[#6b6b6b]">{invite.summary}</p>
          {invite.note && <blockquote className="mt-6 border-l-[3px] border-[#242424] pl-4 text-left font-story text-[18px] italic leading-7 text-[#242424]">{invite.note}</blockquote>}
          <div className="mt-10">
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-[#9b9b9b]" /> : reader ? (
              <button type="button" onClick={accept} disabled={busy} className="flex items-center gap-2 rounded-full bg-[#1a8917] px-6 py-2.5 text-[15px] text-white hover:bg-[#156d12] disabled:opacity-60">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}{ui('invite.accept')}
              </button>
            ) : (
              <button type="button" onClick={() => openSignIn()} className="rounded-full bg-[#242424] px-6 py-2.5 text-[15px] text-white hover:bg-black">{ui('invite.signIn')}</button>
            )}
          </div>
        </>
      )}
      <Link href={href('/blog')} className="mt-12 text-[14px] text-[#6b6b6b] hover:text-[#242424]">← Blog</Link>
    </main>
  );
}

export default function JoinWriterPage() {
  return <Suspense><Join /></Suspense>;
}
