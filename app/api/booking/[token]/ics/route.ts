// GET /api/booking/[token]/ics — calendar file for a booking
import { prisma } from '@/lib/prisma';
import { bookingIcs } from '@/lib/booking/book';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const b = await prisma.booking.findUnique({ where: { cancelToken: params.token }, include: { meetingType: true } });
  if (!b) return new Response('Not found', { status: 404 });
  return new Response(bookingIcs(b), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'attachment; filename="meeting.ics"' },
  });
}
