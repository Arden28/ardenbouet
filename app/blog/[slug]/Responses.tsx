'use client';
// Medium-style responses: threaded (3 levels), likes, edit/delete own, quoted highlights, author badge.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Heart, MoreHorizontal, X, Pin, BadgeCheck } from 'lucide-react';
import { useBlog, useReader } from '../_components/ReaderProvider';
import { Avatar } from '../_components/BlogHeader';
import { useStory } from './StoryClient';
import type { BlogLocale } from '@/lib/blog/strings';

type CommentDTO = {
  id: string;
  parentId: string | null;
  html: string;
  body: string;
  quote: string | null;
  createdAt: string;
  editedAt: string | null;
  isAuthor: boolean;
  pinned: boolean;
  deleted: boolean;
  likeCount: number;
  likedByMe: boolean;
  mine: boolean;
  author: { name: string; image: string | null };
  replies: CommentDTO[];
};

function timeAgo(iso: string, locale: BlogLocale) {
  const rtf = new Intl.RelativeTimeFormat(locale === 'fr' ? 'fr' : 'en', { numeric: 'auto' });
  const s = (new Date(iso).getTime() - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [u, sec] of units) if (Math.abs(s) >= sec) return rtf.format(Math.round(s / sec), u);
  return rtf.format(0, 'second');
}

function mapTree(list: CommentDTO[], fn: (c: CommentDTO) => CommentDTO | null): CommentDTO[] {
  return list.flatMap(c => {
    const next = fn(c);
    if (!next) return [];
    return [{ ...next, replies: mapTree(next.replies, fn) }];
  });
}

function countVisible(list: CommentDTO[]): number {
  return list.reduce((n, c) => n + (c.deleted ? 0 : 1) + countVisible(c.replies), 0);
}

// ─── Composer ────────────────────────────────────────────────────────────────

