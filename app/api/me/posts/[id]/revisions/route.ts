// GET / POST /api/me/posts/[id]/revisions — version history for the writer's own stories
import { prisma } from '@/lib/prisma';
import { err, json, readJson, str } from '@/lib/apiUtil';
import { requireWriter } from '@/lib/meApi';
import { canEditPost } from '@/lib/accounts';
import { snapshot } from '@/lib/blog/admin';

export const dynamic = 'force-dynamic';

async function guard(id: string) {
  const ctx = await requireWriter();
  if ('error' in ctx) return ctx;
  const post = await prisma.post.findUnique({ where: { id }, select: { id: true, authorId: true } });
  if (!post || !canEditPost(ctx.reader, ctx.grant, post)) return { error: err('Not found', 404) };
  return { ok: true as const };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const g = await guard(params.id);
  if ('error' in g) return g.error;
  const revisions = await prisma.postRevision.findMany({ where: { postId: params.id }, orderBy: { createdAt: 'desc' } });
  return json({ revisions: revisions.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })) });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const g = await guard(params.id);
  if ('error' in g) return g.error;
  await snapshot(params.id, str((await readJson(req))?.label, 80) || 'Saved version');
  return json({ ok: true }, 201);
}
