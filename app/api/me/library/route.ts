// GET /api/me/library — reading list, highlights and responses of the signed-in reader
// DELETE { kind: 'bookmark' | 'highlight', id } — remove one
import { prisma } from '@/lib/prisma';
import { err, json, readJson, str } from '@/lib/apiUtil';
import { requireReader } from '@/lib/meApi';
import { getPostCardsByIds } from '@/lib/blog/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await requireReader();
  if ('error' in ctx) return ctx.error;
  const id = ctx.reader.id;
  const [bookmarks, highlights, responses] = await Promise.all([
    prisma.bookmark.findMany({ where: { readerId: id }, orderBy: { createdAt: 'desc' }, select: { postId: true, createdAt: true } }),
    prisma.highlight.findMany({ where: { readerId: id }, orderBy: { createdAt: 'desc' }, take: 200, select: { id: true, quote: true, createdAt: true, post: { select: { slug: true, title: true } } } }),
    prisma.comment.findMany({
      where: { readerId: id, status: 'VISIBLE' }, orderBy: { createdAt: 'desc' }, take: 200,
      select: { id: true, body: true, quote: true, createdAt: true, likeCount: true, post: { select: { slug: true, title: true } } },
    }),
  ]);
  return json({ readingList: await getPostCardsByIds(bookmarks.map(b => b.postId)), highlights, responses });
}

export async function DELETE(req: Request) {
  const ctx = await requireReader();
  if ('error' in ctx) return ctx.error;
  const body = await readJson(req);
  const id = str(body?.id, 64);
  if (body?.kind === 'bookmark') await prisma.bookmark.deleteMany({ where: { readerId: ctx.reader.id, postId: id } });
  else if (body?.kind === 'highlight') await prisma.highlight.deleteMany({ where: { readerId: ctx.reader.id, id } });
  else return err('Unknown kind');
  return json({ ok: true });
}
