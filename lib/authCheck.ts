// lib/authCheck.ts — admin diagnostics for reader sign-in, run on the server with the deployed env.
// Each OAuth check exchanges a deliberately fake code at the provider's token endpoint: valid client
// credentials get "bad code" (invalid_grant / bad_verification_code), wrong ones get "invalid client".
// Nothing secret is returned, only the provider's error keyword and facts about how the value was stored.
import 'server-only';
import { cleanEnv } from '@/lib/readerAuth';

export type AuthCheck = { key: string; name: string; ok: boolean; detail: string; env: string };

const SITE = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://ardenbouet.me').replace(/\/$/, '');

/** How a raw env value was stored, without revealing it. */
function storage(raw: string | undefined): string {
  if (!raw) return 'missing';
  const notes: string[] = [];
  if (/^\s|\s$/.test(raw)) notes.push('has leading/trailing whitespace');
  if (/^(['"])[\s\S]*\1$/.test(raw.trim())) notes.push('is wrapped in quotes');
  return notes.length ? `stored value ${notes.join(' and ')} (ignored since #4)` : '';
}

async function exchange(url: string, body: Record<string, string>): Promise<string> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json().catch(() => ({}));
    return String(data.error ?? (res.ok ? 'no_error' : `http_${res.status}`));
  } catch (e) {
    return `network_error: ${(e as Error).message}`;
  }
}

const PROVIDERS = [
  {
    key: 'github', name: 'GitHub', idVar: 'GITHUB_ID', secretVar: 'GITHUB_SECRET',
    test: (id: string, secret: string) => exchange('https://github.com/login/oauth/access_token', { client_id: id, client_secret: secret, code: 'diagnostic-check' }),
    good: ['bad_verification_code'], bad: ['incorrect_client_credentials'],
    setup: 'OAuth App → Authorization callback URL',
  },
  {
    key: 'google', name: 'Google', idVar: 'GOOGLE_CLIENT_ID', secretVar: 'GOOGLE_CLIENT_SECRET',
    test: (id: string, secret: string) => exchange('https://oauth2.googleapis.com/token', { client_id: id, client_secret: secret, code: 'diagnostic-check', grant_type: 'authorization_code', redirect_uri: `${SITE}/api/auth/callback/google` }),
    good: ['invalid_grant'], bad: ['invalid_client', 'unauthorized_client'],
    setup: 'OAuth client → Authorized redirect URIs',
  },
  {
    key: 'discord', name: 'Discord', idVar: 'DISCORD_CLIENT_ID', secretVar: 'DISCORD_CLIENT_SECRET',
    test: (id: string, secret: string) => exchange('https://discord.com/api/oauth2/token', { client_id: id, client_secret: secret, code: 'diagnostic-check', grant_type: 'authorization_code', redirect_uri: `${SITE}/api/auth/callback/discord` }),
    good: ['invalid_grant'], bad: ['invalid_client'],
    setup: 'OAuth2 → Redirects',
  },
];

export async function authChecks(): Promise<AuthCheck[]> {
  const e = process.env;
  const out: AuthCheck[] = [];

  // NEXTAUTH_URL decides the callback URLs and the cookie names; a mismatch with the real domain breaks the state check.
  const url = cleanEnv(e.NEXTAUTH_URL);
  out.push({
    key: 'nextauth-url', name: 'Sign-in base URL', env: 'NEXTAUTH_URL',
    ok: !!url && /^https:\/\//.test(url),
    detail: url ? `${url}${/^https:\/\//.test(url) ? '' : ' (must be https:// in production)'}` : 'Not set: next-auth guesses the host, set it to https://ardenbouet.me',
  });
  out.push({
    key: 'nextauth-secret', name: 'Sign-in secret', env: 'NEXTAUTH_SECRET',
    ok: !!cleanEnv(e.NEXTAUTH_SECRET),
    detail: cleanEnv(e.NEXTAUTH_SECRET) ? 'Set' : 'Not set: falling back to ADMIN_SESSION_SECRET (works, but set a dedicated one)',
  });

  for (const p of PROVIDERS) {
    const id = cleanEnv(e[p.idVar]);
    const secret = cleanEnv(e[p.secretVar]);
    if (!id && !secret) continue;
    const env = `${p.idVar}, ${p.secretVar}`;
    if (!id || !secret) { out.push({ key: p.key, name: `${p.name} sign-in`, ok: false, detail: `${!id ? p.idVar : p.secretVar} is missing`, env }); continue; }
    const result = await p.test(id, secret);
    const stored = [storage(e[p.idVar]), storage(e[p.secretVar])].filter(Boolean).join('; ');
    const callback = `${url || SITE}/api/auth/callback/${p.key}`;
    if (p.good.includes(result)) {
      out.push({ key: p.key, name: `${p.name} sign-in`, ok: true, env, detail: `Client ID and secret accepted by ${p.name}. The ${p.setup} must be exactly ${callback}.${stored ? ` Note: ${stored}.` : ''}` });
    } else if (p.bad.includes(result)) {
      out.push({ key: p.key, name: `${p.name} sign-in`, ok: false, env, detail: `${p.name} rejects the client credentials (${result}): the secret doesn't belong to this client ID, or was regenerated. Create a new client secret and paste it without quotes, then redeploy.${stored ? ` (${stored})` : ''}` });
    } else {
      out.push({ key: p.key, name: `${p.name} sign-in`, ok: false, env, detail: `Unexpected answer from ${p.name}: ${result}` });
    }
  }
  return out;
}
