// POST /api/blog/posts/[slug]/clap { add: 1..50 } — Medium-style claps, max 50 per visitor
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getReader } from '@/lib/readerAuth';
import { findVisiblePost } from '@/lib/blog/comments';
import { err, json, readJson } from '@/lib/apiUtil';

export const dynamic = 'force-dynamic';
const MAX_CLAPS = 50;

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const post = await findVisiblePost(params.slug);
  if (!post) return err('Not found', 404);
  const body = await readJson<{ add?: number }>(req);
  const add = Math.max(1, Math.min(MAX_CLAPS, Math.floor(Number(body?.add) || 1)));

  const reader = await getReader();
  const jar = cookies();
  let anon = jar.get('ab_vid')?.value;
  if (!reader && !anon) {
    anon = randomUUID();
    jar.set('ab_vid', anon, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365, secure: process.env.NODE_ENV === 'production' });
  }
  const visitorKey = reader ? `r:${reader.id}` : `a:${anon}`;

  const existing = await prisma.clap.findUnique({ where: { postId_visitorKey: { postId: post.id, visitorKey } } });
  const next = Math.min(MAX_CLAPS, (existing?.count ?? 0) + add);
  await prisma.clap.upsert({
    where: { postId_visitorKey: { postId: post.id, visitorKey } },
    create: { postId: post.id, visitorKey, count: next },
    update: { count: next },
  });
  const total = await prisma.clap.aggregate({ where: { postId: post.id }, _sum: { count: true } });
  return json({ claps: total._sum.count ?? 0, myClaps: next });
}
