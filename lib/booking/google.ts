// lib/booking/google.ts — Google Calendar (free/busy + events with Meet links) over plain REST.
// Uses the same OAuth client as Google sign-in (GOOGLE_CLIENT_ID/SECRET) with calendar scopes;
// the owner connects once in the admin and the refresh token is stored on BookingConfig.
import 'server-only';
import { prisma } from '@/lib/prisma';
import { SITE_URL } from '@/lib/mailer';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar.freebusy', 'openid', 'email'];
export const GOOGLE_REDIRECT = () => `${SITE_URL}/api/admin/booking/google/callback`;

export function googleConfigured() {
  return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
}

export function googleAuthUrl(state: string) {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: GOOGLE_REDIRECT(),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    scope: SCOPES.join(' '),
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

export async function exchangeCode(code: string): Promise<{ refreshToken: string; email: string | null }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: GOOGLE_REDIRECT(), grant_type: 'authorization_code',
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.refresh_token) throw new Error(data.error_description || 'Google did not return a refresh token');
  let email: string | null = null;
  try { email = JSON.parse(Buffer.from(String(data.id_token).split('.')[1], 'base64url').toString()).email ?? null; } catch { /* ignore */ }
  return { refreshToken: data.refresh_token, email };
}

let cached: { token: string; exp: number; refresh: string } | null = null;

async function accessToken(refreshToken: string): Promise<string> {
  if (cached && cached.refresh === refreshToken && cached.exp > Date.now() + 60_000) return cached.token;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken, grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google token refresh failed: ${data.error ?? res.status}`);
  cached = { token: data.access_token, exp: Date.now() + data.expires_in * 1000, refresh: refreshToken };
  return data.access_token;
}

async function calendarCtx() {
  const cfg = await prisma.bookingConfig.findUnique({ where: { id: 1 } });
  if (!cfg?.googleRefreshToken || !googleConfigured()) return null;
  return { token: await accessToken(cfg.googleRefreshToken), calendarId: cfg.googleCalendarId || 'primary' };
}

/** Busy intervals from Google between two instants ([] when not connected or on error). */
export async function googleBusy(from: Date, to: Date): Promise<{ start: Date; end: Date }[]> {
  try {
    const ctx = await calendarCtx();
    if (!ctx) return [];
    const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: { Authorization: `Bearer ${ctx.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeMin: from.toISOString(), timeMax: to.toISOString(), items: [{ id: ctx.calendarId }] }),
    });
    const data = await res.json();
    const busy = data.calendars?.[ctx.calendarId]?.busy ?? [];
    return busy.map((b: { start: string; end: string }) => ({ start: new Date(b.start), end: new Date(b.end) }));
  } catch (e) {
    console.error('[booking] Google free/busy failed', e);
    return [];
  }
}

export async function createGoogleEvent(opts: {
  summary: string; description: string; start: Date; end: Date; attendeeEmail: string; attendeeName: string; withMeet: boolean; location?: string; requestId: string;
}): Promise<{ eventId: string; meetLink: string | null } | null> {
  try {
    const ctx = await calendarCtx();
    if (!ctx) return null;
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(ctx.calendarId)}/events?sendUpdates=all${opts.withMeet ? '&conferenceDataVersion=1' : ''}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${ctx.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: opts.summary,
          description: opts.description,
          location: opts.location,
          start: { dateTime: opts.start.toISOString() },
          end: { dateTime: opts.end.toISOString() },
          attendees: [{ email: opts.attendeeEmail, displayName: opts.attendeeName }],
          reminders: { useDefault: true },
          ...(opts.withMeet ? { conferenceData: { createRequest: { requestId: opts.requestId, conferenceSolutionKey: { type: 'hangoutsMeet' } } } } : {}),
        }),
      },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message ?? String(res.status));
    const meet = data.hangoutLink ?? data.conferenceData?.entryPoints?.find((e: { entryPointType: string }) => e.entryPointType === 'video')?.uri ?? null;
    return { eventId: data.id, meetLink: meet };
  } catch (e) {
    console.error('[booking] Google event creation failed', e);
    return null;
  }
}

export async function cancelGoogleEvent(eventId: string) {
  try {
    const ctx = await calendarCtx();
    if (!ctx) return;
    await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(ctx.calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ctx.token}` },
    });
  } catch (e) {
    console.error('[booking] Google event cancel failed', e);
  }
}
