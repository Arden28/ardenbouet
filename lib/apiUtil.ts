// lib/apiUtil.ts — small helpers shared by route handlers.
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, verifyAdminToken } from '@/lib/adminSession';

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const err = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function isAdminRequest(): Promise<boolean> {
  return verifyAdminToken(cookies().get(ADMIN_COOKIE_NAME)?.value);
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export const str = (v: unknown, max = 10_000) => (typeof v === 'string' ? v.slice(0, max) : '');
