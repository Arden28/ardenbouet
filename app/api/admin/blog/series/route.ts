// GET / POST / PUT / DELETE /api/admin/blog/series — manage story series
//   GET                → all series with their stories (in reading order)
//   GET ?stories=1&q=  → stories to pick from when adding to a series
//   PUT { id, title, slug?, description, coverUrl, postIds? } → postIds sets membership AND order in one go
import { prisma } from '@/lib/prisma';
import { err, isAdminRequest, json, readJson, str } from '@/lib/apiUtil';
import { slugify } from '@/lib/blog/doc';

export const dynamic = 'force-dynamic';

const postSelect = { id: true, title: true, slug: true, status: true, seriesOrder: true, coverUrl: true, readingMinutes: true, publishedAt: true } as const;

export async function GET(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const sp = new URL(req.url).searchParams;
  if (sp.get('stories') === '1') {
    const q = (sp.get('q') ?? '').trim();
    const stories = await prisma.post.findMany({
      where: { status: { not: 'ARCHIVED' }, ...(q ? { title: { contains: q, mode: 'insensitive' as const } } : {}) },
      select: { id: true, title: true, status: true, coverUrl: true, updatedAt: true, series: { select: { id: true, title: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 40,
    });
    return json({ stories });
  }
  const series = await prisma.series.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { posts: { select: postSelect, orderBy: [{ seriesOrder: 'asc' }, { publishedAt: 'asc' }] } },
  });
  return json({ series });
}

async function freeSlug(title: string, excludeId?: string) {
  const base = slugify(title) || 'series';
  for (let i = 0; i < 50; i++) {
    const slug = i ? `${base}-${i + 1}` : base;
    const hit = await prisma.series.findUnique({ where: { slug }, select: { id: true } });
    if (!hit || hit.id === excludeId) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const body = await readJson(req);
  const title = str(body?.title, 200).trim();
  if (!title) return err('Title is required');
  const series = await prisma.series.create({
    data: { title, slug: await freeSlug(title), description: str(body?.description, 1000), coverUrl: str(body?.coverUrl, 500) || null },
    include: { posts: { select: postSelect } },
  });
  return json({ series }, 201);
}

export async function PUT(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const body = await readJson(req);
  const id = str(body?.id, 64);
  const title = str(body?.title, 200).trim();
  if (!id || !title) return err('id and title are required');

  let slug: string | undefined;
  if (body?.slug !== undefined) {
    const wanted = slugify(str(body.slug, 120));
    if (!wanted) return err('The URL can’t be empty');
    const clash = await prisma.series.findFirst({ where: { slug: wanted, NOT: { id } }, select: { id: true } });
    if (clash) return err('Another series already uses this URL', 409);
    slug = wanted;
  }

  const ops = [
    prisma.series.update({
      where: { id },
      data: { title, description: str(body?.description, 1000), coverUrl: str(body?.coverUrl, 500) || null, ...(slug ? { slug } : {}) },
    }),
  ];
  if (Array.isArray(body?.postIds)) {
    const postIds = (body.postIds as unknown[]).map(String).slice(0, 200);
    // Stories dropped from the list leave the series; the rest join it (moving out of any other series) in this order.
    ops.push(prisma.post.updateMany({ where: { seriesId: id, id: { notIn: postIds } }, data: { seriesId: null, seriesOrder: 0 } }) as never);
    postIds.forEach((pid, i) => ops.push(prisma.post.update({ where: { id: pid }, data: { seriesId: id, seriesOrder: i } }) as never));
  } else if (Array.isArray(body?.order)) {
    // Back-compat: [{ id, seriesOrder }]
    (body.order as { id: string; seriesOrder: number }[]).forEach(o =>
      ops.push(prisma.post.update({ where: { id: String(o.id) }, data: { seriesOrder: Math.max(0, Number(o.seriesOrder) || 0) } }) as never));
  }
  try {
    await prisma.$transaction(ops);
  } catch {
    return err('Could not save the series, a story may have been deleted. Reload and try again.', 409);
  }
  const series = await prisma.series.findUnique({ where: { id }, include: { posts: { select: postSelect, orderBy: [{ seriesOrder: 'asc' }, { publishedAt: 'asc' }] } } });
  return json({ series });
}

export async function DELETE(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const id = str((await readJson(req))?.id, 64);
  await prisma.series.delete({ where: { id } }).catch(() => null);
  return json({ ok: true });
}
