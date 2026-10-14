// GET /api/blog/bookmarks — slugs in the signed-in reader's reading list
import { prisma } from '@/lib/prisma';
import { getReader } from '@/lib/readerAuth';
import { json } from '@/lib/apiUtil';

export const dynamic = 'force-dynamic';

export async function GET() {
  const reader = await getReader();
  if (!reader) return json({ slugs: [] });
  const rows = await prisma.bookmark.findMany({
    where: { readerId: reader.id },
    select: { post: { select: { slug: true } } },
  });
  return json({ slugs: rows.map(r => r.post.slug) });
}
