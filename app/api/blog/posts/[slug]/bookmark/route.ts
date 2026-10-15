// POST / DELETE /api/blog/posts/[slug]/bookmark — reading list
import { prisma } from '@/lib/prisma';
import { getReader } from '@/lib/readerAuth';
import { findVisiblePost } from '@/lib/blog/comments';
import { err, json } from '@/lib/apiUtil';

export const dynamic = 'force-dynamic';

async function ctx(slug: string) {
  const reader = await getReader();
  if (!reader) return { error: err('Sign in required', 401) } as const;
  const post = await findVisiblePost(slug);
  if (!post) return { error: err('Not found', 404) } as const;
  return { reader, post } as const;
}

export async function POST(_req: Request, { params }: { params: { slug: string } }) {
  const c = await ctx(params.slug);
  if ('error' in c) return c.error;
  await prisma.bookmark.upsert({
    where: { readerId_postId: { readerId: c.reader.id, postId: c.post.id } },
    create: { readerId: c.reader.id, postId: c.post.id },
    update: {},
  });
  return json({ bookmarked: true });
}

export async function DELETE(_req: Request, { params }: { params: { slug: string } }) {
  const c = await ctx(params.slug);
  if ('error' in c) return c.error;
  await prisma.bookmark.deleteMany({ where: { readerId: c.reader.id, postId: c.post.id } });
  return json({ bookmarked: false });
}
