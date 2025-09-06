// app/api/admin/login/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // ensure cookies are writable here

const USER = process.env.ADMIN_USER || '';
const PASS = process.env.ADMIN_PASS || '';
const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'admin_session';
const MAX_AGE = 60 * 60 * 8; // 8h

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
        name: COOKIE_NAME,
        value: '1',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: MAX_AGE,
      });
      return res;
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
