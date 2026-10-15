'use client';
// /admin/blog/comments — moderate responses: hide/show, pin, reply as author, ban reader, delete.
import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, Pin, EyeOff, Eye, Trash2, Reply, Ban, BadgeCheck, ExternalLink, X } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import '@/app/blog/story.css';

type Row = {
  id: string; body: string; html: string; quote: string | null; createdAt: string; editedAt: string | null;
  status: 'VISIBLE' | 'HIDDEN' | 'DELETED'; pinned: boolean; likeCount: number; isAuthor: boolean; postId: string;
  reader: { id: string; name: string; image: string | null; email: string | null; provider: string; banned: boolean } | null;
  post: { id: string; title: string; slug: string };
  parent: { id: string; body: string; isAuthor: boolean; reader: { name: string } | null } | null;
};

const FILTERS = [
  { key: 'VISIBLE', label: 'Visible' },
  { key: 'HIDDEN', label: 'Hidden' },
  { key: 'DELETED', label: 'Deleted by reader' },
  { key: 'ALL', label: 'All' },
] as const;

function Moderation() {
  const sp = useSearchParams();
  const postId = sp.get('postId');
  const [status, setStatus] = useState<(typeof FILTERS)[number]['key']>('VISIBLE');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  const load = useCallback(() => {
    const qs = new URLSearchParams({ status, ...(postId ? { postId } : {}) });
    fetch(`/api/admin/blog/comments?${qs}`, { cache: 'no-store' }).then(r => r.json()).then(d => { setRows(d.comments ?? []); setCounts(d.counts ?? {}); });
  }, [status, postId]);
  useEffect(() => { setRows(null); load(); }, [load]);

  const act = async (id: string, body: Record<string, unknown>) => {
    await fetch(`/api/admin/blog/comments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    load();
  };
  const remove = async (id: string) => {
    if (!confirm('Delete this response and all its replies permanently?')) return;
    await fetch(`/api/admin/blog/comments/${id}`, { method: 'DELETE' });
    load();
  };
  const sendReply = async (row: Row) => {
    if (!reply.trim()) return;
    await fetch('/api/admin/blog/comments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId: row.postId, parentId: row.id, body: reply }),
    });
    setReply('');
    setReplyTo(null);
    load();
  };

  const scopedTitle = postId && rows?.[0]?.post.title;

  return (
    <AdminShell title="Responses">
      <div className="mx-auto max-w-[900px]">
        {postId && (
          <p className="mb-4 flex items-center gap-2 text-[14px] text-[#6b6b6b]">
            Showing responses to <b className="text-[#242424]">{scopedTitle || 'one story'}</b>
            <Link href="/admin/blog/comments" className="flex items-center gap-1 rounded-full bg-[#f2f2f2] px-2 py-0.5 text-[12px] hover:bg-[#e6e6e6]"><X className="h-3 w-3" /> clear</Link>
          </p>
        )}
        <nav className="no-scrollbar flex gap-6 overflow-x-auto border-b border-[#f2f2f2] text-[14px]">
          {FILTERS.map(f => (
            <button key={f.key} type="button" onClick={() => setStatus(f.key)} className={`-mb-px shrink-0 border-b pb-3 ${status === f.key ? 'border-[#242424] text-[#242424]' : 'border-transparent text-[#6b6b6b] hover:text-[#242424]'}`}>
              {f.label} {f.key !== 'ALL' && <span className="text-[#9b9b9b]">{counts[f.key] ?? 0}</span>}
            </button>
          ))}
        </nav>

        <ul>
          {rows === null && <li className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#9b9b9b]" /></li>}
          {rows?.length === 0 && <li className="py-20 text-center text-[15px] text-[#6b6b6b]">No responses here.</li>}
          {rows?.map(r => (
            <li key={r.id} className="border-b border-[#f2f2f2] py-5">
              <div className="flex items-start gap-3">
                {r.isAuthor ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/images/me.png" alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : r.reader?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.reader.image} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#242424] text-[14px] uppercase text-white">{r.reader?.name?.[0] ?? '?'}</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 text-[14px]">
                    <span className="font-medium text-[#242424]">{r.isAuthor ? 'Arden BOUET' : r.reader?.name}</span>
                    {r.isAuthor && <span className="flex items-center gap-0.5 rounded bg-[#242424] px-1.5 text-[11px] text-white"><BadgeCheck className="h-3 w-3" /> Author</span>}
                    {r.reader?.banned && <span className="rounded bg-[#fdf1f1] px-1.5 text-[11px] text-[#c94a4a]">banned</span>}
                    {r.pinned && <span className="flex items-center gap-1 text-[12px] text-[#6b6b6b]"><Pin className="h-3 w-3" /> pinned</span>}
                    {r.status !== 'VISIBLE' && <span className="rounded bg-[#f2f2f2] px-1.5 text-[11px] uppercase text-[#6b6b6b]">{r.status.toLowerCase()}</span>}
                  </p>
                  <p className="text-[12px] text-[#9b9b9b]">
                    {r.reader?.email && <>{r.reader.email} · via {r.reader.provider} · </>}
                    {new Date(r.createdAt).toLocaleString()}{r.editedAt && ' · edited'} · on{' '}
                    <a href={`/blog/${r.post.slug}#responses`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[#6b6b6b] hover:text-[#242424]">
                      {r.post.title || 'Untitled'} <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                  {r.parent && (
                    <p className="mt-2 border-l-2 border-[#e6e6e6] pl-2 text-[13px] text-[#9b9b9b] line-clamp-2">
                      Reply to {r.parent.isAuthor ? 'you' : r.parent.reader?.name}: {r.parent.body}
                    </p>
                  )}
                  {r.quote && <blockquote className="mt-2 border-l-[3px] border-[#242424] pl-3 font-story text-[14px] italic text-[#6b6b6b] line-clamp-3">{r.quote}</blockquote>}
                  {r.status === 'DELETED'
                    ? <p className="mt-2 text-[14px] italic text-[#9b9b9b]">Deleted by the reader.</p>
                    : <div className="mt-2 text-[14px] leading-[22px] text-[#242424] [&_a]:underline [&_code]:rounded [&_code]:bg-[#f2f2f2] [&_code]:px-1 [&_p+p]:mt-2" dangerouslySetInnerHTML={{ __html: r.html }} />}

                  <div className="mt-3 flex flex-wrap items-center gap-1 text-[13px]">
                    {r.status !== 'DELETED' && (
                      <button type="button" onClick={() => { setReplyTo(replyTo === r.id ? null : r.id); setReply(''); }} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[#242424] hover:bg-[#f2f2f2]"><Reply className="h-3.5 w-3.5" /> Reply</button>
                    )}
                    {r.status === 'VISIBLE' && (
                      <>
                        <button type="button" onClick={() => act(r.id, { pinned: !r.pinned })} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[#242424] hover:bg-[#f2f2f2]"><Pin className="h-3.5 w-3.5" /> {r.pinned ? 'Unpin' : 'Pin'}</button>
                        <button type="button" onClick={() => act(r.id, { status: 'HIDDEN' })} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[#242424] hover:bg-[#f2f2f2]"><EyeOff className="h-3.5 w-3.5" /> Hide</button>
                      </>
                    )}
                    {r.status === 'HIDDEN' && (
                      <button type="button" onClick={() => act(r.id, { status: 'VISIBLE' })} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[#242424] hover:bg-[#f2f2f2]"><Eye className="h-3.5 w-3.5" /> Show</button>
                    )}
                    {r.reader && (
                      <button
                        type="button"
                        onClick={() => {
                          const ban = !r.reader!.banned;
                          if (!ban || confirm(`Ban ${r.reader!.name}? All their responses will be hidden and they can no longer respond, highlight or save stories.`)) act(r.id, { banReader: ban });
                        }}
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[#c94a4a] hover:bg-[#fdf1f1]"
                      >
                        <Ban className="h-3.5 w-3.5" /> {r.reader.banned ? 'Unban' : 'Ban reader'}
                      </button>
                    )}
                    <button type="button" onClick={() => remove(r.id)} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[#c94a4a] hover:bg-[#fdf1f1]"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                    {r.likeCount > 0 && <span className="ml-auto text-[#9b9b9b]">♥ {r.likeCount}</span>}
                  </div>

                  {replyTo === r.id && (
                    <div className="mt-3 rounded-md border border-[#e6e6e6] bg-white p-3">
                      <textarea
                        autoFocus
                        rows={3}
                        value={reply}
                        onChange={e => setReply(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply(r); }}
                        placeholder="Reply as the author…"
                        className="w-full resize-none text-[14px] outline-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setReplyTo(null)} className="rounded-full px-3 py-1 text-[13px] hover:bg-[#f2f2f2]">Cancel</button>
                        <button type="button" onClick={() => sendReply(r)} disabled={!reply.trim()} className="rounded-full bg-[#1a8917] px-3 py-1 text-[13px] text-white disabled:opacity-40">Reply</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AdminShell>
  );
}

export default function CommentsPage() {
  return <Suspense><Moderation /></Suspense>;
}
