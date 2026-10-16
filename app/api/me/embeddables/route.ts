// GET /api/me/embeddables — what a writer can embed: published products, projects,
// experience and published stories (no drafts or unpublished shop items).
import { prisma } from '@/lib/prisma';
import { json } from '@/lib/apiUtil';
import { requireWriter } from '@/lib/meApi';
import { getContentBundle, visibleWhere } from '@/lib/blog/queries';
import { periodLabel } from '@/lib/experienceDates';
import { uiT } from '@/lib/i18n/ui';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await requireWriter();
  if ('error' in ctx) return ctx.error;
  const bundle = await getContentBundle();
  const posts = await prisma.post.findMany({
    where: visibleWhere(),
    select: { id: true, title: true, subtitle: true, coverUrl: true, readingMinutes: true },
    orderBy: { publishedAt: 'desc' },
  });
  return json({
    product: (bundle.products ?? []).filter(p => p.status === 'published').map(p => ({
      id: p.id, title: p.title, subtitle: p.tagline, image: p.cover, meta: [p.category, p.priceLabel].filter(Boolean).join(' · '),
    })),
    project: (bundle.projects ?? []).map(p => ({ id: p.id, title: p.title, subtitle: p.description, image: p.logoUrl, meta: p.metric })),
    experience: (bundle.experiences ?? []).map(e => ({ id: e.id, title: e.title, subtitle: e.logline || e.job, image: e.poster, meta: periodLabel(e, 'en', uiT('en')) })),
    post: posts.map(p => ({ id: p.id, title: p.title, subtitle: p.subtitle, image: p.coverUrl ?? undefined, meta: `${p.readingMinutes} min read` })),
  });
}
