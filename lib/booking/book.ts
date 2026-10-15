// lib/booking/book.ts — create / cancel bookings, emails, calendar links, CRM sync.
import 'server-only';
import { randomBytes } from 'crypto';
import type { Booking, MeetingType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { SITE_URL } from '@/lib/mailer';
import { notifyEmail, notifyOwner } from '@/lib/notify';
import { OWNER } from '@/lib/site';
import { cancelGoogleEvent, createGoogleEvent } from './google';

const LOCATION_LABEL: Record<MeetingType['location'], string> = {
  GOOGLE_MEET: 'Google Meet', CUSTOM_LINK: 'Video call', PHONE: 'Phone call', IN_PERSON: 'In person',
};

export function locationLabel(t: Pick<MeetingType, 'location' | 'locationDetail'>) {
  return t.location === 'IN_PERSON' && t.locationDetail ? t.locationDetail : LOCATION_LABEL[t.location];
}

export function formatWhen(d: Date, tz: string, locale: string) {
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    timeZone: tz, weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  }).format(d);
}

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const icsEsc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, m => `\\${m}`);

export function bookingIcs(b: Booking & { meetingType: MeetingType }) {
  const where = b.meetLink ?? (b.meetingType.location === 'CUSTOM_LINK' ? b.meetingType.locationDetail : locationLabel(b.meetingType));
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ardenbouet.me//booking//EN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${b.id}@ardenbouet.me`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(b.start)}`,
    `DTEND:${icsDate(b.end)}`,
    `SUMMARY:${icsEsc(`${b.meetingType.title} with ${OWNER.name}`)}`,
    `DESCRIPTION:${icsEsc(`${b.notes ? `${b.notes}\n\n` : ''}${where ? `Join: ${where}\n` : ''}Cancel: ${SITE_URL}/booking/${b.cancelToken}`)}`,
    where ? `LOCATION:${icsEsc(where)}` : '',
    b.status === 'CANCELLED' ? 'STATUS:CANCELLED' : 'STATUS:CONFIRMED',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
}

export function googleCalendarLink(b: Booking & { meetingType: MeetingType }) {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${b.meetingType.title} with ${OWNER.name}`,
    dates: `${icsDate(b.start)}/${icsDate(b.end)}`,
    details: `${b.meetLink ? `Join: ${b.meetLink}\n` : ''}Manage: ${SITE_URL}/booking/${b.cancelToken}`,
    ...(b.meetLink ? { location: b.meetLink } : {}),
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

/** Link (or create) a CRM lead for the guest. Never throws. */
async function syncCrm(name: string, email: string, note: string): Promise<string | null> {
  try {
    const existing = await prisma.crmClient.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    if (existing) {
      await prisma.crmClient.update({ where: { id: existing.id }, data: { notes: [existing.notes, note].filter(Boolean).join('\n\n') } });
      return existing.id;
    }
    const c = await prisma.crmClient.create({ data: { name, email, status: 'LEAD', notes: note, tags: ['booking'] } });
    return c.id;
  } catch (e) {
    console.error('[booking] CRM sync failed', e);
    return null;
  }
}

export async function createBooking(input: {
  type: MeetingType; start: Date; name: string; email: string; notes: string; guestTimezone: string; locale: string;
}) {
  const { type, start } = input;
  const end = new Date(start.getTime() + type.durationMin * 60_000);
  const cancelToken = randomBytes(18).toString('base64url');
  const booking = await prisma.booking.create({
    data: {
      meetingTypeId: type.id, start, end, name: input.name, email: input.email, notes: input.notes,
      guestTimezone: input.guestTimezone, locale: input.locale, cancelToken,
    },
  });

  const event = await createGoogleEvent({
    summary: `${type.title}: ${input.name}`,
    description: `${input.notes || 'No notes.'}\n\nBooked via ${SITE_URL}\nManage: ${SITE_URL}/booking/${cancelToken}`,
    start, end,
    attendeeEmail: input.email,
    attendeeName: input.name,
    withMeet: type.location === 'GOOGLE_MEET',
    location: type.location === 'IN_PERSON' ? type.locationDetail : type.location === 'CUSTOM_LINK' ? type.locationDetail : undefined,
    requestId: booking.id,
  });
  const meetLink = event?.meetLink ?? (type.location === 'CUSTOM_LINK' ? type.locationDetail || null : null);
  const crmClientId = await syncCrm(input.name, input.email, `Booked “${type.title}” for ${start.toISOString()}${input.notes ? `: ${input.notes}` : ''}`);
  const saved = await prisma.booking.update({
    where: { id: booking.id },
    data: { googleEventId: event?.eventId ?? null, meetLink, crmClientId },
    include: { meetingType: true },
  });

  const fr = input.locale === 'fr';
  const when = formatWhen(start, input.guestTimezone, input.locale);
  await notifyEmail(input.email,
    fr ? `Confirmé : ${type.titleFr || type.title} avec ${OWNER.name}` : `Confirmed: ${type.title} with ${OWNER.name}`,
    (fr
      ? `Bonjour ${input.name},\n\nVotre rendez-vous est confirmé pour le ${when}.`
      : `Hi ${input.name},\n\nYou’re booked for ${when}.`)
      + (meetLink ? `\n\n${fr ? 'Lien de la réunion' : 'Join link'}: ${meetLink}` : `\n\n${locationLabel(type)}`)
      + `\n\n${fr ? 'Ajouter à Google Agenda' : 'Add to Google Calendar'}: ${googleCalendarLink(saved)}`
      + `\n${fr ? 'Fichier .ics' : 'Calendar file (.ics)'}: ${SITE_URL}/api/booking/${cancelToken}/ics`,
    { label: fr ? 'Gérer ou annuler' : 'Manage or cancel', href: `${SITE_URL}${fr ? '/fr' : ''}/booking/${cancelToken}` });
  await notifyOwner(`New booking: ${type.title} with ${input.name}`,
    `${input.name} <${input.email}> booked ${formatWhen(start, OWNER.timezone, 'en')}.${input.notes ? `\n\n${input.notes}` : ''}`, '/admin/bookings');

  return saved;
}

export async function cancelBooking(b: Booking & { meetingType: MeetingType }, reason: string, by: 'guest' | 'owner') {
  if (b.status === 'CANCELLED') return b;
  const updated = await prisma.booking.update({
    where: { id: b.id },
    data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason },
    include: { meetingType: true },
  });
  if (b.googleEventId) await cancelGoogleEvent(b.googleEventId);
  const when = formatWhen(b.start, b.guestTimezone, b.locale);
  if (by === 'owner') {
    await notifyEmail(b.email, b.locale === 'fr' ? 'Rendez-vous annulé' : 'Your meeting was cancelled',
      `${b.locale === 'fr' ? 'Votre rendez-vous du' : 'Your meeting on'} ${when} ${b.locale === 'fr' ? 'a été annulé.' : 'was cancelled.'}${reason ? `\n\n${reason}` : ''}`,
      { label: b.locale === 'fr' ? 'Choisir un autre créneau' : 'Pick another time', href: `${SITE_URL}${b.locale === 'fr' ? '/fr' : ''}/?book=1` });
  } else {
    await notifyOwner(`Cancelled: ${b.meetingType.title} with ${b.name}`, `${b.name} cancelled ${formatWhen(b.start, OWNER.timezone, 'en')}.${reason ? `\n\n${reason}` : ''}`, '/admin/bookings');
  }
  return updated;
}
