// GET /api/admin/users?filter=all|writers|banned&q= — reader accounts with writer grants and activity
import { prisma } from '@/lib/prisma';
import { err, isAdminRequest, json } from '@/lib/apiUtil';
import { activeGrant, describeGrant } from '@/lib/accounts';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const sp = new URL(req.url).searchParams;
  const filter = sp.get('filter') ?? 'all';
  const q = sp.get('q')?.trim();

  const readers = await prisma.reader.findMany({
    where: {
      ...(filter === 'writers' ? { writerGrant: { revokedAt: null } } : {}),
      ...(filter === 'banned' ? { banned: true } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { handle: { contains: q.toLowerCase() } }] } : {}),
    },
    include: {
      writerGrant: true,
      _count: { select: { comments: true, posts: true, highlights: true, bookmarks: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  const counts = {
    all: await prisma.reader.count(),
    writers: await prisma.writerGrant.count({ where: { revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } }),
    banned: await prisma.reader.count({ where: { banned: true } }),
    requests: await prisma.writerRequest.count({ where: { status: 'PENDING' } }),
  };

  return json({
    counts,
    users: readers.map(r => {
      const g = activeGrant(r.writerGrant);
      return {
        id: r.id, name: r.name, handle: r.handle, email: r.email, image: r.image, provider: r.provider, banned: r.banned,
        createdAt: r.createdAt, lastSeenAt: r.lastSeenAt, stripeChargesEnabled: r.stripeChargesEnabled,
        counts: r._count,
        grant: r.writerGrant && {
          ...r.writerGrant,
          active: !!g,
          summary: describeGrant(r.writerGrant),
          expired: !!r.writerGrant.expiresAt && r.writerGrant.expiresAt < new Date(),
        },
      };
    }),
  });
}
