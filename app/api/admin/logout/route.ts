import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'admin_session';

export async function POST() {
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set({
    name: COOKIE_NAME,
    value: '',
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0, // expire now
  });
  return res;
}
