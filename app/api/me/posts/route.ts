// GET /api/me/posts — stories the writer can edit; POST — start a new story (if the grant allows)
import { prisma } from '@/lib/prisma';
import { err, json } from '@/lib/apiUtil';
import { requireWriter } from '@/lib/meApi';
import { editablePostIds, writerStatus } from '@/lib/accounts';
import { toEditorPost, uniqueSlug } from '@/lib/blog/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await requireWriter();
  if ('error' in ctx) return ctx.error;
  const ids = await editablePostIds(ctx.reader, ctx.grant);
  const posts = await prisma.post.findMany({
    where: { id: { in: ids } },
    select: {
      id: true, slug: true, title: true, subtitle: true, coverUrl: true, status: true, publishedAt: true, scheduledAt: true,
      updatedAt: true, readingMinutes: true, wordCount: true, views: true, authorId: true,
      _count: { select: { comments: { where: { status: 'VISIBLE' } } } },
    },
    orderBy: { updatedAt: 'desc' },
  });
  const claps = await prisma.clap.groupBy({ by: ['postId'], where: { postId: { in: ids } }, _sum: { count: true } });
  const clapMap = new Map(claps.map(c => [c.postId, c._sum.count ?? 0]));
  return json({ posts: posts.map(p => ({ ...p, claps: clapMap.get(p.id) ?? 0 })), writer: await writerStatus(ctx.reader.id) });
}

export async function POST() {
  const ctx = await requireWriter();
  if ('error' in ctx) return ctx.error;
  const status = await writerStatus(ctx.reader.id);
  if (!status.canCreate) {
    return err(status.scope === 'SPECIFIC' ? 'Your access covers specific stories only' : 'You’ve reached your story limit', 403);
  }
  const post = await prisma.post.create({
    data: {
      title: '',
      slug: await uniqueSlug(`draft-${Date.now().toString(36)}`),
      authorId: ctx.reader.id,
      language: ctx.reader.locale,
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
    },
  });
  return json({ post: toEditorPost(post) }, 201);
}