function Composer({ onSubmit, initial = '', quote, onClearQuote, onCancel, autoFocus, compact, submitLabel }: {
  onSubmit: (body: string) => Promise<boolean>;
  initial?: string;
  quote?: string | null;
  onClearQuote?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  compact?: boolean;
  submitLabel?: string;
}) {
  const { t } = useBlog();
  const { reader } = useReader();
  const [body, setBody] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(!!autoFocus || !!initial || !!quote);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (quote) { setFocused(true); ref.current?.focus(); } }, [quote]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(400, el.scrollHeight)}px`;
  }, [body, focused]);

  const submit = async () => {
    if (!body.trim() || busy) return;
    setBusy(true);
    const ok = await onSubmit(body.trim());
    setBusy(false);
    if (ok) { setBody(''); if (!compact) setFocused(false); }
  };

  return (
    <div className={compact ? '' : 'rounded-md shadow-[0_2px_8px_rgba(0,0,0,0.12)]'}>
      {!compact && focused && reader && (
        <div className="flex items-center gap-3 px-4 pt-4">
          <Avatar name={reader.name} image={reader.image} size={32} />
          <span className="text-[14px] text-[#242424]">{reader.name}</span>
        </div>
      )}
      {quote && (
        <div className="mx-4 mt-3 flex items-start gap-2 border-l-[3px] border-[#242424] pl-3">
          <p className="flex-1 font-story text-[15px] italic leading-6 text-[#6b6b6b] line-clamp-3">{quote}</p>
          {onClearQuote && (
            <button type="button" onClick={onClearQuote} aria-label={t('cancel')} className="text-[#9b9b9b] hover:text-[#242424]"><X className="h-4 w-4" /></button>
          )}
        </div>
      )}
      <textarea
        ref={ref}
        value={body}
        onChange={e => setBody(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); } }}
        placeholder={t('whatAreYourThoughts')}
        maxLength={5000}
        rows={focused ? 3 : 1}
        autoFocus={autoFocus}
        className={`block w-full resize-none bg-transparent text-[14px] leading-[22px] text-[#242424] outline-none placeholder:text-[#9b9b9b] ${compact ? 'rounded-md border border-[#e6e6e6] px-3 py-2 focus:border-[#242424]' : 'px-4 py-4'}`}
      />
      {focused && (
        <div className={`flex items-center justify-end gap-3 ${compact ? 'pt-2' : 'px-4 pb-4'}`}>
          {body.length > 4500 && <span className="mr-auto text-[12px] text-[#9b9b9b]">{body.length}/5000</span>}
          <button
            type="button"
            onClick={() => { setBody(initial); setFocused(false); onClearQuote?.(); onCancel?.(); }}
            className="px-2 text-[14px] text-[#242424] hover:text-black"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!body.trim() || busy}
            className="rounded-full bg-[#1a8917] px-4 py-1.5 text-[14px] text-white transition-colors hover:bg-[#156d12] disabled:bg-[#1a8917]/40"
          >
            {submitLabel ?? t('respond')}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Item ─────────────────────────────────────────────────────────────────────

function CommentItem({ c, depth, api }: {
  c: CommentDTO;
  depth: number;
  api: {
    reply: (parentId: string, body: string) => Promise<boolean>;
    edit: (id: string, body: string) => Promise<boolean>;
    remove: (id: string) => Promise<void>;
    like: (id: string) => Promise<void>;
  };
}) {
  const { t, locale, openSignIn } = useBlog();
  const { reader } = useReader();
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [menu, setMenu] = useState(false);
  const [showReplies, setShowReplies] = useState(depth > 0 || c.replies.length <= 2);
  const replyCount = countVisible(c.replies);

  return (
    <div className={depth === 0 ? 'border-b border-[#f2f2f2] py-6' : 'pt-5'}>
      {c.pinned && (
        <p className="mb-2 flex items-center gap-1.5 text-[12px] text-[#6b6b6b]"><Pin className="h-3.5 w-3.5" /> {t('pinned')}</p>
      )}
      {c.deleted ? (
        <p className="text-[14px] italic text-[#9b9b9b]">{t('deletedComment')}</p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <Avatar name={c.author.name} image={c.author.image} size={32} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[14px] text-[#242424]">
                <span className="truncate">{c.author.name}</span>
                {c.isAuthor && (
                  <span className="flex items-center gap-0.5 rounded bg-[#242424] px-1.5 py-px text-[11px] font-medium text-white">
                    <BadgeCheck className="h-3 w-3" /> {t('author')}
                  </span>
                )}
              </p>
              <p className="text-[13px] text-[#6b6b6b]">
                {timeAgo(c.createdAt, locale)}
                {c.editedAt && <span> · {t('edited')}</span>}
              </p>
            </div>
            {c.mine && !editing && (
              <div className="relative">
                <button type="button" onClick={() => setMenu(m => !m)} aria-label="More" className="rounded p-1 text-[#6b6b6b] hover:text-[#242424]">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
                {menu && (
                  <div className="absolute right-0 top-8 z-20 w-36 rounded-md border border-[#f2f2f2] bg-white py-1 text-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.12)]" onMouseLeave={() => setMenu(false)}>
                    <button type="button" onClick={() => { setEditing(true); setMenu(false); }} className="block w-full px-4 py-2 text-left text-[#6b6b6b] hover:text-[#242424]">{t('edit')}</button>
                    <button
                      type="button"
                      onClick={() => { setMenu(false); if (confirm(t('deleteConfirm'))) api.remove(c.id); }}
                      className="block w-full px-4 py-2 text-left text-[#c94a4a] hover:text-[#a33]"
                    >
                      {t('delete')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {c.quote && (
            <blockquote className="mt-3 border-l-[3px] border-[#242424] pl-3 font-story text-[15px] italic leading-6 text-[#6b6b6b] line-clamp-4">
              {c.quote}
            </blockquote>
          )}

          {editing ? (
            <div className="mt-3">
              <Composer
                compact
                autoFocus
                initial={c.body}
                submitLabel={t('save')}
                onCancel={() => setEditing(false)}
                onSubmit={async b => { const ok = await api.edit(c.id, b); if (ok) setEditing(false); return ok; }}
              />
            </div>
          ) : (
            <div
              className="comment-body mt-3 text-[14px] leading-[22px] text-[#242424] [&_a]:underline [&_code]:rounded [&_code]:bg-[#f2f2f2] [&_code]:px-1 [&_p+p]:mt-3 [&_pre]:mt-2 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-[#f9f9f9] [&_pre]:p-3 [&_pre]:text-[13px]"
              dangerouslySetInnerHTML={{ __html: c.html }}
            />
          )}

          <div className="mt-3 flex items-center gap-5 text-[14px] text-[#6b6b6b]">
            <button
              type="button"
              onClick={() => (reader ? api.like(c.id) : openSignIn())}
              className={`flex items-center gap-1.5 hover:text-[#242424] ${c.likedByMe ? 'text-[#242424]' : ''}`}
              aria-pressed={c.likedByMe}
            >
              <Heart className={`h-[18px] w-[18px] ${c.likedByMe ? 'fill-[#c94a4a] text-[#c94a4a]' : ''}`} strokeWidth={1.4} />
              {c.likeCount > 0 && c.likeCount}
            </button>
            {replyCount > 0 && depth === 0 && (
              <button type="button" onClick={() => setShowReplies(s => !s)} className="hover:text-[#242424]">
                {showReplies ? t('hideReplies') : t('replies', { n: replyCount })}
              </button>
            )}
            <button
              type="button"
              onClick={() => (reader ? setReplying(r => !r) : openSignIn())}
              className="ml-auto text-[#242424] hover:underline"
            >
              {t('reply')}
            </button>
          </div>
        </>
      )}

      {replying && (
        <div className="mt-4 border-l-[3px] border-[#f2f2f2] pl-5">
          <Composer
            compact
            autoFocus
            submitLabel={t('reply')}
            onCancel={() => setReplying(false)}
            onSubmit={async b => { const ok = await api.reply(c.id, b); if (ok) { setReplying(false); setShowReplies(true); } return ok; }}
          />
        </div>
      )}

      {showReplies && c.replies.length > 0 && (
        <div className="mt-1 border-l-[3px] border-[#f2f2f2] pl-5">
          {c.replies.map(r => <CommentItem key={r.id} c={r} depth={depth + 1} api={api} />)}
        </div>
      )}
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

export function Responses({ commentsOpen }: { commentsOpen: boolean }) {
  const { t, openSignIn } = useBlog();
  const { reader } = useReader();
  const { slug, setState, pendingQuote, clearQuote, interactive } = useStory();
  const [comments, setComments] = useState<CommentDTO[] | null>(null);
  const [sort, setSort] = useState<'relevant' | 'newest'>('relevant');
  const [error, setError] = useState('');
  const base = `/api/blog/posts/${encodeURIComponent(slug)}/comments`;

  const load = useCallback(async () => {
    try {
      const res = await fetch(base, { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setComments(d.comments);
      setState(s => ({ ...s, responses: d.count }));
    } catch { setComments([]); }
  }, [base, setState]);

  useEffect(() => { if (interactive) load(); else setComments([]); }, [load, interactive, reader?.id]);

  const fail = async (res: Response | null) => {
    if (res?.status === 429) setError(t('tooFast'));
    else if (res?.status === 401) openSignIn();
    else { try { setError((await res?.json())?.error || t('genericError')); } catch { setError(t('genericError')); } }
    return false;
  };

  const post = async (body: string, parentId?: string, quote?: string | null) => {
    setError('');
    const res = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, parentId, quote }),
    }).catch(() => null);
    if (!res?.ok) return fail(res);
    await load();
    return true;
  };

  const api = {
    reply: (parentId: string, body: string) => post(body, parentId),
    edit: async (id: string, body: string) => {
      setError('');
      const res = await fetch(`/api/blog/comments/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }),
      }).catch(() => null);
      if (!res?.ok) return fail(res);
      const { comment } = await res.json();
      setComments(cs => cs && mapTree(cs, c => (c.id === id ? { ...comment, replies: c.replies } : c)));
      return true;
    },
    remove: async (id: string) => {
      const res = await fetch(`/api/blog/comments/${id}`, { method: 'DELETE' }).catch(() => null);
      if (res?.ok) await load(); else await fail(res);
    },
    like: async (id: string) => {
      setComments(cs => cs && mapTree(cs, c => (c.id === id ? { ...c, likedByMe: !c.likedByMe, likeCount: c.likeCount + (c.likedByMe ? -1 : 1) } : c)));
      const res = await fetch(`/api/blog/comments/${id}/like`, { method: 'POST' }).catch(() => null);
      if (res?.ok) {
        const d = await res.json();
        setComments(cs => cs && mapTree(cs, c => (c.id === id ? { ...c, likedByMe: d.liked, likeCount: d.likeCount } : c)));
      }
    },
  };

  const sorted = useMemo(() => {
    if (!comments) return null;
    const list = [...comments];
    if (sort === 'newest') return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return list.sort((a, b) =>
      Number(b.pinned) - Number(a.pinned) ||
      (b.likeCount + countVisible(b.replies) * 2) - (a.likeCount + countVisible(a.replies) * 2) ||
      +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [comments, sort]);

  const total = comments ? countVisible(comments) : 0;

  return (
    <section id="responses" className="scroll-mt-24">
      <div className="flex items-center justify-between">
        <h2 className="text-[20px] font-bold tracking-[-0.01em] text-[#242424]">{t('responsesCount', { n: total })}</h2>
        {total > 1 && (
          <select
            value={sort}
            onChange={e => setSort(e.target.value as 'relevant' | 'newest')}
            className="cursor-pointer bg-transparent text-[13px] uppercase tracking-[0.04em] text-[#242424] outline-none"
            aria-label="Sort responses"
          >
            <option value="relevant">{t('mostRelevant')}</option>
            <option value="newest">{t('newest')}</option>
          </select>
        )}
      </div>

      <div className="mt-6">
        {!commentsOpen ? (
          <p className="text-[14px] text-[#6b6b6b]">{t('commentsClosed')}</p>
        ) : reader ? (
          <Composer
            quote={pendingQuote}
            onClearQuote={clearQuote}
            onSubmit={async b => { const ok = await post(b, undefined, pendingQuote); if (ok) clearQuote(); return ok; }}
          />
        ) : (
          <button
            type="button"
            onClick={() => openSignIn()}
            className="w-full rounded-md px-4 py-4 text-left text-[14px] text-[#9b9b9b] shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:text-[#6b6b6b]"
          >
            {t('whatAreYourThoughts')}
          </button>
        )}
        {error && <p className="mt-3 text-[13px] text-[#c94a4a]">{error}</p>}
      </div>

      <div className="mt-4">
        {sorted === null ? (
          <div className="space-y-6 py-6">
            {[0, 1].map(i => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-[#f2f2f2]" /><div className="h-3 w-32 rounded bg-[#f2f2f2]" /></div>
                <div className="h-3 w-full rounded bg-[#f2f2f2]" />
                <div className="h-3 w-2/3 rounded bg-[#f2f2f2]" />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          commentsOpen && <p className="py-8 text-[14px] text-[#6b6b6b]">{t('noResponses')}</p>
        ) : (
          sorted.map(c => <CommentItem key={c.id} c={c} depth={0} api={api} />)
        )}
      </div>
    </section>
  );
}
