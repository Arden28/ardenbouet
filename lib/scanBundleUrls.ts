import type { ContentBundle } from '@/app/admin/types';

export function scanBundleUrls(bundle: ContentBundle): Set<string> {
  const urls = new Set<string>();
  const add = (v: unknown) => { if (typeof v === 'string' && v.startsWith('http')) urls.add(v); };

  for (const p of bundle.projects ?? []) {
    add(p.logoUrl);
    for (const img of p.caseFile?.images ?? []) add(img.src);
  }
  for (const e of bundle.experiences ?? []) add(e.poster);
  for (const n of bundle.notes     ?? []) add(n.cover);
  for (const p of bundle.products  ?? []) {
    add(p.cover);
    add(p.fileUrl);
    for (const m of p.media ?? []) add(m.url);
  }

  return urls;
}
