// lib/accounts.ts — reader accounts, writer permissions and handles (server only).
import 'server-only';
import type { Post, Reader, WriterGrant } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/blog/doc';

export async function uniqueHandle(base: string, excludeId?: string): Promise<string> {
  const root = (slugify(base).replace(/-/g, '') || 'reader').slice(0, 20);
  for (let i = 0; i < 50; i++) {
    const h = i ? `${root}${i + 1}` : root;
    const hit = await prisma.reader.findUnique({ where: { handle: h }, select: { id: true } });
    if (!hit || hit.id === excludeId) return h;
  }
  return `${root}${Date.now().toString(36)}`;
}

export const HANDLE_RE = /^[a-z0-9_]{3,30}$/;

/** The reader's grant if it is currently usable (not revoked, not expired). */
export function activeGrant(grant: WriterGrant | null | undefined): WriterGrant | null {
  if (!grant || grant.revokedAt) return null;
  if (grant.expiresAt && grant.expiresAt.getTime() < Date.now()) return null;
  return grant;
}

export type WriterStatus = {
  isWriter: boolean;
  scope: WriterGrant['scope'] | null;
  canCreate: boolean;
  remaining: number | null; // LIMITED only
  canPublish: boolean;
  expiresAt: string | null;
  postIds: string[];
};

export async function writerStatus(readerId: string): Promise<WriterStatus> {
  const grant = activeGrant(await prisma.writerGrant.findUnique({ where: { readerId } }));
  if (!grant) return { isWriter: false, scope: null, canCreate: false, remaining: null, canPublish: false, expiresAt: null, postIds: [] };
  let remaining: number | null = null;
  if (grant.scope === 'LIMITED') {
    const used = await prisma.post.count({ where: { authorId: readerId } });
    remaining = Math.max(0, (grant.maxPosts ?? 0) - used);
  }
  return {
    isWriter: true,
    scope: grant.scope,
    canCreate: grant.scope === 'UNLIMITED' || (grant.scope === 'LIMITED' && (remaining ?? 0) > 0),
    remaining,
    canPublish: grant.canPublish,
    expiresAt: grant.expiresAt?.toISOString() ?? null,
    postIds: grant.postIds,
  };
}

/** Can this reader open/edit this post in the writer editor? */
export function canEditPost(reader: Pick<Reader, 'id'>, grant: WriterGrant | null, post: Pick<Post, 'id' | 'authorId'>): boolean {
  const g = activeGrant(grant);
  if (!g) return false;
  if (g.scope === 'SPECIFIC') return g.postIds.includes(post.id);
  return post.authorId === reader.id;
}

/** Ids of every post the writer may edit. */
export async function editablePostIds(reader: Pick<Reader, 'id'>, grant: WriterGrant | null): Promise<string[]> {
  const g = activeGrant(grant);
  if (!g) return [];
  if (g.scope === 'SPECIFIC') return g.postIds;
  return (await prisma.post.findMany({ where: { authorId: reader.id }, select: { id: true } })).map(p => p.id);
}

export type GrantInput = {
  scope: WriterGrant['scope'];
  maxPosts?: number | null;
  postIds?: string[];
  canPublish?: boolean;
  expiresAt?: string | null;
  note?: string;
};

export function parseGrantInput(body: Record<string, unknown>): GrantInput {
  const scope = ['UNLIMITED', 'LIMITED', 'SPECIFIC'].includes(String(body.scope)) ? (String(body.scope) as GrantInput['scope']) : 'UNLIMITED';
  const maxPosts = scope === 'LIMITED' ? Math.max(1, Math.min(1000, Math.floor(Number(body.maxPosts) || 1))) : null;
  const postIds = scope === 'SPECIFIC' && Array.isArray(body.postIds) ? body.postIds.map(String).slice(0, 200) : [];
  const expiresAt = typeof body.expiresAt === 'string' && !isNaN(Date.parse(body.expiresAt)) ? new Date(body.expiresAt).toISOString() : null;
  return { scope, maxPosts, postIds, canPublish: body.canPublish !== false, expiresAt, note: typeof body.note === 'string' ? body.note.slice(0, 500) : '' };
}

/** Create or replace a reader's grant (un-revokes it). */
export async function setGrant(readerId: string, g: GrantInput) {
  const data = {
    scope: g.scope,
    maxPosts: g.maxPosts ?? null,
    postIds: g.postIds ?? [],
    canPublish: g.canPublish ?? true,
    expiresAt: g.expiresAt ? new Date(g.expiresAt) : null,
    note: g.note ?? '',
    revokedAt: null,
  };
  return prisma.writerGrant.upsert({ where: { readerId }, create: { readerId, ...data }, update: data });
}

export function describeGrant(g: Pick<WriterGrant, 'scope' | 'maxPosts' | 'postIds' | 'canPublish' | 'expiresAt'>): string {
  const what = g.scope === 'UNLIMITED' ? 'Unlimited stories'
    : g.scope === 'LIMITED' ? `Up to ${g.maxPosts} ${g.maxPosts === 1 ? 'story' : 'stories'}`
    : `${g.postIds.length} assigned ${g.postIds.length === 1 ? 'story' : 'stories'}`;
  return [what, g.canPublish ? 'publishes directly' : 'needs review', g.expiresAt ? `until ${g.expiresAt.toLocaleDateString()}` : null].filter(Boolean).join(' · ');
}
