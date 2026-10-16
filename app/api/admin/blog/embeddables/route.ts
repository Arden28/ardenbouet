// GET /api/admin/blog/embeddables — everything a story can embed as a content card:
// products, projects, experiences (from the Content bundle) and other stories.
import { prisma } from '@/lib/prisma';
import { err, isAdminRequest, json } from '@/lib/apiUtil';
import { getContentBundle } from '@/lib/blog/queries';
import { periodLabel } from '@/lib/experienceDates';
import { uiT } from '@/lib/i18n/ui';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const bundle = await getContentBundle();
  const posts = await prisma.post.findMany({
    select: { id: true, title: true, subtitle: true, coverUrl: true, status: true, readingMinutes: true },
    orderBy: { updatedAt: 'desc' },
  });

  return json({
    product: (bundle.products ?? []).map(p => ({
      id: p.id, title: p.title, subtitle: p.tagline || p.description, image: p.cover || p.media?.find(m => m.kind === 'image')?.url,
      meta: [p.category, p.priceLabel].filter(Boolean).join(' · '), status: p.status,
    })),
    project: (bundle.projects ?? []).map(p => ({
      id: p.id, title: p.title, subtitle: p.description,
      image: p.caseFile?.images?.find(i => !/\.(mp4|webm|ogg|mov)(\?|$)/i.test(i.src))?.src || p.logoUrl,
      meta: p.metric || (p.tech ?? []).slice(0, 3).join(' · '),
    })),
    experience: (bundle.experiences ?? []).map(e => ({
      id: e.id, title: e.title, subtitle: e.logline || e.job, image: e.poster, meta: periodLabel(e, 'en', uiT('en')),
    })),
    post: posts.map(p => ({
      id: p.id, title: p.title || 'Untitled', subtitle: p.subtitle, image: p.coverUrl ?? undefined,
      meta: `${p.readingMinutes} min read`, status: p.status,
    })),
  });
}
