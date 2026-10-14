// lib/blog/admin.ts — server helpers for the admin blog editor.
import 'server-only';
import type { Post, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { docStats, firstParagraph, isDoc, slugify, type PMNode } from './doc';

/** Static routes under /blog that a post slug must not shadow. */
export const RESERVED_SLUGS = new Set(['search', 'subscribe', 'reading-list', 'tag', 'series', 'rss.xml', 'new']);

export type EditorPost = Omit<Post, 'createdAt' | 'updatedAt' | 'publishedAt' | 'scheduledAt' | 'newsletterSentAt'> & {
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  scheduledAt: string | null;
  newsletterSentAt: string | null;
};

export function toEditorPost(p: Post): EditorPost {
  return {
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    publishedAt: p.publishedAt?.toISOString() ?? null,
    scheduledAt: p.scheduledAt?.toISOString() ?? null,
    newsletterSentAt: p.newsletterSentAt?.toISOString() ?? null,
  };
}

export async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let root = slugify(base) || 'untitled';
  if (RESERVED_SLUGS.has(root)) root = `${root}-story`;
  for (let i = 0; i < 50; i++) {
    const candidate = i ? `${root}-${i + 1}` : root;
    const hit = await prisma.post.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!hit || hit.id === excludeId) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}

const s = (v: unknown, max = 2000) => (typeof v === 'string' ? v.slice(0, max) : undefined);
const optS = (v: unknown, max = 2000) => (v === null ? null : typeof v === 'string' ? (v.trim() ? v.slice(0, max) : null) : undefined);
const date = (v: unknown) => (v === null ? null : typeof v === 'string' && !isNaN(Date.parse(v)) ? new Date(v) : undefined);

export class EditorError extends Error {}

/**
 * Validates an editor PATCH and returns the Prisma update. Derived fields (word count,
 * reading time, publish timestamps) are computed here, never trusted from the client.
 */
export async function buildPostUpdate(current: Post, body: Record<string, unknown>): Promise<Prisma.PostUpdateInput> {
  const data: Prisma.PostUpdateInput = {};

  if (body.title !== undefined) data.title = s(body.title, 300) ?? '';
  if (body.subtitle !== undefined) data.subtitle = s(body.subtitle, 500) ?? '';
  if (body.excerpt !== undefined) data.excerpt = s(body.excerpt, 600) ?? '';
  if (body.coverUrl !== undefined) data.coverUrl = optS(body.coverUrl);
  if (body.coverAlt !== undefined) data.coverAlt = optS(body.coverAlt, 300);
  if (body.coverCaption !== undefined) data.coverCaption = optS(body.coverCaption, 300);
  if (body.seoTitle !== undefined) data.seoTitle = optS(body.seoTitle, 200);
  if (body.seoDescription !== undefined) data.seoDescription = optS(body.seoDescription, 400);
  if (body.canonicalUrl !== undefined) {
    const c = optS(body.canonicalUrl, 500);
    if (c && !/^https?:\/\//i.test(c)) throw new EditorError('Canonical URL must start with http(s)://');
    data.canonicalUrl = c;
  }
  if (body.language !== undefined) data.language = ['en', 'fr', 'both'].includes(String(body.language)) ? String(body.language) : 'en';
  if (body.featured !== undefined) data.featured = !!body.featured;
  if (body.commentsOpen !== undefined) data.commentsOpen = !!body.commentsOpen;
  if (body.donationsEnabled !== undefined) data.donationsEnabled = !!body.donationsEnabled;
  if (body.tags !== undefined) {
    const tags = Array.isArray(body.tags) ? body.tags : [];
    data.tags = Array.from(new Set(tags.map(t => String(t).trim().toLowerCase().slice(0, 40)).filter(Boolean))).slice(0, 5);
  }
  if (body.seriesId !== undefined) {
    const id = optS(body.seriesId, 64);
    data.series = id ? { connect: { id } } : { disconnect: true };
  }
  if (body.seriesOrder !== undefined) data.seriesOrder = Math.max(0, Math.floor(Number(body.seriesOrder) || 0));

  // Unpublished stories keep deriving their URL from the title until the author sets one.
  const placeholderSlug = /^draft-[a-z0-9]+$/.test(current.slug) || current.slug === 'untitled';
  const nextTitle = typeof data.title === 'string' ? data.title : current.title;
  if (body.slug === undefined && placeholderSlug && current.status === 'DRAFT' && nextTitle.trim()) {
    data.slug = await uniqueSlug(nextTitle, current.id);
  }

  if (body.slug !== undefined) {
    const wanted = slugify(String(body.slug ?? ''));
    if (!wanted) throw new EditorError('Slug cannot be empty');
    if (RESERVED_SLUGS.has(wanted)) throw new EditorError(`"${wanted}" is reserved — pick another slug`);
    const clash = await prisma.post.findUnique({ where: { slug: wanted }, select: { id: true } });
    if (clash && clash.id !== current.id) throw new EditorError('Another story already uses this slug');
    data.slug = wanted;
  }

  if (body.content !== undefined) {
    if (body.content !== null && !isDoc(body.content)) throw new EditorError('Invalid document');
    data.content = (body.content ?? undefined) as Prisma.InputJsonValue | undefined;
    if (isDoc(body.content)) {
      const stats = docStats(body.content as PMNode);
      data.wordCount = stats.wordCount;
      data.readingMinutes = stats.readingMinutes;
      // Keep an excerpt even if the author never wrote one.
      const excerpt = typeof data.excerpt === 'string' ? data.excerpt : current.excerpt;
      if (!excerpt) data.excerpt = firstParagraph(body.content as PMNode, 240);
    }
  }

  if (body.status !== undefined) {
    const status = String(body.status);
    if (!['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'].includes(status)) throw new EditorError('Invalid status');
    data.status = status as Post['status'];
    if (status === 'PUBLISHED') {
      const pub = date(body.publishedAt);
      data.publishedAt = pub ?? current.publishedAt ?? new Date();
      data.scheduledAt = null;
    } else if (status === 'SCHEDULED') {
      const at = date(body.scheduledAt);
      if (!at || at.getTime() < Date.now() - 60_000) throw new EditorError('Pick a future date to schedule');
      data.scheduledAt = at;
      data.publishedAt = at;
    }
  } else if (body.publishedAt !== undefined) {
    const pub = date(body.publishedAt);
    if (pub !== undefined) data.publishedAt = pub;
  }

  return data;
}

/** Snapshot the post into PostRevision, keeping the newest 50 per post. */
export async function snapshot(postId: string, label: string) {
  const p = await prisma.post.findUnique({ where: { id: postId } });
  if (!p) return;
  await prisma.postRevision.create({
    data: {
      postId,
      label,
      title: p.title,
      subtitle: p.subtitle,
      content: (p.content ?? undefined) as Prisma.InputJsonValue | undefined,
      bodyMd: p.bodyMd,
    },
  });
  const old = await prisma.postRevision.findMany({
    where: { postId },
    orderBy: { createdAt: 'desc' },
    skip: 50,
    select: { id: true },
  });
  if (old.length) await prisma.postRevision.deleteMany({ where: { id: { in: old.map(o => o.id) } } });
}
