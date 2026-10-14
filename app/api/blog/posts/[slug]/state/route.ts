// GET /api/blog/posts/[slug]/state — per-viewer state: claps, bookmark, highlights, reader
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getReader } from '@/lib/readerAuth';
import { findVisiblePost } from '@/lib/blog/comments';
import { err, json } from '@/lib/apiUtil';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const post = await findVisiblePost(params.slug);
  if (!post) return err('Not found', 404);
  const reader = await getReader();
  const anon = cookies().get('ab_vid')?.value;
  const visitorKey = reader ? `r:${reader.id}` : anon ? `a:${anon}` : null;

  const [total, mine, bookmark, myHighlights, topRows] = await Promise.all([
    prisma.clap.aggregate({ where: { postId: post.id }, _sum: { count: true } }),
    visitorKey ? prisma.clap.findUnique({ where: { postId_visitorKey: { postId: post.id, visitorKey } } }) : null,
    reader ? prisma.bookmark.findUnique({ where: { readerId_postId: { readerId: reader.id, postId: post.id } } }) : null,
    reader ? prisma.highlight.findMany({ where: { postId: post.id, readerId: reader.id }, select: { id: true, quote: true } }) : [],
    prisma.highlight.groupBy({ by: ['quote'], where: { postId: post.id }, _count: { quote: true }, orderBy: { _count: { quote: 'desc' } }, take: 1 }),
  ]);

  const top = topRows[0];
  return json({
    claps: total._sum.count ?? 0,
    myClaps: mine?.count ?? 0,
    bookmarked: !!bookmark,
    myHighlights,
    topHighlight: top && top._count.quote >= 2 ? { quote: top.quote, count: top._count.quote } : null,
    reader: reader ? { id: reader.id, name: reader.name, image: reader.image } : null,
  });
}
