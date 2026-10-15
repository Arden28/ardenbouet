// GET /api/admin/blog/comments?status=&postId= — moderation queue
// POST { postId, parentId?, body } — reply as the author
import { prisma } from '@/lib/prisma';
import { err, isAdminRequest, json, readJson, str } from '@/lib/apiUtil';
import { COMMENT_MAX, formatComment } from '@/lib/blog/comments';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const sp = new URL(req.url).searchParams;
  const status = sp.get('status');
  const postId = sp.get('postId');
  const comments = await prisma.comment.findMany({
    where: {
      ...(status && status !== 'ALL' ? { status: status as 'VISIBLE' } : {}),
      ...(postId ? { postId } : {}),
    },
    include: {
      reader: { select: { id: true, name: true, image: true, email: true, provider: true, banned: true } },
      post: { select: { id: true, title: true, slug: true } },
      parent: { select: { id: true, body: true, isAuthor: true, reader: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 300,
  });
  const counts = await prisma.comment.groupBy({ by: ['status'], _count: { _all: true } });
  return json({
    comments: comments.map(c => ({ ...c, html: formatComment(c.body) })),
    counts: Object.fromEntries(counts.map(c => [c.status, c._count._all])),
  });
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const body = await readJson(req);
  const text = str(body?.body, COMMENT_MAX).trim();
  const postId = str(body?.postId, 64);
  if (!text || !postId) return err('Missing body or post');
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
  if (!post) return err('Post not found', 404);
  const parentId = str(body?.parentId, 64) || null;
  if (parentId) {
    const parent = await prisma.comment.findFirst({ where: { id: parentId, postId }, select: { id: true } });
    if (!parent) return err('Parent not found', 404);
  }
  const comment = await prisma.comment.create({ data: { postId, parentId, body: text, isAuthor: true } });
  return json({ comment }, 201);
}
