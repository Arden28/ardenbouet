// GET / PUT / DELETE /api/admin/blog/posts/[id] — the editor's load + autosave endpoint
import { prisma } from '@/lib/prisma';
import { err, isAdminRequest, json, readJson } from '@/lib/apiUtil';
import { buildPostUpdate, EditorError, snapshot, toEditorPost } from '@/lib/blog/admin';

export const dynamic = 'force-dynamic';
const AUTO_REVISION_MS = 10 * 60_000;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return err('Not found', 404);
  return json({ post: toEditorPost(post) });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const current = await prisma.post.findUnique({ where: { id: params.id } });
  if (!current) return err('Not found', 404);
  const body = await readJson(req);
  if (!body) return err('Invalid JSON');

  // Optimistic concurrency: refuse to overwrite edits made in another tab.
  if (typeof body.baseUpdatedAt === 'string' && new Date(body.baseUpdatedAt).getTime() < current.updatedAt.getTime() - 1) {
    return json({ error: 'This story was changed in another window. Reload to get the latest version.', conflict: true }, 409);
  }

  let data;
  try {
    data = await buildPostUpdate(current, body);
  } catch (e) {
    if (e instanceof EditorError) return err(e.message, 422);
    throw e;
  }

  const becamePublic = data.status === 'PUBLISHED' && current.status !== 'PUBLISHED';
  const updated = await prisma.post.update({ where: { id: current.id }, data });

  if (becamePublic || data.status === 'SCHEDULED') {
    await snapshot(updated.id, data.status === 'SCHEDULED' ? 'Scheduled' : 'Published');
  } else if (body.content !== undefined) {
    const last = await prisma.postRevision.findFirst({ where: { postId: updated.id }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } });
    if (!last || Date.now() - last.createdAt.getTime() > AUTO_REVISION_MS) await snapshot(updated.id, 'Autosave');
  }

  return json({ post: toEditorPost(updated) });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  await prisma.post.delete({ where: { id: params.id } }).catch(() => null);
  return json({ ok: true });
}
