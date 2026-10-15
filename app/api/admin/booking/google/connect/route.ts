// GET /api/admin/booking/google/connect — start Google Calendar OAuth (admin only)
import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/apiUtil';
import { googleAuthUrl, googleConfigured } from '@/lib/booking/google';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!(await isAdminRequest())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!googleConfigured()) return NextResponse.redirect(new URL('/admin/bookings/settings?google=not-configured', req.url));
  const state = randomBytes(16).toString('hex');
  const res = NextResponse.redirect(googleAuthUrl(state));
  res.cookies.set('g_oauth_state', state, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 600, secure: process.env.NODE_ENV === 'production' });
  return res;
}
