// GET /api/admin/blog/posts/[id]/revisions — history list (with content, newest first)
// POST { label } — save a named version now
import { prisma } from '@/lib/prisma';
import { err, isAdminRequest, json, readJson, str } from '@/lib/apiUtil';
import { snapshot } from '@/lib/blog/admin';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const revisions = await prisma.postRevision.findMany({
    where: { postId: params.id },
    orderBy: { createdAt: 'desc' },
  });
  return json({ revisions: revisions.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })) });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const label = str((await readJson(req))?.label, 80) || 'Saved version';
  await snapshot(params.id, label);
  return json({ ok: true }, 201);
}
