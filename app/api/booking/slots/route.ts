// GET /api/booking/slots?type=<id>&from=YYYY-MM-DD&to=YYYY-MM-DD
// → { timezone, days: { [ownerDay]: [ISO start, …] } } — the client groups by the guest's timezone.
import { prisma } from '@/lib/prisma';
import { err, json } from '@/lib/apiUtil';
import { availableSlots, getConfig } from '@/lib/booking/slots';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const type = await prisma.meetingType.findFirst({ where: { id: sp.get('type') ?? '', active: true } });
  if (!type) return err('Unknown meeting type', 404);
  const day = /^\d{4}-\d{2}-\d{2}$/;
  const from = day.test(sp.get('from') ?? '') ? sp.get('from')! : undefined;
  const to = day.test(sp.get('to') ?? '') ? sp.get('to')! : undefined;
  const [cfg, days] = await Promise.all([getConfig(), availableSlots(type, from, to)]);
  return json({ timezone: cfg.timezone, durationMin: type.durationMin, days });
}
