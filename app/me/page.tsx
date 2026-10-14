'use client';
// /me — profile overview + inline editing (name, username, bio, location, website).
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, MapPin, Link2, ExternalLink } from 'lucide-react';
import { useSite } from '@/components/site/SiteProviders';
import { Avatar } from '@/components/site/SiteHeader';
import { PROVIDER_META } from '@/components/auth/AuthPanel';

type Me = {
  reader: { id: string; name: string; handle: string | null; image: string | null; bio: string; website: string | null; location: string | null; provider: string; createdAt: string };
  counts: { saved: number; highlights: number; responses: number; stories: number };
  writer: { isWriter: boolean };
};

const field = 'w-full border-b border-[#e6e6e6] bg-transparent py-2 text-[15px] text-[#242424] outline-none focus:border-[#242424]';

export default function ProfilePage() {
  const { ui, href, locale, refreshMe } = useSite();
  const [me, setMe] = useState<Me | null>(null);
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState({ name: '', handle: '', bio: '', location: '', website: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = () => fetch('/api/me', { cache: 'no-store' }).then(r => r.json()).then((d: Me) => {
    setMe(d);
    setDraft({ name: d.reader.name, handle: d.reader.handle ?? '', bio: d.reader.bio, location: d.reader.location ?? '', website: d.reader.website ?? '' });
  });
  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true);
    setError('');
    const res = await fetch('/api/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(d.error || 'Could not save'); return; }
    setEdit(false);
    load();
    refreshMe();
  };

  if (!me) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-[#9b9b9b]" /></div>;
  const r = me.reader;
  const joined = new Date(r.createdAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="flex items-start gap-5">
        <Avatar name={r.name} image={r.image} size={88} />
        <div className="min-w-0 flex-1 pt-1">
          {edit ? (
            <input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} className="w-full border-b border-[#242424] bg-transparent pb-1 text-[32px] font-bold tracking-[-0.02em] text-[#242424] outline-none" aria-label={ui('me.name')} />
          ) : (
            <h1 className="truncate text-[32px] font-bold leading-10 tracking-[-0.02em] text-[#242424] sm:text-[42px] sm:leading-[52px]">{r.name}</h1>
          )}
          <p className="mt-1 text-[15px] text-[#6b6b6b]">
            {r.handle && <>@{r.handle} · </>}{ui('me.joined', { date: joined })}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-[#9b9b9b]">
            <span className="flex h-4 w-4 items-center justify-center [&_svg]:h-3.5 [&_svg]:w-3.5">{PROVIDER_META[r.provider]?.icon}</span>
            {ui('me.signedInWith', { provider: PROVIDER_META[r.provider]?.label ?? r.provider })}
          </p>
        </div>
      </div>

      {edit ? (
        <div className="mt-10 space-y-6">
          <label className="block">
            <span className="text-[13px] text-[#6b6b6b]">{ui('me.handle')}</span>
            <div className="flex items-center"><span className="pr-0.5 text-[15px] text-[#9b9b9b]">@</span><input value={draft.handle} onChange={e => setDraft({ ...draft, handle: e.target.value.toLowerCase() })} className={field} maxLength={30} /></div>
          </label>
          <label className="block">
            <span className="text-[13px] text-[#6b6b6b]">{ui('me.bio')}</span>
            <textarea value={draft.bio} onChange={e => setDraft({ ...draft, bio: e.target.value })} rows={2} maxLength={160} className={`${field} resize-none`} />
            <span className="mt-1 flex justify-between text-[12px] text-[#9b9b9b]"><span>{ui('me.bioHint')}</span><span>{draft.bio.length}/160</span></span>
          </label>
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block"><span className="text-[13px] text-[#6b6b6b]">{ui('me.location')}</span><input value={draft.location} onChange={e => setDraft({ ...draft, location: e.target.value })} className={field} maxLength={60} /></label>
            <label className="block"><span className="text-[13px] text-[#6b6b6b]">{ui('me.website')}</span><input value={draft.website} onChange={e => setDraft({ ...draft, website: e.target.value })} placeholder="https://" className={field} /></label>
          </div>
          {error && <p className="text-[13px] text-[#c94a4a]">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={save} disabled={busy} className="flex items-center gap-2 rounded-full bg-[#1a8917] px-5 py-2 text-[14px] text-white hover:bg-[#156d12] disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}{ui('me.save')}
            </button>
            <button type="button" onClick={() => { setEdit(false); setError(''); }} className="rounded-full px-5 py-2 text-[14px] text-[#242424] hover:bg-[#f2f2f2]">{ui('me.cancel')}</button>
          </div>
        </div>
      ) : (
        <>
          {r.bio && <p className="mt-8 font-story text-[20px] leading-8 text-[#242424]">{r.bio}</p>}
          {(r.location || r.website) && (
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-[#6b6b6b]">
              {r.location && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {r.location}</span>}
              {r.website && <a href={r.website} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1.5 hover:text-[#242424]"><Link2 className="h-4 w-4" /> {r.website.replace(/^https?:\/\//, '')}</a>}
            </div>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setEdit(true)} className="rounded-full border border-[#242424] px-5 py-2 text-[14px] text-[#242424] hover:bg-[#f9f9f9]">{ui('me.edit')}</button>
            {r.handle && me.writer.isWriter && (
              <Link href={href(`/blog/author/${r.handle}`)} className="flex items-center gap-1.5 px-2 text-[14px] text-[#6b6b6b] hover:text-[#242424]">{ui('me.viewProfile')} <ExternalLink className="h-3.5 w-3.5" /></Link>
            )}
          </div>
        </>
      )}

      <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#f2f2f2] bg-[#f2f2f2] sm:grid-cols-4">
        {([
          ['me.stat.saved', me.counts.saved, '/me/library'],
          ['me.stat.highlights', me.counts.highlights, '/me/library?tab=highlights'],
          ['me.stat.responses', me.counts.responses, '/me/library?tab=responses'],
          ['me.stat.stories', me.counts.stories, me.writer.isWriter ? '/me/stories' : '/me/writer'],
        ] as const).map(([k, n, to]) => (
          <Link key={k} href={href(to)} className="bg-white px-5 py-4 transition-colors hover:bg-[#fafafa]">
            <p className="text-[26px] font-semibold tracking-[-0.02em] text-[#242424]">{n}</p>
            <p className="text-[13px] text-[#6b6b6b]">{ui(k)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
