'use client';
// Shared, cached fetch of everything a story can embed (see /api/admin/blog/embeddables).
import { useEffect, useState } from 'react';
import type { ContentCardKind } from '@/lib/blog/doc';

export type Embeddable = { id: string; title: string; subtitle?: string; image?: string; meta?: string; status?: string };
export type Embeddables = Record<ContentCardKind, Embeddable[]>;

const cache = new Map<string, Embeddables>();
const inflight = new Map<string, Promise<Embeddables>>();
let currentUrl = '/api/admin/blog/embeddables';

/** Which endpoint the editor uses (admin vs writer). Set by StoryEditor. */
export function setEmbeddablesUrl(url: string) { currentUrl = url; }

export function loadEmbeddables(force = false, url = currentUrl): Promise<Embeddables> {
  const hit = cache.get(url);
  if (hit && !force) return Promise.resolve(hit);
  let p = inflight.get(url);
  if (!p || force) {
    p = fetch(url, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { product: [], project: [], experience: [], post: [] }))
      .then(d => { cache.set(url, d as Embeddables); return d as Embeddables; })
      .finally(() => { inflight.delete(url); });
    inflight.set(url, p);
  }
  return p;
}

export function useEmbeddables(): Embeddables | null {
  const [data, setData] = useState<Embeddables | null>(cache.get(currentUrl) ?? null);
  useEffect(() => {
    let alive = true;
    loadEmbeddables().then(d => { if (alive) setData(d); });
    return () => { alive = false; };
  }, []);
  return data;
}
