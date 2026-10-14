// GET /api/admin/blog/posts?status=&q= — list stories for the admin
// POST /api/admin/blog/posts — create a new draft
import { prisma } from '@/lib/prisma';
import { err, isAdminRequest, json, readJson, str } from '@/lib/apiUtil';
import { toEditorPost, uniqueSlug } from '@/lib/blog/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const sp = new URL(req.url).searchParams;
  const status = sp.get('status');
  const q = sp.get('q')?.trim();

  const posts = await prisma.post.findMany({
    where: {
      ...(status && status !== 'ALL' ? { status: status as 'DRAFT' } : {}),
      ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { tags: { has: q.toLowerCase() } }] } : {}),
    },
    select: {
      id: true, slug: true, title: true, subtitle: true, excerpt: true, coverUrl: true, status: true,
      publishedAt: true, scheduledAt: true, updatedAt: true, createdAt: true, tags: true, featured: true,
      readingMinutes: true, wordCount: true, views: true, newsletterSentAt: true,
      series: { select: { title: true } },
      author: { select: { name: true, handle: true, image: true } },
      _count: { select: { comments: { where: { status: 'VISIBLE' } }, highlights: true, bookmarks: true } },
    },
    orderBy: [{ updatedAt: 'desc' }],
  });

  const claps = await prisma.clap.groupBy({ by: ['postId'], _sum: { count: true } });
  const clapMap = new Map(claps.map(c => [c.postId, c._sum.count ?? 0]));
  const counts = await prisma.post.groupBy({ by: ['status'], _count: { _all: true } });

  return json({
    posts: posts.map(p => ({ ...p, claps: clapMap.get(p.id) ?? 0 })),
    counts: Object.fromEntries(counts.map(c => [c.status, c._count._all])),
  });
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const body = await readJson(req);
  const title = str(body?.title, 300);
  const post = await prisma.post.create({
    data: {
      title,
      slug: await uniqueSlug(title || `draft-${Date.now().toString(36)}`),
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
    },
  });
  return json({ post: toEditorPost(post) }, 201);
}
