// lib/adminSession.ts — signed admin session tokens (Web Crypto, works in Edge middleware and Node routes)
//
// Token format: `v1.<expiresAtMs>.<base64url HMAC-SHA256 of "v1.<expiresAtMs>">`
// Secret: ADMIN_SESSION_SECRET, falling back to ADMIN_PASS so existing deploys keep working.

export const ADMIN_COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'admin_session';
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8; // 8h, in seconds

const encoder = new TextEncoder();

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASS || '';
}

function toBase64Url(buf: ArrayBuffer): string {
  let s = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return toBase64Url(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createAdminToken(): Promise<string> {
  const secret = getSecret();
  if (!secret) throw new Error('ADMIN_SESSION_SECRET (or ADMIN_PASS) is not set');
  const payload = `v1.${Date.now() + ADMIN_SESSION_MAX_AGE * 1000}`;
  return `${payload}.${await hmac(payload, secret)}`;
}

export async function verifyAdminToken(token: string | undefined | null): Promise<boolean> {
  const secret = getSecret();
  if (!token || !secret) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return false;
  const expiresAt = Number(parts[1]);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  const expected = await hmac(`${parts[0]}.${parts[1]}`, secret);
  return safeEqual(parts[2], expected);
}
