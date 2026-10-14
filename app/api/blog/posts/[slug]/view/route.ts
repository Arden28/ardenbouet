// POST /api/blog/posts/[slug]/view — counts a read (client dedupes per session)
import { prisma } from '@/lib/prisma';
import { findVisiblePost } from '@/lib/blog/comments';
import { err, json } from '@/lib/apiUtil';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  if (/bot|crawl|spider|preview/i.test(req.headers.get('user-agent') ?? '')) return json({ ok: true });
  const post = await findVisiblePost(params.slug);
  if (!post) return err('Not found', 404);
  await prisma.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } });
  return json({ ok: true });
}
