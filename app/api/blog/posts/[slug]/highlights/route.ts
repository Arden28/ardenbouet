// POST { quote } / DELETE { id } /api/blog/posts/[slug]/highlights
import { prisma } from '@/lib/prisma';
import { getReader } from '@/lib/readerAuth';
import { findVisiblePost } from '@/lib/blog/comments';
import { err, json, readJson, str } from '@/lib/apiUtil';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const reader = await getReader();
  if (!reader) return err('Sign in required', 401);
  const post = await findVisiblePost(params.slug);
  if (!post) return err('Not found', 404);
  const quote = str((await readJson(req))?.quote, 1000).replace(/\s+/g, ' ').trim();
  if (quote.length < 3) return err('Quote too short');
  const existing = await prisma.highlight.findFirst({ where: { postId: post.id, readerId: reader.id, quote } });
  const h = existing ?? (await prisma.highlight.create({ data: { postId: post.id, readerId: reader.id, quote } }));
  return json({ id: h.id, quote: h.quote });
}

export async function DELETE(req: Request, { params }: { params: { slug: string } }) {
  const reader = await getReader();
  if (!reader) return err('Sign in required', 401);
  const post = await findVisiblePost(params.slug);
  if (!post) return err('Not found', 404);
  const id = str((await readJson(req))?.id, 64);
  await prisma.highlight.deleteMany({ where: { id, readerId: reader.id, postId: post.id } });
  return json({ ok: true });
}
