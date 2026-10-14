// lib/booking/slots.ts — availability: weekly rules − notice/horizon − bookings (+buffer) − Google busy.
import 'server-only';
import type { BookingConfig, MeetingType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { googleBusy } from './google';
import { addDays, dayKey, hhmm, minutesOf, weekdayOf, zonedToUtc } from './time';

export type Rule = { day: number; start: string; end: string };

export const DEFAULT_RULES: Rule[] = [1, 2, 3, 4, 5].flatMap(day => [
  { day, start: '09:00', end: '12:30' },
  { day, start: '14:00', end: '17:30' },
]);

export async function getConfig(): Promise<BookingConfig> {
  return (
    (await prisma.bookingConfig.findUnique({ where: { id: 1 } })) ??
    (await prisma.bookingConfig.create({ data: { id: 1, rules: DEFAULT_RULES } }))
  );
}

export function parseRules(v: unknown): Rule[] {
  if (!Array.isArray(v)) return [];
  return v
    .map(r => ({ day: Number((r as Rule).day), start: String((r as Rule).start), end: String((r as Rule).end) }))
    .filter(r => r.day >= 0 && r.day <= 6 && /^\d\d:\d\d$/.test(r.start) && /^\d\d:\d\d$/.test(r.end) && minutesOf(r.end) > minutesOf(r.start));
}

/** Ensures at least one meeting type exists so the booking modal always works. */
export async function activeMeetingTypes(): Promise<MeetingType[]> {
  const types = await prisma.meetingType.findMany({ where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  if (types.length || (await prisma.meetingType.count())) return types;
  return [await prisma.meetingType.create({
    data: {
      slug: 'intro-call', title: 'Intro call', titleFr: 'Appel de découverte',
      description: 'A first conversation about your product, timeline and how I can help.',
      descriptionFr: 'Un premier échange sur votre produit, vos délais et la façon dont je peux vous aider.',
      durationMin: 30, bufferMin: 10,
    },
  })];
}

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd;

/**
 * Available start times (UTC ISO) per owner-local day, between `fromDay` and `toDay` inclusive
 * (owner-timezone calendar days). Days without slots are omitted.
 */
export async function availableSlots(type: MeetingType, fromDay?: string, toDay?: string): Promise<Record<string, string[]>> {
  const cfg = await getConfig();
  const tz = cfg.timezone;
  const rules = parseRules(cfg.rules);
  const now = Date.now();
  const earliest = now + cfg.minNoticeMin * 60_000;
  const today = dayKey(new Date(now), tz);
  const lastDay = addDays(today, cfg.maxDaysAhead);
  const from = fromDay && fromDay > today ? fromDay : today;
  const to = toDay && toDay < lastDay ? toDay : lastDay;
  if (from > to) return {};

  const rangeStart = zonedToUtc(from, '00:00', tz);
  const rangeEnd = zonedToUtc(addDays(to, 1), '00:00', tz);
  const buffer = type.bufferMin * 60_000;

  const [bookings, busy] = await Promise.all([
    prisma.booking.findMany({
      where: { status: 'CONFIRMED', start: { lt: new Date(rangeEnd.getTime() + 86_400_000) }, end: { gt: new Date(rangeStart.getTime() - 86_400_000) } },
      select: { start: true, end: true, meetingType: { select: { bufferMin: true } } },
    }),
    googleBusy(rangeStart, rangeEnd),
  ]);
  const blocked = [
    ...bookings.map(b => ({ s: b.start.getTime() - Math.max(buffer, b.meetingType.bufferMin * 60_000), e: b.end.getTime() + Math.max(buffer, b.meetingType.bufferMin * 60_000) })),
    ...busy.map(b => ({ s: b.start.getTime() - buffer, e: b.end.getTime() + buffer })),
  ];

  const out: Record<string, string[]> = {};
  const step = Math.max(5, cfg.slotStepMin);
  for (let day = from; day <= to; day = addDays(day, 1)) {
    const wd = weekdayOf(day);
    const slots: string[] = [];
    for (const rule of rules.filter(r => r.day === wd)) {
      for (let m = minutesOf(rule.start); m + type.durationMin <= minutesOf(rule.end); m += step) {
        const start = zonedToUtc(day, hhmm(m), tz).getTime();
        const end = start + type.durationMin * 60_000;
        if (start < earliest) continue;
        if (blocked.some(b => overlaps(start, end, b.s, b.e))) continue;
        slots.push(new Date(start).toISOString());
      }
    }
    if (slots.length) out[day] = Array.from(new Set(slots)).sort();
  }
  return out;
}

export async function isSlotAvailable(type: MeetingType, start: Date): Promise<boolean> {
  const cfg = await getConfig();
  const day = dayKey(start, cfg.timezone);
  const slots = await availableSlots(type, day, day);
  return (slots[day] ?? []).includes(start.toISOString());
}
