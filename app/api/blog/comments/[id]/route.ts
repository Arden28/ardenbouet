// PATCH { body } / DELETE /api/blog/comments/[id] — readers edit or delete their own responses
import { prisma } from '@/lib/prisma';
import { getReader } from '@/lib/readerAuth';
import { COMMENT_MAX, toDTO } from '@/lib/blog/comments';
import { err, json, readJson, str } from '@/lib/apiUtil';

export const dynamic = 'force-dynamic';

async function own(id: string) {
  const reader = await getReader();
  if (!reader) return { error: err('Sign in required', 401) } as const;
  const comment = await prisma.comment.findFirst({ where: { id, readerId: reader.id, status: 'VISIBLE' } });
  if (!comment) return { error: err('Not found', 404) } as const;
  return { reader, comment } as const;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const c = await own(params.id);
  if ('error' in c) return c.error;
  const text = str((await readJson(req))?.body, COMMENT_MAX + 1).trim();
  if (!text) return err('Empty response');
  if (text.length > COMMENT_MAX) return err(`Responses are limited to ${COMMENT_MAX} characters`);
  const updated = await prisma.comment.update({
    where: { id: c.comment.id },
    data: { body: text, editedAt: new Date() },
    include: { reader: true },
  });
  const liked = await prisma.commentLike.findUnique({
    where: { commentId_readerId: { commentId: updated.id, readerId: c.reader.id } },
  });
  return json({ comment: toDTO(updated, c.reader.id, new Set(liked ? [updated.id] : [])) });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const c = await own(params.id);
  if ('error' in c) return c.error;
  // Soft delete keeps the thread intact for replies; the body is cleared.
  await prisma.comment.update({ where: { id: c.comment.id }, data: { status: 'DELETED', body: '', quote: null } });
  return json({ ok: true });
}
