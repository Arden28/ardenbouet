// GET /api/admin/bookings?scope=upcoming|past|cancelled — PATCH { id, action: 'cancel', reason? }
import { prisma } from '@/lib/prisma';
import { err, isAdminRequest, json, readJson, str } from '@/lib/apiUtil';
import { cancelBooking } from '@/lib/booking/book';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const scope = new URL(req.url).searchParams.get('scope') ?? 'upcoming';
  const now = new Date();
  const where =
    scope === 'past' ? { status: 'CONFIRMED' as const, start: { lt: now } }
    : scope === 'cancelled' ? { status: 'CANCELLED' as const }
    : { status: 'CONFIRMED' as const, end: { gte: now } };
  const bookings = await prisma.booking.findMany({
    where,
    include: { meetingType: { select: { title: true, durationMin: true, location: true } } },
    orderBy: { start: scope === 'upcoming' ? 'asc' : 'desc' },
    take: 300,
  });
  const counts = {
    upcoming: await prisma.booking.count({ where: { status: 'CONFIRMED', end: { gte: now } } }),
    past: await prisma.booking.count({ where: { status: 'CONFIRMED', start: { lt: now } } }),
    cancelled: await prisma.booking.count({ where: { status: 'CANCELLED' } }),
  };
  return json({ bookings, counts });
}

export async function PATCH(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const body = await readJson(req);
  const b = await prisma.booking.findUnique({ where: { id: str(body?.id, 64) }, include: { meetingType: true } });
  if (!b) return err('Not found', 404);
  if (body?.action !== 'cancel') return err('Unknown action');
  await cancelBooking(b, str(body.reason, 500), 'owner');
  return json({ ok: true });
}
