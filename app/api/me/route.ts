// GET / PATCH / DELETE /api/me — the signed-in reader's account
import { prisma } from '@/lib/prisma';
import { err, json, readJson, str } from '@/lib/apiUtil';
import { requireReader, publicReader } from '@/lib/meApi';
import { HANDLE_RE, writerStatus } from '@/lib/accounts';
import { isLocale } from '@/lib/i18n/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await requireReader();
  if ('error' in ctx) return ctx.error;
  const { reader } = ctx;
  const [writer, request, counts] = await Promise.all([
    writerStatus(reader.id),
    prisma.writerRequest.findFirst({ where: { readerId: reader.id }, orderBy: { createdAt: 'desc' } }),
    Promise.all([
      prisma.bookmark.count({ where: { readerId: reader.id } }),
      prisma.highlight.count({ where: { readerId: reader.id } }),
      prisma.comment.count({ where: { readerId: reader.id, status: 'VISIBLE' } }),
      prisma.post.count({ where: { authorId: reader.id } }),
    ]),
  ]);
  await prisma.reader.update({ where: { id: reader.id }, data: { lastSeenAt: new Date() } });
  return json({
    reader: publicReader(reader),
    writer,
    request: request && { status: request.status, createdAt: request.createdAt, decisionNote: request.decisionNote },
    counts: { saved: counts[0], highlights: counts[1], responses: counts[2], stories: counts[3] },
  });
}

export async function PATCH(req: Request) {
  const ctx = await requireReader();
  if ('error' in ctx) return ctx.error;
  const body = await readJson(req);
  if (!body) return err('Invalid JSON');

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = str(body.name, 60).trim();
    if (!name) return err('Name cannot be empty');
    data.name = name;
  }
  if (body.handle !== undefined) {
    const handle = str(body.handle, 30).trim().toLowerCase().replace(/^@/, '');
    if (!HANDLE_RE.test(handle)) return err('Usernames are 3–30 characters: letters, numbers and underscores');
    const taken = await prisma.reader.findFirst({ where: { handle, NOT: { id: ctx.reader.id } }, select: { id: true } });
    if (taken) return err('That username is taken');
    data.handle = handle;
  }
  if (body.bio !== undefined) data.bio = str(body.bio, 160);
  if (body.location !== undefined) data.location = str(body.location, 60) || null;
  if (body.website !== undefined) {
    const w = str(body.website, 200).trim();
    if (w && !/^https?:\/\//i.test(w)) return err('Website must start with http(s)://');
    data.website = w || null;
  }
  if (body.locale !== undefined && isLocale(body.locale)) data.locale = body.locale;

  const reader = await prisma.reader.update({ where: { id: ctx.reader.id }, data });
  return json({ reader: publicReader(reader) });
}

/**
 * Deletes the account. Responses, likes, highlights, bookmarks, grants and requests cascade.
 * The writer's stories are unpublished (ARCHIVED) and detached rather than deleted, so the
 * site owner can decide what to do with them; donation records keep amounts but lose the link.
 */
export async function DELETE(req: Request) {
  const ctx = await requireReader();
  if ('error' in ctx) return ctx.error;
  const body = await readJson(req);
  if (str(body?.confirm, 60) !== (ctx.reader.handle ?? ctx.reader.name)) return err('Type your username to confirm');
  await prisma.$transaction([
    prisma.post.updateMany({ where: { authorId: ctx.reader.id, status: { not: 'DRAFT' } }, data: { status: 'ARCHIVED' } }),
    prisma.post.deleteMany({ where: { authorId: ctx.reader.id, status: 'DRAFT' } }),
    prisma.clap.deleteMany({ where: { visitorKey: `r:${ctx.reader.id}` } }),
    prisma.reader.delete({ where: { id: ctx.reader.id } }),
  ]);
  return json({ ok: true });
}
