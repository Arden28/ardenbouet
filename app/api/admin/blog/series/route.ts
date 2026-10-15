// GET / POST / PUT / DELETE /api/admin/blog/series — manage story series
import { prisma } from '@/lib/prisma';
import { err, isAdminRequest, json, readJson, str } from '@/lib/apiUtil';
import { slugify } from '@/lib/blog/doc';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const series = await prisma.series.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { posts: { select: { id: true, title: true, status: true, seriesOrder: true }, orderBy: { seriesOrder: 'asc' } } },
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
  });
  return json({ series }, 201);
}

export async function PUT(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const body = await readJson(req);
  const id = str(body?.id, 64);
  const title = str(body?.title, 200).trim();
  if (!id || !title) return err('id and title are required');
  const series = await prisma.series.update({
    where: { id },
    data: {
      title,
      description: str(body?.description, 1000),
      coverUrl: str(body?.coverUrl, 500) || null,
      ...(body?.slug ? { slug: await freeSlug(str(body.slug, 120), id) } : {}),
    },
  });
  // Optional explicit ordering: [{ id, seriesOrder }]
  if (Array.isArray(body?.order)) {
    await prisma.$transaction(
      (body.order as { id: string; seriesOrder: number }[]).map(o =>
        prisma.post.update({ where: { id: String(o.id) }, data: { seriesOrder: Math.max(0, Number(o.seriesOrder) || 0) } }),
      ),
    );
  }
  return json({ series });
}

export async function DELETE(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const id = str((await readJson(req))?.id, 64);
  await prisma.series.delete({ where: { id } }).catch(() => null);
  return json({ ok: true });
}
