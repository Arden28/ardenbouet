// POST /api/blog/comments/[id]/like — toggles the reader's like
import { prisma } from '@/lib/prisma';
import { getReader } from '@/lib/readerAuth';
import { err, json } from '@/lib/apiUtil';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const reader = await getReader();
  if (!reader) return err('Sign in required', 401);
  const comment = await prisma.comment.findFirst({ where: { id: params.id, status: 'VISIBLE' }, select: { id: true } });
  if (!comment) return err('Not found', 404);

  const key = { commentId_readerId: { commentId: comment.id, readerId: reader.id } };
  const existing = await prisma.commentLike.findUnique({ where: key });
  const [, updated] = await prisma.$transaction(
    existing
      ? [prisma.commentLike.delete({ where: key }), prisma.comment.update({ where: { id: comment.id }, data: { likeCount: { decrement: 1 } } })]
      : [prisma.commentLike.create({ data: { commentId: comment.id, readerId: reader.id } }), prisma.comment.update({ where: { id: comment.id }, data: { likeCount: { increment: 1 } } })],
  );
  return json({ liked: !existing, likeCount: Math.max(0, updated.likeCount) });
}
