// GET /api/booking/[token] — booking details for the guest; DELETE { reason? } — guest cancels
import { prisma } from '@/lib/prisma';
import { err, json, readJson, str } from '@/lib/apiUtil';
import { cancelBooking, googleCalendarLink, locationLabel } from '@/lib/booking/book';

export const dynamic = 'force-dynamic';

async function find(token: string) {
  return prisma.booking.findUnique({ where: { cancelToken: token }, include: { meetingType: true } });
}

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const b = await find(params.token);
  if (!b) return err('Booking not found', 404);
  return json({
    booking: {
      title: b.meetingType.title, titleFr: b.meetingType.titleFr, start: b.start, end: b.end, status: b.status, name: b.name,
      guestTimezone: b.guestTimezone, meetLink: b.status === 'CONFIRMED' ? b.meetLink : null, location: locationLabel(b.meetingType),
      googleCalendar: googleCalendarLink(b),
    },
  });
}

export async function DELETE(req: Request, { params }: { params: { token: string } }) {
  const b = await find(params.token);
  if (!b) return err('Booking not found', 404);
  if (b.start.getTime() < Date.now()) return err('This meeting has already started');
  await cancelBooking(b, str((await readJson(req))?.reason, 500), 'guest');
  return json({ ok: true });
}
