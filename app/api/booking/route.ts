// GET  /api/booking — meeting types + host info for the booking modal
// POST /api/booking { typeId, start, name, email, notes?, timezone, locale? } — book a slot
import { prisma } from '@/lib/prisma';
import { err, json, readJson, str } from '@/lib/apiUtil';
import { activeMeetingTypes, getConfig, isSlotAvailable } from '@/lib/booking/slots';
import { createBooking, locationLabel } from '@/lib/booking/book';
import { isValidTimeZone } from '@/lib/booking/time';
import { OWNER } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [types, cfg] = await Promise.all([activeMeetingTypes(), getConfig()]);
  return json({
    host: { name: OWNER.name, avatar: OWNER.avatar, timezone: cfg.timezone },
    maxDaysAhead: cfg.maxDaysAhead,
    types: types.map(t => ({
      id: t.id, slug: t.slug, title: t.title, titleFr: t.titleFr, description: t.description, descriptionFr: t.descriptionFr,
      durationMin: t.durationMin, location: t.location, locationLabel: locationLabel(t),
    })),
  });
}

const recent = new Map<string, number[]>(); // naive per-IP throttle (per server instance)

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'local';
  const hits = (recent.get(ip) ?? []).filter(t => Date.now() - t < 60 * 60_000);
  if (hits.length >= 5) return err('Too many bookings from this network — please try again later', 429);

  const body = await readJson(req);
  if (!body) return err('Invalid JSON');
  if (str(body.website)) return json({ ok: true }); // honeypot
  const name = str(body.name, 80).trim();
  const email = str(body.email, 254).trim().toLowerCase();
  if (!name) return err('Please enter your name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err('Please enter a valid email');
  const tz = str(body.timezone, 64);
  const start = new Date(str(body.start, 40));
  if (isNaN(start.getTime())) return err('Pick a time');

  const type = await prisma.meetingType.findFirst({ where: { id: str(body.typeId, 64), active: true } });
  if (!type) return err('This meeting type is not available', 404);
  if (!(await isSlotAvailable(type, start))) return err('That time was just taken — please pick another one', 409);

  const booking = await createBooking({
    type, start, name, email,
    notes: str(body.notes, 2000).trim(),
    guestTimezone: isValidTimeZone(tz) ? tz : 'UTC',
    locale: body.locale === 'fr' ? 'fr' : 'en',
  });
  hits.push(Date.now());
  recent.set(ip, hits);

  return json({
    booking: { start: booking.start, end: booking.end, meetLink: booking.meetLink, token: booking.cancelToken, location: locationLabel(type) },
  }, 201);
}
