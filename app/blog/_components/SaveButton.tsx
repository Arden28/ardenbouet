'use client';
// Bookmark ("Save") toggle. Bookmarked slugs are fetched once per page and shared by every button.
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useBlog, useReader } from './ReaderProvider';

let slugs: Set<string> = new Set();
let loadedFor: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

async function load(readerId: string) {
  if (loadedFor === readerId) return;
  loadedFor = readerId;
  try {
    const res = await fetch('/api/blog/bookmarks', { cache: 'no-store' });
    const data = await res.json();
    slugs = new Set<string>(data.slugs ?? []);
    emit();
  } catch { loadedFor = null; }
}

export function useBookmarked(slug: string): [boolean, (v: boolean) => void] {
  const has = useSyncExternalStore(subscribe, () => slugs.has(slug), () => false);
  const set = (v: boolean) => {
    slugs = new Set(slugs);
    if (v) slugs.add(slug); else slugs.delete(slug);
    emit();
  };
  return [has, set];
}

export function SaveButton({ slug, size = 'sm' }: { slug: string; size?: 'sm' | 'md' }) {
  const { t, openSignIn } = useBlog();
  const { reader } = useReader();
  const [saved, setSaved] = useBookmarked(slug);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (reader) load(reader.id); }, [reader]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!reader) return openSignIn(t('readingListSignIn'));
    if (busy) return;
    setBusy(true);
    const next = !saved;
    setSaved(next);
    try {
      const res = await fetch(`/api/blog/posts/${encodeURIComponent(slug)}/bookmark`, { method: next ? 'POST' : 'DELETE' });
      if (!res.ok) setSaved(!next);
    } catch { setSaved(!next); }
    setBusy(false);
  };

  const dim = size === 'md' ? 'h-6 w-6' : 'h-5 w-5';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? t('saved') : t('save')}
      title={saved ? t('saved') : t('save')}
      className="rounded p-1 text-[#6b6b6b] transition-colors hover:text-[#242424]"
    >
      <svg viewBox="0 0 24 24" className={dim} fill={saved ? '#242424' : 'none'} stroke={saved ? '#242424' : 'currentColor'} strokeWidth="1.3" aria-hidden>
        <path d="M17.5 2.5h-11a1 1 0 0 0-1 1v18l6.5-4.6 6.5 4.6v-18a1 1 0 0 0-1-1z" strokeLinejoin="round" />
        {!saved && <path d="M12 7.5v5M9.5 10h5" strokeLinecap="round" />}
      </svg>
    </button>
  );
}
