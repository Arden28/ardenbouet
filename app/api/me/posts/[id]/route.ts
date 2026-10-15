// GET / PUT / DELETE /api/me/posts/[id] — the writer editor's load + autosave endpoint
import { prisma } from '@/lib/prisma';
import { err, json, readJson } from '@/lib/apiUtil';
import { requireWriter } from '@/lib/meApi';
import { canEditPost } from '@/lib/accounts';
import { buildPostUpdate, EditorError, snapshot, toEditorPost } from '@/lib/blog/admin';
import { notifyOwner } from '@/lib/notify';

export const dynamic = 'force-dynamic';

// Fields only the site owner controls.
const ADMIN_ONLY = ['featured', 'seriesId', 'seriesOrder', 'canonicalUrl'] as const;

async function load(id: string) {
  const ctx = await requireWriter();
  if ('error' in ctx) return ctx;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post || !canEditPost(ctx.reader, ctx.grant, post)) return { error: err('Not found', 404) };
  return { ...ctx, post };
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const r = await load(params.id);
  if ('error' in r) return r.error;
  return json({ post: toEditorPost(r.post), canPublish: r.grant.canPublish });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const r = await load(params.id);
  if ('error' in r) return r.error;
  const body = await readJson(req);
  if (!body) return err('Invalid JSON');
  for (const k of ADMIN_ONLY) delete body[k];
  if (body.donationsEnabled === true && !r.reader.stripeChargesEnabled) {
    return err('Connect your Stripe account in Earnings before accepting donations', 422);
  }

  if (typeof body.baseUpdatedAt === 'string' && new Date(body.baseUpdatedAt).getTime() < r.post.updatedAt.getTime() - 1) {
    return json({ error: 'This story was changed in another window. Reload to get the latest version.', conflict: true }, 409);
  }

  // Writers without direct publishing submit for review instead.
  let submitted = false;
  if ((body.status === 'PUBLISHED' || body.status === 'SCHEDULED') && !r.grant.canPublish) {
    body.status = 'REVIEW';
    submitted = r.post.status !== 'REVIEW';
  }
  if (body.status === 'REVIEW' && r.grant.canPublish) delete body.status;

  let data;
  try {
    data = body.status === 'REVIEW'
      ? { ...(await buildPostUpdate(r.post, { ...body, status: undefined })), status: 'REVIEW' as const }
      : await buildPostUpdate(r.post, body);
  } catch (e) {
    if (e instanceof EditorError) return err(e.message, 422);
    throw e;
  }

  const updated = await prisma.post.update({ where: { id: r.post.id }, data });
  if (data.status && data.status !== r.post.status) await snapshot(updated.id, String(data.status).toLowerCase());
  if (submitted) await notifyOwner(`“${updated.title || 'Untitled'}” was submitted for review`, `${r.reader.name} submitted a story for review.`, `/admin/blog/${updated.id}`);
  return json({ post: toEditorPost(updated) });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const r = await load(params.id);
  if ('error' in r) return r.error;
  if (r.post.authorId !== r.reader.id) return err('Only the author can delete this story', 403);
  await prisma.post.delete({ where: { id: r.post.id } });
  return json({ ok: true });
}
