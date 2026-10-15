'use client';
// Shared, cached fetch of everything a story can embed (see /api/admin/blog/embeddables).
import { useEffect, useState } from 'react';
import type { ContentCardKind } from '@/lib/blog/doc';

export type Embeddable = { id: string; title: string; subtitle?: string; image?: string; meta?: string; status?: string };
export type Embeddables = Record<ContentCardKind, Embeddable[]>;

let cache: Embeddables | null = null;
let inflight: Promise<Embeddables> | null = null;

export function loadEmbeddables(force = false): Promise<Embeddables> {
  if (cache && !force) return Promise.resolve(cache);
  if (!inflight || force) {
    inflight = fetch('/api/admin/blog/embeddables', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { product: [], project: [], experience: [], post: [] }))
      .then(d => (cache = d as Embeddables))
      .finally(() => { inflight = null; });
  }
  return inflight;
}

export function useEmbeddables(): Embeddables | null {
  const [data, setData] = useState<Embeddables | null>(cache);
  useEffect(() => {
    let alive = true;
    loadEmbeddables().then(d => { if (alive) setData(d); });
    return () => { alive = false; };
  }, []);
  return data;
}
