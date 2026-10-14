// GET / POST /api/blog/posts/[slug]/comments — threaded responses
import { prisma } from '@/lib/prisma';
import { getReader } from '@/lib/readerAuth';
import { COMMENT_MAX, COMMENT_RATE, findVisiblePost, thread, toDTO } from '@/lib/blog/comments';
import { err, json, readJson, str } from '@/lib/apiUtil';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const post = await findVisiblePost(params.slug);
  if (!post) return err('Not found', 404);
  const reader = await getReader();

  const rows = await prisma.comment.findMany({
    where: { postId: post.id, status: { in: ['VISIBLE', 'DELETED'] } },
    include: { reader: true },
    orderBy: { createdAt: 'asc' },
  });
  const liked = reader
    ? new Set(
        (await prisma.commentLike.findMany({
          where: { readerId: reader.id, commentId: { in: rows.map(r => r.id) } },
          select: { commentId: true },
        })).map(l => l.commentId),
      )
    : new Set<string>();

  const comments = thread(rows.map(r => toDTO(r, reader?.id ?? null, liked)));
  const count = rows.filter(r => r.status === 'VISIBLE').length;
  return json({ comments, count, commentsOpen: post.commentsOpen });
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const reader = await getReader();
  if (!reader) return err('Sign in required', 401);
  const post = await findVisiblePost(params.slug);
  if (!post) return err('Not found', 404);
  if (!post.commentsOpen) return err('Responses are closed', 403);

  const body = await readJson(req);
  const text = str(body?.body, COMMENT_MAX + 1).trim();
  if (!text) return err('Empty response');
  if (text.length > COMMENT_MAX) return err(`Responses are limited to ${COMMENT_MAX} characters`);
  const quote = str(body?.quote, 1000).replace(/\s+/g, ' ').trim() || null;

  let parentId: string | null = null;
  if (body?.parentId) {
    const parent = await prisma.comment.findFirst({
      where: { id: str(body.parentId, 64), postId: post.id, status: 'VISIBLE' },
      select: { id: true, parentId: true, parent: { select: { parentId: true } } },
    });
    if (!parent) return err('Parent response not found', 404);
    // Cap nesting at 3 levels: deeper replies attach to the level-3 ancestor.
    parentId = parent.parent?.parentId ? parent.parentId : parent.id;
  }

  const recent = await prisma.comment.count({
    where: { readerId: reader.id, createdAt: { gte: new Date(Date.now() - COMMENT_RATE.windowMs) } },
  });
  if (recent >= COMMENT_RATE.max) return err('Too many responses, slow down', 429);

  const c = await prisma.comment.create({
    data: { postId: post.id, readerId: reader.id, parentId, body: text, quote },
    include: { reader: true },
  });
  return json({ comment: toDTO(c, reader.id, new Set()) }, 201);
}
