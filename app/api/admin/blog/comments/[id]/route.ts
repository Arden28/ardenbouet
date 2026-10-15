// PATCH { status?, pinned?, banReader? } / DELETE /api/admin/blog/comments/[id]
import { prisma } from '@/lib/prisma';
import { err, isAdminRequest, json, readJson } from '@/lib/apiUtil';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const body = await readJson(req);
  const comment = await prisma.comment.findUnique({ where: { id: params.id } });
  if (!comment) return err('Not found', 404);

  const data: { status?: 'VISIBLE' | 'HIDDEN'; pinned?: boolean } = {};
  if (body?.status === 'VISIBLE' || body?.status === 'HIDDEN') data.status = body.status;
  if (typeof body?.pinned === 'boolean') {
    data.pinned = body.pinned;
    // One pinned response per story.
    if (body.pinned) await prisma.comment.updateMany({ where: { postId: comment.postId, pinned: true }, data: { pinned: false } });
  }
  const updated = await prisma.comment.update({ where: { id: comment.id }, data });

  if (typeof body?.banReader === 'boolean' && comment.readerId) {
    await prisma.reader.update({ where: { id: comment.readerId }, data: { banned: body.banReader } });
    if (body.banReader) {
      await prisma.comment.updateMany({ where: { readerId: comment.readerId, status: 'VISIBLE' }, data: { status: 'HIDDEN' } });
    }
  }
  return json({ comment: updated });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  await prisma.comment.delete({ where: { id: params.id } }).catch(() => null);
  return json({ ok: true });
}
