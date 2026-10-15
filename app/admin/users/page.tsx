'use client';
// /admin/users — reader accounts, writer access (grants), writer requests and invitations.
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Search, Feather, Ban, Copy, Check, X, Plus, Mail, Link2 } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import '@/app/blog/story.css';

type Grant = { scope: 'UNLIMITED' | 'LIMITED' | 'SPECIFIC'; maxPosts: number | null; postIds: string[]; canPublish: boolean; expiresAt: string | null; note: string };
type User = {
  id: string; name: string; handle: string | null; email: string | null; image: string | null; provider: string; banned: boolean;
  createdAt: string; lastSeenAt: string | null; stripeChargesEnabled: boolean;
  counts: { comments: number; posts: number; highlights: number; bookmarks: number };
  grant: (Grant & { active: boolean; summary: string; expired: boolean; revokedAt: string | null }) | null;
};
type Req = { id: string; createdAt: string; message: string; sampleUrl: string | null; topics: string[]; status: string; reader: { id: string; name: string; handle: string | null; email: string | null; image: string | null } };
type Invite = { id: string; createdAt: string; email: string | null; note: string; link: string; summary: string; state: string; inviteExpiresAt: string | null; acceptedBy: { name: string } | null };
type PostOpt = { id: string; title: string; status: string };

const DEFAULT_GRANT: Grant = { scope: 'UNLIMITED', maxPosts: 3, postIds: [], canPublish: true, expiresAt: null, note: '' };

function Avatar({ u }: { u: { name: string; image: string | null } }) {
  // eslint-disable-next-line @next/next/no-img-element
  return u.image ? <img src={u.image} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" /> : <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#242424] text-[14px] uppercase text-white">{u.name[0]}</span>;
}

// ─── Grant editor (used for "make writer", approving requests and invitations) ──

function GrantFields({ value, onChange }: { value: Grant; onChange: (g: Grant) => void }) {
  const [posts, setPosts] = useState<PostOpt[] | null>(null);
  useEffect(() => {
    if (value.scope !== 'SPECIFIC' || posts) return;
    fetch('/api/admin/blog/posts').then(r => r.json()).then(d => setPosts(d.posts.map((p: PostOpt) => ({ id: p.id, title: p.title || 'Untitled', status: p.status }))));
  }, [value.scope, posts]);
  const opt = (scope: Grant['scope'], title: string, desc: string) => (
    <label className={`flex cursor-pointer gap-3 rounded-lg border p-3 ${value.scope === scope ? 'border-[#242424] bg-[#fafafa]' : 'border-[#e6e6e6]'}`}>
      <input type="radio" checked={value.scope === scope} onChange={() => onChange({ ...value, scope })} className="mt-1 accent-[#242424]" />
      <span><span className="block text-[14px] font-medium text-[#242424]">{title}</span><span className="block text-[12px] text-[#6b6b6b]">{desc}</span></span>
    </label>
  );
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {opt('UNLIMITED', 'Unlimited', 'Can write as many stories as they like.')}
        {opt('LIMITED', 'Limited number of stories', 'Can create up to a set number of their own stories.')}
        {opt('SPECIFIC', 'Specific stories', 'Can only edit the stories you pick (e.g. to co-write or guest-edit).')}
      </div>
      {value.scope === 'LIMITED' && (
        <label className="flex items-center gap-3 text-[14px]">Up to
          <input type="number" min={1} max={1000} value={value.maxPosts ?? 1} onChange={e => onChange({ ...value, maxPosts: Number(e.target.value) })} className="w-20 rounded-md border border-[#e6e6e6] px-2 py-1.5 outline-none focus:border-[#242424]" />
          stories
        </label>
      )}
      {value.scope === 'SPECIFIC' && (
        <div className="max-h-48 overflow-y-auto rounded-md border border-[#e6e6e6] p-2">
          {!posts ? <Loader2 className="mx-auto my-4 h-4 w-4 animate-spin text-[#9b9b9b]" /> : posts.map(p => (
            <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[13px] hover:bg-[#fafafa]">
              <input type="checkbox" checked={value.postIds.includes(p.id)} onChange={e => onChange({ ...value, postIds: e.target.checked ? [...value.postIds, p.id] : value.postIds.filter(x => x !== p.id) })} className="accent-[#242424]" />
              <span className="flex-1 truncate">{p.title}</span><span className="text-[11px] uppercase text-[#9b9b9b]">{p.status.toLowerCase()}</span>
            </label>
          ))}
        </div>
      )}
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={value.canPublish} onChange={e => onChange({ ...value, canPublish: e.target.checked })} className="mt-1 accent-[#1a8917]" />
        <span className="text-[14px] text-[#242424]">Can publish directly<span className="block text-[12px] text-[#9b9b9b]">Otherwise stories are submitted to you for review.</span></span>
      </label>
      <label className="flex items-center gap-3 text-[14px] text-[#242424]">Access expires
        <input type="date" value={value.expiresAt?.slice(0, 10) ?? ''} onChange={e => onChange({ ...value, expiresAt: e.target.value ? new Date(e.target.value + 'T23:59:59').toISOString() : null })} className="rounded-md border border-[#e6e6e6] px-2 py-1.5 outline-none focus:border-[#242424]" />
        {value.expiresAt && <button type="button" onClick={() => onChange({ ...value, expiresAt: null })} className="text-[12px] text-[#6b6b6b] underline">never</button>}
      </label>
      <textarea value={value.note} onChange={e => onChange({ ...value, note: e.target.value })} rows={2} placeholder="Note (optional, shown to the writer on invitations)" className="w-full rounded-md border border-[#e6e6e6] px-3 py-2 text-[14px] outline-none focus:border-[#242424]" />
    </div>
  );
}

