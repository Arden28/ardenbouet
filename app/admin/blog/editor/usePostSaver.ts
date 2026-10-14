'use client';
// Serialized autosave for the story editor: one request in flight at a time, patches merged
// while waiting, optimistic-concurrency token (baseUpdatedAt) refreshed after every save.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EditorPost } from '@/lib/blog/admin';

export type SaveState = 'saved' | 'dirty' | 'saving' | 'error' | 'conflict';

export function usePostSaver(post: EditorPost | null, onSaved: (p: EditorPost) => void, postsApi = '/api/admin/blog/posts', delay = 1200) {
  const [state, setState] = useState<SaveState>('saved');
  const [error, setError] = useState('');
  const pending = useRef<Record<string, unknown>>({});
  const base = useRef<string | null>(post?.updatedAt ?? null);
  const inflight = useRef<Promise<boolean> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const id = post?.id;
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  useEffect(() => { if (post && !base.current) base.current = post.updatedAt; }, [post]);

  const flush = useCallback(async (): Promise<boolean> => {
    clearTimeout(timer.current);
    if (!id) return false;
    if (inflight.current) await inflight.current;
    const patch = pending.current;
    if (!Object.keys(patch).length) return true;
    pending.current = {};
    setState('saving');

    const run = (async () => {
      try {
        const res = await fetch(`${postsApi}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...patch, baseUpdatedAt: base.current }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          setState('conflict');
          setError(data.error);
          return false;
        }
        if (!res.ok) {
          // Keep the failed patch so the next save retries it (newer edits win).
          pending.current = { ...patch, ...pending.current };
          setState('error');
          setError(data.error || `Save failed (${res.status})`);
          return false;
        }
        base.current = data.post.updatedAt;
        onSavedRef.current(data.post);
        setError('');
        setState(Object.keys(pending.current).length ? 'dirty' : 'saved');
        return true;
      } catch {
        pending.current = { ...patch, ...pending.current };
        setState('error');
        setError('Network error — your changes will be retried.');
        return false;
      }
    })();
    inflight.current = run;
    const ok = await run;
    inflight.current = null;
    if (ok && Object.keys(pending.current).length) timer.current = setTimeout(flush, delay);
    return ok;
  }, [id, delay, postsApi]);

  const queue = useCallback((patch: Record<string, unknown>, immediate = false) => {
    pending.current = { ...pending.current, ...patch };
    setState(s => (s === 'conflict' ? s : 'dirty'));
    clearTimeout(timer.current);
    if (immediate) return flush();
    timer.current = setTimeout(flush, delay);
    return Promise.resolve(true);
  }, [flush, delay]);

  // Warn before leaving with unsaved edits; try a last save on hide.
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length || inflight.current) { e.preventDefault(); e.returnValue = ''; }
    };
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('visibilitychange', onHide);
    return () => { window.removeEventListener('beforeunload', beforeUnload); document.removeEventListener('visibilitychange', onHide); };
  }, [flush]);

  return { state, error, queue, flush };
}
