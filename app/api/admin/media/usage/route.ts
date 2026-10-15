// GET /api/admin/media/usage — where every media URL is referenced: { [url]: ["Project · Auprea", …] }
import { prisma } from '@/lib/prisma';
import { err, isAdminRequest, json } from '@/lib/apiUtil';
import { getContentBundle } from '@/lib/blog/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const usage: Record<string, string[]> = {};
  const add = (url: unknown, label: string) => {
    if (typeof url !== 'string' || !url.startsWith('http')) return;
    (usage[url] ??= []).includes(label) || usage[url].push(label);
  };
  // Every http(s) string anywhere inside a JSON value (story bodies, nested attrs…)
  const walk = (v: unknown, label: string) => {
    if (typeof v === 'string') add(v, label);
    else if (Array.isArray(v)) v.forEach(x => walk(x, label));
    else if (v && typeof v === 'object') Object.values(v).forEach(x => walk(x, label));
  };

  const bundle = await getContentBundle();
  for (const p of bundle.projects ?? []) walk(p, `Project · ${p.title}`);
  for (const e of bundle.experiences ?? []) walk(e, `Experience · ${e.title}`);
  for (const p of bundle.products ?? []) walk(p, `Product · ${p.title}`);
  for (const j of bundle.journey ?? []) walk(j, `Journey · ${j.title}`);
  if (bundle.settings) walk(bundle.settings, 'Site settings');

  const posts = await prisma.post.findMany({ select: { title: true, coverUrl: true, content: true } });
  for (const p of posts) {
    const label = `Story · ${p.title || 'Untitled'}`;
    add(p.coverUrl, label);
    walk(p.content, label);
  }
  const series = await prisma.series.findMany({ select: { title: true, coverUrl: true } });
  for (const s of series) add(s.coverUrl, `Series · ${s.title}`);

  return json({ usage });
}
