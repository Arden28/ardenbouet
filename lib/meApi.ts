// lib/meApi.ts — helpers for /api/me/* route handlers (the signed-in reader's own data).
import 'server-only';
import type { Reader, WriterGrant } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getReader } from '@/lib/readerAuth';
import { activeGrant } from '@/lib/accounts';
import { err } from '@/lib/apiUtil';

export type MeCtx = { reader: Reader; grant: WriterGrant | null };

/** Resolves the signed-in reader (+ active writer grant) or returns a 401 response. */
export async function requireReader(): Promise<MeCtx | { error: Response }> {
  const reader = await getReader();
  if (!reader) return { error: err('Sign in required', 401) };
  const grant = activeGrant(await prisma.writerGrant.findUnique({ where: { readerId: reader.id } }));
  return { reader, grant };
}

export async function requireWriter(): Promise<(MeCtx & { grant: WriterGrant }) | { error: Response }> {
  const ctx = await requireReader();
  if ('error' in ctx) return ctx;
  if (!ctx.grant) return { error: err('You don’t have writing access', 403) };
  return ctx as MeCtx & { grant: WriterGrant };
}

export function publicReader(r: Reader) {
  return {
    id: r.id, name: r.name, handle: r.handle, image: r.image, bio: r.bio, website: r.website, location: r.location,
    locale: r.locale, email: r.email, provider: r.provider, createdAt: r.createdAt.toISOString(),
    stripeConnected: !!r.stripeAccountId, stripeChargesEnabled: r.stripeChargesEnabled, stripePayoutsEnabled: r.stripePayoutsEnabled,
  };
}
