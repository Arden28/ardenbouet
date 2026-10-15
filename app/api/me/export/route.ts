// GET /api/me/export — everything we store about the signed-in reader, as a JSON download
import { prisma } from '@/lib/prisma';
import { requireReader, publicReader } from '@/lib/meApi';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await requireReader();
  if ('error' in ctx) return ctx.error;
  const id = ctx.reader.id;
  const [responses, highlights, bookmarks, claps, stories, requests, grant, donationsMade, donationsReceived] = await Promise.all([
    prisma.comment.findMany({ where: { readerId: id }, select: { body: true, quote: true, status: true, createdAt: true, editedAt: true, post: { select: { title: true, slug: true } } } }),
    prisma.highlight.findMany({ where: { readerId: id }, select: { quote: true, createdAt: true, post: { select: { title: true, slug: true } } } }),
    prisma.bookmark.findMany({ where: { readerId: id }, select: { createdAt: true, post: { select: { title: true, slug: true } } } }),
    prisma.clap.findMany({ where: { visitorKey: `r:${id}` }, select: { count: true, createdAt: true, post: { select: { title: true, slug: true } } } }),
    prisma.post.findMany({ where: { authorId: id }, select: { title: true, subtitle: true, slug: true, status: true, content: true, createdAt: true, publishedAt: true } }),
    prisma.writerRequest.findMany({ where: { readerId: id }, select: { message: true, sampleUrl: true, status: true, createdAt: true } }),
    prisma.writerGrant.findUnique({ where: { readerId: id }, select: { scope: true, maxPosts: true, canPublish: true, expiresAt: true, createdAt: true } }),
    prisma.donation.findMany({ where: { donorId: id }, select: { amount: true, currency: true, status: true, message: true, createdAt: true } }),
    prisma.donation.findMany({ where: { recipientId: id }, select: { amount: true, currency: true, status: true, donorName: true, message: true, createdAt: true } }),
  ]);
  const payload = {
    exportedAt: new Date().toISOString(),
    account: publicReader(ctx.reader),
    writerGrant: grant, writerRequests: requests, stories, responses, highlights, bookmarks, claps,
    donationsMade, donationsReceived,
  };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="ardenbouet-account-${ctx.reader.handle ?? id}.json"`,
    },
  });
}
