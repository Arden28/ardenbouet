// POST / PUT / DELETE /api/admin/booking/types — meeting types (duration, buffer, location…)
import { prisma } from '@/lib/prisma';
import { err, isAdminRequest, json, readJson, str } from '@/lib/apiUtil';
import { slugify } from '@/lib/blog/doc';

export const dynamic = 'force-dynamic';
const LOCATIONS = ['GOOGLE_MEET', 'CUSTOM_LINK', 'PHONE', 'IN_PERSON'] as const;

function fields(body: Record<string, unknown>) {
  const int = (v: unknown, min: number, max: number, d: number) => (v === undefined ? undefined : Math.max(min, Math.min(max, Math.round(Number(v) || d))));
  return {
    ...(body.title !== undefined ? { title: str(body.title, 120).trim() || 'Meeting' } : {}),
    ...(body.titleFr !== undefined ? { titleFr: str(body.titleFr, 120).trim() } : {}),
    ...(body.description !== undefined ? { description: str(body.description, 1000) } : {}),
    ...(body.descriptionFr !== undefined ? { descriptionFr: str(body.descriptionFr, 1000) } : {}),
    ...(body.durationMin !== undefined ? { durationMin: int(body.durationMin, 5, 480, 30) } : {}),
    ...(body.bufferMin !== undefined ? { bufferMin: int(body.bufferMin, 0, 240, 0) } : {}),
    ...(body.location !== undefined && LOCATIONS.includes(body.location as typeof LOCATIONS[number]) ? { location: body.location as typeof LOCATIONS[number] } : {}),
    ...(body.locationDetail !== undefined ? { locationDetail: str(body.locationDetail, 300) } : {}),
    ...(body.active !== undefined ? { active: !!body.active } : {}),
    ...(body.sortOrder !== undefined ? { sortOrder: int(body.sortOrder, 0, 1000, 0) } : {}),
  };
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const body = await readJson(req);
  if (!body) return err('Invalid JSON');
  const title = str(body.title, 120).trim() || 'New meeting';
  let slug = slugify(title) || 'meeting';
  for (let i = 2; await prisma.meetingType.findUnique({ where: { slug } }); i++) slug = `${slugify(title)}-${i}`;
  const type = await prisma.meetingType.create({ data: { slug, title, ...fields(body) } });
  return json({ type }, 201);
}

export async function PUT(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const body = await readJson(req);
  const id = str(body?.id, 64);
  if (!id) return err('Missing id');
  const type = await prisma.meetingType.update({ where: { id }, data: fields(body!) });
  return json({ type });
}

export async function DELETE(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const id = str((await readJson(req))?.id, 64);
  const used = await prisma.booking.count({ where: { meetingTypeId: id } });
  // Types with bookings are deactivated instead of deleted, to keep the history.
  if (used) await prisma.meetingType.update({ where: { id }, data: { active: false } });
  else await prisma.meetingType.delete({ where: { id } }).catch(() => null);
  return json({ ok: true, deactivated: used > 0 });
}
