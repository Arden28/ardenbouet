// app/api/admin/login/route.ts
import { NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, ADMIN_SESSION_MAX_AGE, createAdminToken } from '@/lib/adminSession';

export const runtime = 'nodejs'; // ensure cookies are writable here

const USER = process.env.ADMIN_USER || '';
const PASS = process.env.ADMIN_PASS || '';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    // Simple guard for missing env (helps during dev)
    if (!USER || !PASS) {
      return NextResponse.json(
        { error: 'Server auth not configured' },
        { status: 500 }
      );
    }

    if (username === USER && password === PASS) {
      const res = NextResponse.json({ ok: true }, { status: 200 });
      res.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: await createAdminToken(),
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: ADMIN_SESSION_MAX_AGE,
      });
      return res;
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
