// GET /api/admin/booking/google/callback — finish Google Calendar OAuth, store the refresh token
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { isAdminRequest } from '@/lib/apiUtil';
import { exchangeCode } from '@/lib/booking/google';
import { getConfig } from '@/lib/booking/slots';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const back = (status: string) => {
    const res = NextResponse.redirect(new URL(`/admin/bookings/settings?google=${status}`, url));
    res.cookies.delete('g_oauth_state');
    return res;
  };
  if (!(await isAdminRequest())) return back('unauthorized');
  const state = url.searchParams.get('state');
  if (!state || state !== cookies().get('g_oauth_state')?.value) return back('invalid-state');
  const code = url.searchParams.get('code');
  if (!code) return back(url.searchParams.get('error') ?? 'denied');
  try {
    const { refreshToken, email } = await exchangeCode(code);
    await getConfig();
    await prisma.bookingConfig.update({ where: { id: 1 }, data: { googleRefreshToken: refreshToken, googleEmail: email } });
    return back('connected');
  } catch (e) {
    console.error('[booking] Google connect failed', e);
    return back('failed');
  }
}
