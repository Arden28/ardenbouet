// GET / PUT /api/admin/booking/config — availability rules, limits, Google connection, meeting types
import { prisma } from '@/lib/prisma';
import { err, isAdminRequest, json, readJson, str } from '@/lib/apiUtil';
import { getConfig, parseRules } from '@/lib/booking/slots';
import { isValidTimeZone } from '@/lib/booking/time';
import { googleConfigured } from '@/lib/booking/google';

export const dynamic = 'force-dynamic';

async function payload() {
  const cfg = await getConfig();
  const types = await prisma.meetingType.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }], include: { _count: { select: { bookings: true } } } });
  return {
    config: {
      timezone: cfg.timezone, rules: parseRules(cfg.rules), minNoticeMin: cfg.minNoticeMin, maxDaysAhead: cfg.maxDaysAhead,
      slotStepMin: cfg.slotStepMin, googleCalendarId: cfg.googleCalendarId,
    },
    google: { configured: googleConfigured(), connected: !!cfg.googleRefreshToken, email: cfg.googleEmail },
    types,
  };
}

export async function GET() {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  return json(await payload());
}

export async function PUT(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const body = await readJson(req);
  if (!body) return err('Invalid JSON');
  await getConfig();
  const data: Record<string, unknown> = {};
  if (body.timezone !== undefined) {
    const tz = str(body.timezone, 64);
    if (!isValidTimeZone(tz)) return err('Unknown time zone');
    data.timezone = tz;
  }
  if (body.rules !== undefined) data.rules = parseRules(body.rules);
  const int = (v: unknown, min: number, max: number) => Math.max(min, Math.min(max, Math.round(Number(v) || 0)));
  if (body.minNoticeMin !== undefined) data.minNoticeMin = int(body.minNoticeMin, 0, 60 * 24 * 14);
  if (body.maxDaysAhead !== undefined) data.maxDaysAhead = int(body.maxDaysAhead, 1, 365);
  if (body.slotStepMin !== undefined) data.slotStepMin = int(body.slotStepMin, 5, 120);
  if (body.googleCalendarId !== undefined) data.googleCalendarId = str(body.googleCalendarId, 200) || 'primary';
  if (body.disconnectGoogle === true) { data.googleRefreshToken = null; data.googleEmail = null; }
  await prisma.bookingConfig.update({ where: { id: 1 }, data });
  return json(await payload());
}