function Modal({ title, children, onClose, footer }: { title: string; children: React.ReactNode; onClose: () => void; footer: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 p-4" onMouseDown={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-[520px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#f2f2f2] px-5 py-4">
          <h2 className="text-[16px] font-semibold text-[#242424]">{title}</h2>
          <button type="button" onClick={onClose} className="rounded p-1 text-[#6b6b6b] hover:bg-[#f2f2f2]" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        <div className="flex justify-end gap-2 border-t border-[#f2f2f2] px-5 py-3">{footer}</div>
      </div>
    </div>
  );
}

function CopyLink({ link }: { link: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" onClick={async () => { await navigator.clipboard.writeText(link); setDone(true); setTimeout(() => setDone(false), 1500); }}
      className="flex items-center gap-1.5 rounded-full border border-[#e6e6e6] px-3 py-1 text-[12px] hover:border-[#242424]">
      {done ? <Check className="h-3.5 w-3.5 text-[#1a8917]" /> : <Copy className="h-3.5 w-3.5" />} {done ? 'Copied' : 'Copy link'}
    </button>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

function UsersAdmin() {
  const sp = useSearchParams();
  const router = useRouter();
  const tab = (sp.get('tab') as 'all' | 'writers' | 'requests' | 'invites' | 'banned') || 'all';
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<User[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [requests, setRequests] = useState<Req[] | null>(null);
  const [invites, setInvites] = useState<Invite[] | null>(null);
  const [granting, setGranting] = useState<{ user?: User; request?: Req; grant: Grant } | null>(null);
  const [inviting, setInviting] = useState<{ grant: Grant; email: string; send: boolean; days: number; created?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const loadUsers = useCallback(() => {
    const filter = tab === 'writers' || tab === 'banned' ? tab : 'all';
    fetch(`/api/admin/users?filter=${filter}&q=${encodeURIComponent(q)}`).then(r => r.json()).then(d => { setUsers(d.users); setCounts(d.counts); });
  }, [tab, q]);
  const loadRequests = () => fetch('/api/admin/writer-requests?status=PENDING').then(r => r.json()).then(d => setRequests(d.requests));
  const loadInvites = () => fetch('/api/admin/invites').then(r => r.json()).then(d => setInvites(d.invites));

  useEffect(() => {
    const id = setTimeout(() => { if (tab === 'requests') loadRequests(); else if (tab === 'invites') loadInvites(); else loadUsers(); }, q ? 250 : 0);
    if (tab !== 'all' && !Object.keys(counts).length) fetch('/api/admin/users?filter=all').then(r => r.json()).then(d => setCounts(d.counts));
    return () => clearTimeout(id);
  }, [tab, loadUsers]); // eslint-disable-line react-hooks/exhaustive-deps

  const patchUser = async (id: string, body: Record<string, unknown>) => {
    await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    loadUsers();
  };

  const saveGrant = async () => {
    if (!granting) return;
    setBusy(true);
    if (granting.request) {
      await fetch('/api/admin/writer-requests', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: granting.request.id, decision: 'approve', grant: granting.grant }) });
      loadRequests();
    } else if (granting.user) {
      await patchUser(granting.user.id, { grant: granting.grant });
    }
    setBusy(false);
    setGranting(null);
  };

  const reject = async (r: Req) => {
    const note = window.prompt(`Reply to ${r.reader.name} (optional):`, '');
    if (note === null) return;
    await fetch('/api/admin/writer-requests', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, decision: 'reject', note }) });
    loadRequests();
  };

  const createInvite = async () => {
    if (!inviting) return;
    setBusy(true);
    const res = await fetch('/api/admin/invites', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...inviting.grant, email: inviting.email, send: inviting.send, inviteDays: inviting.days }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) { alert(d.error); return; }
    setInviting({ ...inviting, created: d.invite.link });
    loadInvites();
  };

  const TABS = [
    { key: 'all', label: 'All users', n: counts.all },
    { key: 'writers', label: 'Writers', n: counts.writers },
    { key: 'requests', label: 'Requests', n: counts.requests },
    { key: 'invites', label: 'Invitations' },
    { key: 'banned', label: 'Banned', n: counts.banned },
  ] as const;

  return (
    <AdminShell
      title="Users & writers"
      actions={<button type="button" onClick={() => setInviting({ grant: { ...DEFAULT_GRANT }, email: '', send: true, days: 14 })} className="flex items-center gap-2 rounded-full bg-[#1a8917] px-4 py-2 text-[14px] text-white hover:bg-[#156d12]"><Plus className="h-4 w-4" /> Invite a writer</button>}
    >
      <div className="mx-auto max-w-[1000px]">
        <div className="flex flex-col gap-4 border-b border-[#f2f2f2] sm:flex-row sm:items-end sm:justify-between">
          <nav className="no-scrollbar -mb-px flex gap-6 overflow-x-auto text-[14px]">
            {TABS.map(t => (
              <button key={t.key} type="button" onClick={() => router.replace(`/admin/users?tab=${t.key}`)} className={`shrink-0 border-b pb-3 ${tab === t.key ? 'border-[#242424] text-[#242424]' : 'border-transparent text-[#6b6b6b] hover:text-[#242424]'}`}>
                {t.label} {'n' in t && t.n !== undefined && <span className={t.key === 'requests' && t.n ? 'rounded-full bg-[#1a8917] px-1.5 text-[11px] text-white' : 'text-[#9b9b9b]'}>{t.n}</span>}
              </button>
            ))}
          </nav>
          {(tab === 'all' || tab === 'writers' || tab === 'banned') && (
            <div className="mb-3 flex items-center gap-2 rounded-full bg-white px-3 py-1.5 ring-1 ring-[#e6e6e6] focus-within:ring-[#242424]">
              <Search className="h-4 w-4 text-[#9b9b9b]" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Name, @handle or email" className="w-52 bg-transparent text-[14px] outline-none" />
            </div>
          )}
        </div>

        {/* Users */}
        {(tab === 'all' || tab === 'writers' || tab === 'banned') && (
          !users ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#9b9b9b]" /></div>
          : users.length === 0 ? <p className="py-16 text-center text-[15px] text-[#6b6b6b]">No users here yet.</p>
          : <ul>{users.map(u => (
            <li key={u.id} className="flex flex-wrap items-center gap-4 border-b border-[#f2f2f2] py-4">
              <Avatar u={u} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[14px] text-[#242424]">
                  <span className="truncate font-medium">{u.name}</span>
                  {u.handle && <span className="text-[#9b9b9b]">@{u.handle}</span>}
                  {u.banned && <span className="rounded bg-[#fdf1f1] px-1.5 text-[11px] text-[#c94a4a]">banned</span>}
                </p>
                <p className="truncate text-[12px] text-[#9b9b9b]">
                  {u.email ?? 'no email'} · {u.provider} · joined {new Date(u.createdAt).toLocaleDateString()} · {u.counts.comments} responses · {u.counts.posts} stories
                </p>
                {u.grant && (
                  <p className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] ${u.grant.active ? 'bg-[#eef7ee] text-[#1a6b17]' : 'bg-[#f2f2f2] text-[#9b9b9b] line-through'}`}>
                    <Feather className="h-3 w-3" /> {u.grant.summary}{u.grant.expired ? ' (expired)' : ''}{u.grant.revokedAt ? ' (revoked)' : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setGranting({ user: u, grant: u.grant && !u.grant.revokedAt ? { scope: u.grant.scope, maxPosts: u.grant.maxPosts, postIds: u.grant.postIds, canPublish: u.grant.canPublish, expiresAt: u.grant.expiresAt, note: u.grant.note } : { ...DEFAULT_GRANT } })}
                  className="rounded-full border border-[#e6e6e6] px-3 py-1.5 text-[13px] hover:border-[#242424]">
                  {u.grant?.active ? 'Edit access' : 'Make writer'}
                </button>
                {u.grant?.active && <button type="button" onClick={() => confirm(`Remove ${u.name}'s writing access? Their stories stay.`) && patchUser(u.id, { revoke: true })} className="rounded-full px-3 py-1.5 text-[13px] text-[#6b6b6b] hover:bg-[#f2f2f2]">Revoke</button>}
                <button type="button" onClick={() => (u.banned || confirm(`Ban ${u.name}? Their responses are hidden and writing access is removed.`)) && patchUser(u.id, { banned: !u.banned })}
                  className="rounded-full p-1.5 text-[#c94a4a] hover:bg-[#fdf1f1]" title={u.banned ? 'Unban' : 'Ban'}><Ban className="h-4 w-4" /></button>
              </div>
            </li>
          ))}</ul>
        )}

        {/* Requests */}
        {tab === 'requests' && (
          !requests ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#9b9b9b]" /></div>
          : requests.length === 0 ? <p className="py-16 text-center text-[15px] text-[#6b6b6b]">No pending requests. Readers can ask to write from their account.</p>
          : <ul>{requests.map(r => (
            <li key={r.id} className="border-b border-[#f2f2f2] py-5">
              <div className="flex items-center gap-3">
                <Avatar u={r.reader} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-[#242424]">{r.reader.name} {r.reader.handle && <span className="font-normal text-[#9b9b9b]">@{r.reader.handle}</span>}</p>
                  <p className="text-[12px] text-[#9b9b9b]">{r.reader.email} · {new Date(r.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line font-story text-[16px] leading-[26px] text-[#242424]">{r.message}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
                {r.sampleUrl && <a href={r.sampleUrl} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-1 text-[#2467ac] underline"><Link2 className="h-3 w-3" /> Sample</a>}
                {r.topics.map(t => <span key={t} className="rounded-full bg-[#f2f2f2] px-2 py-0.5 text-[#6b6b6b]">{t}</span>)}
              </div>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => setGranting({ request: r, grant: { ...DEFAULT_GRANT, canPublish: false } })} className="rounded-full bg-[#1a8917] px-4 py-1.5 text-[13px] text-white hover:bg-[#156d12]">Approve…</button>
                <button type="button" onClick={() => reject(r)} className="rounded-full px-4 py-1.5 text-[13px] text-[#6b6b6b] hover:bg-[#f2f2f2]">Decline</button>
              </div>
            </li>
          ))}</ul>
        )}

        {/* Invitations */}
        {tab === 'invites' && (
          !invites ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#9b9b9b]" /></div>
          : invites.length === 0 ? <p className="py-16 text-center text-[15px] text-[#6b6b6b]">No invitations yet.</p>
          : <ul>{invites.map(i => (
            <li key={i.id} className="flex flex-wrap items-center gap-3 border-b border-[#f2f2f2] py-4">
              <Mail className="h-5 w-5 text-[#9b9b9b]" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] text-[#242424]">{i.email ?? 'Shareable link'} <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] ${i.state === 'pending' ? 'bg-[#eef4fb] text-[#2467ac]' : i.state === 'accepted' ? 'bg-[#eef7ee] text-[#1a6b17]' : 'bg-[#f2f2f2] text-[#9b9b9b]'}`}>{i.state}{i.acceptedBy ? ` by ${i.acceptedBy.name}` : ''}</span></p>
                <p className="text-[12px] text-[#9b9b9b]">{i.summary} · created {new Date(i.createdAt).toLocaleDateString()}{i.inviteExpiresAt && i.state === 'pending' ? ` · link expires ${new Date(i.inviteExpiresAt).toLocaleDateString()}` : ''}</p>
              </div>
              {i.state === 'pending' && (
                <>
                  <CopyLink link={i.link} />
                  <button type="button" onClick={async () => { await fetch('/api/admin/invites', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: i.id }) }); loadInvites(); }} className="rounded-full px-3 py-1 text-[12px] text-[#c94a4a] hover:bg-[#fdf1f1]">Revoke</button>
                </>
              )}
            </li>
          ))}</ul>
        )}
      </div>

      {granting && (
        <Modal
          title={granting.request ? `Approve ${granting.request.reader.name}` : `Writing access · ${granting.user?.name}`}
          onClose={() => setGranting(null)}
          footer={<>
            <button type="button" onClick={() => setGranting(null)} className="rounded-full px-4 py-2 text-[14px] hover:bg-[#f2f2f2]">Cancel</button>
            <button type="button" onClick={saveGrant} disabled={busy} className="flex items-center gap-2 rounded-full bg-[#1a8917] px-4 py-2 text-[14px] text-white disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save access</button>
          </>}
        >
          <GrantFields value={granting.grant} onChange={g => setGranting({ ...granting, grant: g })} />
        </Modal>
      )}

      {inviting && (
        <Modal
          title="Invite a writer"
          onClose={() => setInviting(null)}
          footer={inviting.created
            ? <button type="button" onClick={() => setInviting(null)} className="rounded-full bg-[#242424] px-4 py-2 text-[14px] text-white">Done</button>
            : <>
              <button type="button" onClick={() => setInviting(null)} className="rounded-full px-4 py-2 text-[14px] hover:bg-[#f2f2f2]">Cancel</button>
              <button type="button" onClick={createInvite} disabled={busy} className="flex items-center gap-2 rounded-full bg-[#1a8917] px-4 py-2 text-[14px] text-white disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Create invitation</button>
            </>}
        >
          {inviting.created ? (
            <div className="text-center">
              <Check className="mx-auto h-8 w-8 text-[#1a8917]" />
              <p className="mt-3 text-[15px] text-[#242424]">{inviting.email && inviting.send ? `Invitation emailed to ${inviting.email}.` : 'Invitation created.'} Share this single-use link:</p>
              <p className="mt-3 break-all rounded-md bg-[#f6f6f6] p-3 font-mono text-[12px] text-[#6b6b6b]">{inviting.created}</p>
              <div className="mt-3 flex justify-center"><CopyLink link={inviting.created} /></div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <input type="email" value={inviting.email} onChange={e => setInviting({ ...inviting, email: e.target.value })} placeholder="Email (optional, leave empty for a shareable link)" className="w-full rounded-md border border-[#e6e6e6] px-3 py-2 text-[14px] outline-none focus:border-[#242424]" />
                {inviting.email && (
                  <label className="mt-2 flex items-center gap-2 text-[13px] text-[#6b6b6b]"><input type="checkbox" checked={inviting.send} onChange={e => setInviting({ ...inviting, send: e.target.checked })} className="accent-[#1a8917]" /> Email the invitation</label>
                )}
                <label className="mt-2 flex items-center gap-2 text-[13px] text-[#6b6b6b]">Link valid for
                  <input type="number" min={1} max={90} value={inviting.days} onChange={e => setInviting({ ...inviting, days: Number(e.target.value) })} className="w-16 rounded-md border border-[#e6e6e6] px-2 py-1 outline-none" /> days
                </label>
              </div>
              <GrantFields value={inviting.grant} onChange={g => setInviting({ ...inviting, grant: g })} />
            </div>
          )}
        </Modal>
      )}
    </AdminShell>
  );
}

export default function UsersPage() {
  return <Suspense><UsersAdmin /></Suspense>;
}
