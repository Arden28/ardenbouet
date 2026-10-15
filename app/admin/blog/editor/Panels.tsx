'use client';
// Publish dialog (Medium "story preview"), story settings drawer and revision history drawer.
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ImagePlus, Loader2, Calendar, Send, RotateCcw, Trash2, Archive, EyeOff, Plus, History } from 'lucide-react';
import type { EditorPost } from '@/lib/blog/admin';
import { slugify } from '@/lib/blog/doc';
import { useEditorMedia } from './media';
import { useEditorEnv } from './env';

type Patch = (p: Partial<EditorPost> & Record<string, unknown>, immediate?: boolean) => Promise<boolean>;

function Overlay({ children, onClose, side }: { children: React.ReactNode; onClose: () => void; side?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return createPortal(
    <div className={`fixed inset-0 z-[120] flex bg-black/20 font-sans ${side ? 'justify-end' : 'items-center justify-center p-4'}`} onMouseDown={onClose}>
      <div onMouseDown={e => e.stopPropagation()} className={side ? 'h-full w-full max-w-[440px] overflow-y-auto bg-white shadow-2xl' : 'max-h-[92vh] w-full max-w-[1040px] overflow-y-auto rounded-xl bg-white shadow-2xl'}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

const label = 'mb-1.5 block text-[13px] font-medium text-[#242424]';
const input = 'w-full rounded-md border border-[#e6e6e6] px-3 py-2 text-[14px] text-[#242424] outline-none focus:border-[#242424]';
const help = 'mt-1 text-[12px] text-[#9b9b9b]';

function toLocalInput(iso: string | null) {
  const d = iso ? new Date(iso) : new Date(Date.now() + 24 * 3600_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ─── Cover picker ────────────────────────────────────────────────────────────

export function CoverPicker({ value, onChange, fallback }: { value: string | null; onChange: (v: string | null) => void; fallback?: string }) {
  const media = useEditorMedia();
  const [busy, setBusy] = useState(false);
  const shown = value || fallback;
  const upload = async () => {
    setBusy(true);
    try { const [url] = await media.pickImages(false); if (url) onChange(url); } catch (e) { alert((e as Error).message); }
    setBusy(false);
  };
  return (
    <div className="group relative aspect-[16/9] w-full overflow-hidden rounded-md bg-[#f6f6f6]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {shown && <img src={shown} alt="" className="h-full w-full object-cover" />}
      <div className={`absolute inset-0 flex items-center justify-center gap-2 ${shown ? 'bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100' : ''}`}>
        <button type="button" onClick={upload} className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] text-[#242424] shadow">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} {shown ? 'Change' : 'Choose cover'}
        </button>
        {value && <button type="button" onClick={() => onChange(null)} className="rounded-full bg-white px-4 py-2 text-[13px] text-[#242424] shadow">Remove</button>}
      </div>
      {!value && fallback && <span className="absolute left-2 top-2 rounded bg-white/90 px-2 py-0.5 text-[11px] text-[#6b6b6b]">Using first image</span>}
    </div>
  );
}

// ─── Tags ────────────────────────────────────────────────────────────────────

function TagInput({ value, onChange, suggestions }: { value: string[]; onChange: (v: string[]) => void; suggestions: string[] }) {
  const [draft, setDraft] = useState('');
  const add = (t: string) => {
    const tag = t.trim().toLowerCase().slice(0, 40);
    if (tag && !value.includes(tag) && value.length < 5) onChange([...value, tag]);
    setDraft('');
  };
  const sugg = suggestions.filter(s => !value.includes(s) && (!draft || s.includes(draft.toLowerCase()))).slice(0, 6);
  return (
    <div>
      <div className="flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-md border border-[#e6e6e6] bg-[#fafafa] p-1.5 focus-within:border-[#242424]">
        {value.map(t => (
          <span key={t} className="flex items-center gap-1 rounded bg-white px-2 py-1 text-[13px] text-[#242424] shadow-sm">
            {t}
            <button type="button" onClick={() => onChange(value.filter(x => x !== t))} aria-label={`Remove ${t}`} className="text-[#9b9b9b] hover:text-[#242424]"><X className="h-3 w-3" /></button>
          </span>
        ))}
        {value.length < 5 && (
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(draft); }
              if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
            }}
            onBlur={() => draft && add(draft)}
            placeholder={value.length ? '' : 'Add a topic…'}
            className="min-w-[120px] flex-1 bg-transparent px-1 text-[14px] outline-none"
          />
        )}
      </div>
      {sugg.length > 0 && value.length < 5 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {sugg.map(s => (
            <button key={s} type="button" onClick={() => add(s)} className="rounded-full bg-[#f2f2f2] px-2.5 py-1 text-[12px] text-[#242424] hover:bg-[#e6e6e6]">+ {s}</button>
          ))}
        </div>
      )}
      <p className={help}>Up to 5 topics help readers find your story.</p>
    </div>
  );
}

// ─── Publish dialog ──────────────────────────────────────────────────────────

export function PublishDialog({ post, patch, onClose, fallbackCover, tagSuggestions, subscriberCount }: {
  post: EditorPost; patch: Patch; onClose: () => void; fallbackCover?: string; tagSuggestions: string[]; subscriberCount: number | null;
}) {
  const env = useEditorEnv();
  const live = post.status === 'PUBLISHED';
  const review = !env.canPublish;
  const [donations, setDonations] = useState(post.donationsEnabled);
  const [mode, setMode] = useState<'now' | 'schedule'>(post.status === 'SCHEDULED' ? 'schedule' : 'now');
  const [when, setWhen] = useState(toLocalInput(post.scheduledAt));
  const [title, setTitle] = useState(post.title);
  const [subtitle, setSubtitle] = useState(post.subtitle);
  const [tags, setTags] = useState(post.tags);
  const [cover, setCover] = useState(post.coverUrl);
  const [notify, setNotify] = useState(env.role === 'admin' && !post.newsletterSentAt && !live);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!title.trim()) { setError('Add a title before publishing.'); return; }
    setBusy(true);
    setError('');
    const base = { title, subtitle, tags, coverUrl: cover, donationsEnabled: donations };
    const ok = mode === 'schedule'
      ? await patch({ ...base, status: 'SCHEDULED', scheduledAt: new Date(when).toISOString() }, true)
      : await patch({ ...base, status: 'PUBLISHED' }, true);
    if (!ok) { setBusy(false); setError('Could not publish, check the error in the top bar.'); return; }
    if (notify && mode === 'now') {
      const res = await fetch(`/api/admin/blog/posts/${post.id}/newsletter`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) alert(`Published, but the newsletter was not sent: ${d.error ?? res.status}`);
      else if (d.failed) alert(`Newsletter: ${d.sent} sent, ${d.failed} failed (is Mailgun configured?)`);
    }
    setBusy(false);
    onClose();
  };

  return (
    <Overlay onClose={onClose}>
      <div className="relative grid gap-10 p-8 md:grid-cols-2 md:p-14">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-5 top-5 rounded p-1 text-[#6b6b6b] hover:bg-[#f2f2f2]"><X className="h-5 w-5" /></button>
        <section>
          <h2 className="text-[19px] font-bold text-[#242424]">Story preview</h2>
          <div className="mt-5"><CoverPicker value={cover} onChange={setCover} fallback={fallbackCover} /></div>
          <p className={help}>Shown on the blog home, in social previews and in newsletters.</p>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Write a preview title" className="mt-5 w-full border-b border-[#e6e6e6] pb-2 text-[18px] font-bold text-[#242424] outline-none focus:border-[#242424]" />
          <input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Write a preview subtitle…" className="mt-3 w-full border-b border-[#e6e6e6] pb-2 text-[15px] text-[#6b6b6b] outline-none focus:border-[#242424]" />
          <p className={help}><b>Note:</b> changes here also change the story’s title and subtitle.</p>
        </section>

        <section className="flex flex-col">
          <p className="text-[15px] text-[#6b6b6b]">Publishing to: <b className="text-[#242424]">Arden BOUET · Blog</b></p>
          <div className="mt-6">
            <span className={label}>Topics</span>
            <TagInput value={tags} onChange={setTags} suggestions={tagSuggestions} />
          </div>

          {!live && !review && (
            <div className="mt-6">
              <span className={label}>When</span>
              <div className="flex gap-2">
                {(['now', 'schedule'] as const).map(m => (
                  <button key={m} type="button" onClick={() => setMode(m)} className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-[13px] ${mode === m ? 'border-[#242424] bg-[#242424] text-white' : 'border-[#e6e6e6] text-[#242424]'}`}>
                    {m === 'now' ? <Send className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />} {m === 'now' ? 'Publish now' : 'Schedule'}
                  </button>
                ))}
              </div>
              {mode === 'schedule' && (
                <input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} min={toLocalInput(new Date().toISOString())} className={`${input} mt-3`} />
              )}
            </div>
          )}

          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-md border border-[#e6e6e6] p-3">
            <input type="checkbox" checked={donations} disabled={!env.donationsReady} onChange={e => setDonations(e.target.checked)} className="mt-1 h-4 w-4 accent-[#1a8917]" />
            <span className="text-[14px] text-[#242424]">
              Accept donations on this story
              <span className="block text-[12px] text-[#9b9b9b]">
                {env.donationsReady ? 'Readers can support the writer with a one-time tip at the end of the story.' : 'Connect Stripe in Account → Earnings to accept donations.'}
              </span>
            </span>
          </label>

          {review && <p className="mt-6 rounded-md bg-[#fdf6e7] px-3 py-2.5 text-[13px] text-[#7a5a00]">Your stories are reviewed before they go live. You’ll get an email once it’s published.</p>}

          {env.role === 'admin' && !post.newsletterSentAt && mode === 'now' && (
            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-md border border-[#e6e6e6] p-3">
              <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} className="mt-1 h-4 w-4 accent-[#1a8917]" />
              <span className="text-[14px] text-[#242424]">
                Email this story to subscribers
                <span className="block text-[12px] text-[#9b9b9b]">
                  {subscriberCount === null ? 'Loading audience…' : `${subscriberCount} active subscriber${subscriberCount === 1 ? '' : 's'}`}
                </span>
              </span>
            </label>
          )}
          {env.role === 'admin' && post.newsletterSentAt && <p className="mt-6 text-[13px] text-[#6b6b6b]">Newsletter already sent on {new Date(post.newsletterSentAt).toLocaleDateString()}.</p>}

          {error && <p className="mt-4 text-[13px] text-[#c94a4a]">{error}</p>}
          <div className="mt-auto flex items-center gap-3 pt-10">
            <button type="button" onClick={submit} disabled={busy} className="flex items-center gap-2 rounded-full bg-[#1a8917] px-5 py-2.5 text-[14px] text-white hover:bg-[#156d12] disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {live ? 'Update story' : review ? (post.status === 'REVIEW' ? 'Update submission' : 'Submit for review') : mode === 'schedule' ? 'Schedule' : 'Publish now'}
            </button>
            <button type="button" onClick={onClose} className="rounded-full px-4 py-2.5 text-[14px] text-[#242424] hover:bg-[#f2f2f2]">Cancel</button>
          </div>
        </section>
      </div>
    </Overlay>
  );
}

// ─── Settings drawer ─────────────────────────────────────────────────────────

type Series = { id: string; title: string; posts: { id: string }[] };

export function SettingsDrawer({ post, patch, onClose, onDeleted, fallbackCover, tagSuggestions }: {
  post: EditorPost; patch: Patch; onClose: () => void; onDeleted: () => void; fallbackCover?: string; tagSuggestions: string[];
}) {
  const env = useEditorEnv();
  const isAdmin = env.role === 'admin';
  const [slug, setSlug] = useState(post.slug);
  const [slugErr, setSlugErr] = useState('');
  const [series, setSeries] = useState<Series[] | null>(null);
  const [newSeries, setNewSeries] = useState('');

  useEffect(() => { if (!isAdmin) return; fetch('/api/admin/blog/series').then(r => r.json()).then(d => setSeries(d.series ?? [])).catch(() => setSeries([])); }, []);

  const saveSlug = async () => {
    const s = slugify(slug);
    setSlug(s);
    if (!s || s === post.slug) return;
    setSlugErr('');
    const ok = await patch({ slug: s }, true);
    if (!ok) setSlugErr('Slug not saved, it may be taken or reserved.');
  };

  const createSeries = async () => {
    if (!newSeries.trim()) return;
    const res = await fetch('/api/admin/blog/series', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newSeries }) });
    const d = await res.json();
    if (res.ok) {
      setSeries(s => [{ ...d.series, posts: [] }, ...(s ?? [])]);
      setNewSeries('');
      patch({ seriesId: d.series.id });
    }
  };

  const seoTitle = post.seoTitle || post.title || 'Untitled story';
  const seoDesc = post.seoDescription || post.subtitle || post.excerpt;

  return (
    <Overlay onClose={onClose} side>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#f2f2f2] bg-white px-6 py-4">
        <h2 className="text-[16px] font-semibold text-[#242424]">Story settings</h2>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-[#6b6b6b] hover:bg-[#f2f2f2]"><X className="h-5 w-5" /></button>
      </div>
      <div className="space-y-7 px-6 py-6">
        <section>
          <span className={label}>Cover image</span>
          <CoverPicker value={post.coverUrl} onChange={v => patch({ coverUrl: v })} fallback={fallbackCover} />
          <input value={post.coverAlt ?? ''} onChange={e => patch({ coverAlt: e.target.value })} placeholder="Alt text" className={`${input} mt-2`} />
          <input value={post.coverCaption ?? ''} onChange={e => patch({ coverCaption: e.target.value })} placeholder="Caption (optional)" className={`${input} mt-2`} />
        </section>

        <section>
          <span className={label}>Topics</span>
          <TagInput value={post.tags} onChange={tags => patch({ tags })} suggestions={tagSuggestions} />
        </section>

        <section>
          <label className={label} htmlFor="st-slug">URL</label>
          <div className="flex items-center rounded-md border border-[#e6e6e6] focus-within:border-[#242424]">
            <span className="pl-3 text-[13px] text-[#9b9b9b]">/blog/</span>
            <input id="st-slug" value={slug} onChange={e => setSlug(e.target.value)} onBlur={saveSlug} onKeyDown={e => e.key === 'Enter' && saveSlug()} className="min-w-0 flex-1 bg-transparent px-1 py-2 text-[14px] outline-none" />
          </div>
          {slugErr ? <p className="mt-1 text-[12px] text-[#c94a4a]">{slugErr}</p> : post.status === 'PUBLISHED' && <p className={help}>Changing the URL of a published story breaks existing links.</p>}
        </section>

        <section>
          <label className={label} htmlFor="st-excerpt">Excerpt</label>
          <textarea id="st-excerpt" rows={3} value={post.excerpt} onChange={e => patch({ excerpt: e.target.value })} placeholder="Auto-generated from the first paragraph if empty" className={input} />
        </section>

        {isAdmin && <section>
          <span className={label}>Series</span>
          <select
            value={post.seriesId ?? ''}
            onChange={e => patch({ seriesId: e.target.value || null })}
            className={input}
            disabled={series === null}
          >
            <option value="">Not part of a series</option>
            {series?.map(s => <option key={s.id} value={s.id}>{s.title} ({s.posts.length})</option>)}
          </select>
          {post.seriesId && (() => {
            const s = series?.find(x => x.id === post.seriesId);
            const at = s ? s.posts.findIndex(p => p.id === post.id) : -1;
            return (
              <p className="mt-2 text-[13px] text-[#6b6b6b]">
                {at >= 0 ? `Part ${at + 1} of ${s!.posts.length}` : 'Added as the last part'} ·{' '}
                <a href="/admin/blog/series" target="_blank" rel="noopener noreferrer" className="text-[#1a8917] hover:underline">Reorder in Series</a>
              </p>
            );
          })()}
          <div className="mt-2 flex gap-2">
            <input value={newSeries} onChange={e => setNewSeries(e.target.value)} placeholder="New series title" className={input} onKeyDown={e => e.key === 'Enter' && createSeries()} />
            <button type="button" onClick={createSeries} className="flex shrink-0 items-center gap-1 rounded-md border border-[#e6e6e6] px-3 text-[13px] hover:border-[#242424]"><Plus className="h-4 w-4" /> Create</button>
          </div>
        </section>}

        <section>
          <span className={label}>Search & social</span>
          <div className="rounded-md border border-[#f2f2f2] bg-[#fafafa] p-3">
            <p className="truncate text-[12px] text-[#1a6b2a]">ardenbouet.me › blog › {post.slug}</p>
            <p className="truncate text-[17px] text-[#1a0dab]">{seoTitle}</p>
            <p className="line-clamp-2 text-[13px] text-[#4d5156]">{seoDesc || 'Add a subtitle or SEO description.'}</p>
          </div>
          <input value={post.seoTitle ?? ''} onChange={e => patch({ seoTitle: e.target.value })} placeholder="SEO title (defaults to the story title)" className={`${input} mt-2`} />
          <textarea rows={2} value={post.seoDescription ?? ''} onChange={e => patch({ seoDescription: e.target.value })} placeholder="SEO description (defaults to the subtitle)" className={`${input} mt-2`} />
          <p className={help}>{(post.seoDescription || seoDesc || '').length}/160 characters</p>
          {isAdmin && <input value={post.canonicalUrl ?? ''} onChange={e => patch({ canonicalUrl: e.target.value })} placeholder="Canonical URL (if first published elsewhere)" className={`${input} mt-2`} />}
        </section>

        <section className="space-y-3">
          <span className={label}>Options</span>
          {([
            ...(isAdmin ? [['featured', 'Feature this story', 'Pinned in the “Featured” sidebar and marked with a star.'] as const] : []),
            ['commentsOpen', 'Allow responses', 'Readers can respond and reply to each other.'] as const,
            ...(env.donationsReady ? [['donationsEnabled', 'Accept donations', 'Show a “Support the writer” button at the end of the story.'] as const] : []),
          ]).map(([key, title, desc]) => (
            <label key={key} className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={!!post[key]} onChange={e => patch({ [key]: e.target.checked })} className="mt-1 h-4 w-4 accent-[#1a8917]" />
              <span className="text-[14px] text-[#242424]">{title}<span className="block text-[12px] text-[#9b9b9b]">{desc}</span></span>
            </label>
          ))}
          <div className="flex items-center gap-3">
            <span className="text-[14px] text-[#242424]">Language</span>
            <select value={post.language} onChange={e => patch({ language: e.target.value })} className={`${input} w-auto`}>
              <option value="en">English</option><option value="fr">Français</option><option value="both">Both</option>
            </select>
          </div>
        </section>

        <section className="space-y-2 border-t border-[#f2f2f2] pt-6">
          {(post.status === 'PUBLISHED' || post.status === 'SCHEDULED') && (
            <button type="button" onClick={() => patch({ status: 'DRAFT' }, true)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[14px] text-[#242424] hover:bg-[#f6f6f6]">
              <EyeOff className="h-4 w-4" /> Unpublish (back to draft)
            </button>
          )}
          {post.status !== 'ARCHIVED' && (
            <button type="button" onClick={() => patch({ status: 'ARCHIVED' }, true)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[14px] text-[#242424] hover:bg-[#f6f6f6]">
              <Archive className="h-4 w-4" /> Archive
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              if (!confirm('Delete this story permanently? Responses, claps and highlights are deleted too.')) return;
              await fetch(`${env.postsApi}/${post.id}`, { method: 'DELETE' });
              onDeleted();
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[14px] text-[#c94a4a] hover:bg-[#fdf1f1]"
          >
            <Trash2 className="h-4 w-4" /> Delete story
          </button>
        </section>
      </div>
    </Overlay>
  );
}

// ─── Revisions drawer ────────────────────────────────────────────────────────

type Revision = { id: string; createdAt: string; label: string; title: string; subtitle: string; content: unknown; bodyMd: string | null };

function revisionText(content: unknown): string {
  const out: string[] = [];
  const walk = (n: { text?: string; content?: unknown[] } | undefined) => {
    if (!n || out.join(' ').length > 400) return;
    if (n.text) out.push(n.text);
    (n.content as typeof n[] | undefined)?.forEach(walk);
  };
  walk(content as { content?: unknown[] });
  return out.join(' ');
}

export function RevisionsDrawer({ postId, onRestore, onClose }: {
  postId: string; onRestore: (r: Revision) => void; onClose: () => void;
}) {
  const env = useEditorEnv();
  const [revs, setRevs] = useState<Revision[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const load = () => fetch(`${env.postsApi}/${postId}/revisions`).then(r => r.json()).then(d => setRevs(d.revisions ?? [])).catch(() => setRevs([]));
  useEffect(() => { load(); }, [postId]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveNow = async () => {
    const lbl = window.prompt('Name this version', 'Saved version');
    if (lbl === null) return;
    await fetch(`${env.postsApi}/${postId}/revisions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label: lbl }) });
    load();
  };
  const selected = useMemo(() => revs?.find(r => r.id === active), [revs, active]);

  return (
    <Overlay onClose={onClose} side>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#f2f2f2] bg-white px-6 py-4">
        <h2 className="flex items-center gap-2 text-[16px] font-semibold text-[#242424]"><History className="h-4 w-4" /> Version history</h2>
        <div className="flex items-center gap-2">
          <button type="button" onClick={saveNow} className="rounded-full border border-[#e6e6e6] px-3 py-1 text-[13px] hover:border-[#242424]">Save version</button>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-[#6b6b6b] hover:bg-[#f2f2f2]"><X className="h-5 w-5" /></button>
        </div>
      </div>
      <p className="px-6 pt-4 text-[12px] text-[#9b9b9b]">A version is saved automatically every 10 minutes while you write, and whenever you publish.</p>
      <ul className="px-3 py-3">
        {revs === null && <li className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-[#9b9b9b]" /></li>}
        {revs?.length === 0 && <li className="py-10 text-center text-[14px] text-[#9b9b9b]">No versions yet.</li>}
        {revs?.map(r => (
          <li key={r.id}>
            <button type="button" onClick={() => setActive(a => (a === r.id ? null : r.id))} className={`w-full rounded-md px-3 py-2.5 text-left ${active === r.id ? 'bg-[#f2f2f2]' : 'hover:bg-[#f9f9f9]'}`}>
              <span className="flex items-center justify-between gap-2">
                <span className="text-[14px] text-[#242424]">{new Date(r.createdAt).toLocaleString()}</span>
                <span className="rounded bg-white px-1.5 text-[11px] text-[#6b6b6b] shadow-sm">{r.label}</span>
              </span>
              <span className="block truncate text-[13px] text-[#6b6b6b]">{r.title || 'Untitled'}</span>
            </button>
            {selected?.id === r.id && (
              <div className="mx-3 mb-3 rounded-b-md border border-t-0 border-[#f2f2f2] p-3">
                <p className="line-clamp-6 font-story text-[14px] leading-6 text-[#6b6b6b]">{revisionText(r.content) || r.bodyMd?.slice(0, 400) || 'Empty'}</p>
                <button
                  type="button"
                  onClick={() => { if (confirm('Replace the current story with this version? The current text is saved as a version first.')) onRestore(r); }}
                  className="mt-3 flex items-center gap-2 rounded-full bg-[#242424] px-3 py-1.5 text-[13px] text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Restore this version
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Overlay>
  );
}
