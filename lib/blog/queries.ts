// lib/blog/queries.ts — server-only data access for the public blog.
import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { ContentBundle } from '@/app/admin/types';
import { collectContentRefs, firstImage, type ContentRef, type PMNode, isDoc } from './doc';

export type PostCard = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  coverUrl: string | null;
  publishedAt: string | null;
  readingMinutes: number;
  tags: string[];
  featured: boolean;
  claps: number;
  responses: number;
  seriesTitle: string | null;
  seriesSlug: string | null;
  /** null = the site owner */
  author: { name: string; handle: string | null; image: string | null } | null;
};

/** Published, or scheduled with a publish time in the past (no cron needed). */
export function visibleWhere(): Prisma.PostWhereInput {
  const now = new Date();
  return {
    OR: [
      { status: 'PUBLISHED', OR: [{ publishedAt: null }, { publishedAt: { lte: now } }] },
      { status: 'SCHEDULED', scheduledAt: { lte: now } },
    ],
  };
}

const cardSelect = {
  id: true, slug: true, title: true, subtitle: true, excerpt: true, coverUrl: true,
  publishedAt: true, scheduledAt: true, status: true, readingMinutes: true, tags: true,
  featured: true, content: true,
  series: { select: { title: true, slug: true } },
  author: { select: { name: true, handle: true, image: true } },
  _count: { select: { comments: { where: { status: 'VISIBLE' as const } } } },
} satisfies Prisma.PostSelect;

type CardRow = Prisma.PostGetPayload<{ select: typeof cardSelect }>;

export function effectiveDate(p: { status: string; publishedAt: Date | null; scheduledAt: Date | null }) {
  return p.status === 'SCHEDULED' ? p.scheduledAt : p.publishedAt;
}

async function clapTotals(postIds: string[]): Promise<Map<string, number>> {
  if (!postIds.length) return new Map();
  const rows = await prisma.clap.groupBy({
    by: ['postId'],
    where: { postId: { in: postIds } },
    _sum: { count: true },
  });
  return new Map(rows.map(r => [r.postId, r._sum.count ?? 0]));
}

async function toCards(rows: CardRow[]): Promise<PostCard[]> {
  const claps = await clapTotals(rows.map(r => r.id));
  return rows.map(r => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle,
    excerpt: r.excerpt || r.subtitle,
    coverUrl: r.coverUrl || (isDoc(r.content) ? firstImage(r.content as PMNode) ?? null : null),
    publishedAt: effectiveDate(r)?.toISOString() ?? null,
    readingMinutes: r.readingMinutes,
    tags: r.tags,
    featured: r.featured,
    claps: claps.get(r.id) ?? 0,
    responses: r._count.comments,
    seriesTitle: r.series?.title ?? null,
    seriesSlug: r.series?.slug ?? null,
    author: r.author ?? null,
  }));
}

export async function listPosts(opts: {
  tag?: string;
  q?: string;
  sort?: 'latest' | 'popular';
  take?: number;
  skip?: number;
  excludeIds?: string[];
  authorId?: string;
} = {}): Promise<PostCard[]> {
  const { tag, q, sort = 'latest', take = 20, skip = 0, excludeIds, authorId } = opts;
  const and: Prisma.PostWhereInput[] = [visibleWhere()];
  if (authorId) and.push({ authorId });
  if (tag) and.push({ tags: { has: tag } });
  if (excludeIds?.length) and.push({ id: { notIn: excludeIds } });
  if (q?.trim()) {
    const term = q.trim();
    and.push({
      OR: [
        { title: { contains: term, mode: 'insensitive' } },
        { subtitle: { contains: term, mode: 'insensitive' } },
        { excerpt: { contains: term, mode: 'insensitive' } },
        { tags: { has: term.toLowerCase() } },
      ],
    });
  }

  if (sort === 'popular') {
    // Popularity = claps + 3×responses + views/20, computed over the latest 200 posts.
    const rows = await prisma.post.findMany({
      where: { AND: and },
      select: { ...cardSelect, views: true },
      orderBy: [{ publishedAt: 'desc' }],
      take: 200,
    });
    const cards = await toCards(rows);
    const views = new Map(rows.map(r => [r.id, r.views]));
    return cards
      .map(c => ({ c, score: c.claps + c.responses * 3 + (views.get(c.id) ?? 0) / 20 }))
      .sort((a, b) => b.score - a.score)
      .slice(skip, skip + take)
      .map(x => x.c);
  }

  const rows = await prisma.post.findMany({
    where: { AND: and },
    select: cardSelect,
    orderBy: [{ publishedAt: 'desc' }, { scheduledAt: 'desc' }, { createdAt: 'desc' }],
    take,
    skip,
  });
  return toCards(rows);
}

export async function getFeatured(take = 3): Promise<PostCard[]> {
  const rows = await prisma.post.findMany({
    where: { AND: [visibleWhere(), { featured: true }] },
    select: cardSelect,
    orderBy: { publishedAt: 'desc' },
    take,
  });
  return toCards(rows);
}

export async function getTopTags(limit = 12): Promise<{ tag: string; count: number }[]> {
  const rows = await prisma.post.findMany({ where: visibleWhere(), select: { tags: true } });
  const counts = new Map<string, number>();
  for (const r of rows) for (const t of r.tags) if (t) counts.set(t, (counts.get(t) ?? 0) + 1);
  return Array.from(counts, ([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
}

export async function countVisible(tag?: string): Promise<number> {
  return prisma.post.count({ where: { AND: [visibleWhere(), ...(tag ? [{ tags: { has: tag } }] : [])] } });
}

export async function getPostBySlug(slug: string, { includeDrafts = false } = {}) {
  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true, handle: true, image: true, bio: true, stripeChargesEnabled: true } },
      series: {
        include: {
          posts: {
            where: visibleWhere(),
            select: { id: true, slug: true, title: true, seriesOrder: true, readingMinutes: true },
            orderBy: [{ seriesOrder: 'asc' }, { publishedAt: 'asc' }],
          },
        },
      },
    },
  });
  if (!post) return null;
  if (!includeDrafts) {
    const visible = await prisma.post.count({ where: { AND: [{ id: post.id }, visibleWhere()] } });
    if (!visible) return null;
  }
  return post;
}

export async function getRelated(postId: string, tags: string[], take = 4): Promise<PostCard[]> {
  const related = tags.length
    ? await prisma.post.findMany({
        where: { AND: [visibleWhere(), { id: { not: postId } }, { tags: { hasSome: tags } }] },
        select: cardSelect,
        orderBy: { publishedAt: 'desc' },
        take,
      })
    : [];
  if (related.length < take) {
    const fill = await prisma.post.findMany({
      where: { AND: [visibleWhere(), { id: { notIn: [postId, ...related.map(r => r.id)] } }] },
      select: cardSelect,
      orderBy: { publishedAt: 'desc' },
      take: take - related.length,
    });
    related.push(...fill);
  }
  return toCards(related);
}

export async function getPostCardsByIds(ids: string[]): Promise<PostCard[]> {
  if (!ids.length) return [];
  const rows = await prisma.post.findMany({ where: { AND: [visibleWhere(), { id: { in: ids } }] }, select: cardSelect });
  const cards = await toCards(rows);
  const order = new Map(ids.map((id, i) => [id, i]));
  return cards.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

const seriesPostOrder = [{ seriesOrder: 'asc' as const }, { publishedAt: 'asc' as const }];

export type SeriesSummary = {
  id: string; slug: string; title: string; description: string; coverUrl: string | null;
  count: number; minutes: number; updatedAt: string; firstSlug: string | null;
};

/** Series that have at least one visible story, most recently active first. */
export async function listSeries(): Promise<SeriesSummary[]> {
  const rows = await prisma.series.findMany({
    include: { posts: { where: visibleWhere(), select: { slug: true, coverUrl: true, readingMinutes: true, publishedAt: true, scheduledAt: true, status: true }, orderBy: seriesPostOrder } },
  });
  return rows
    .filter(s => s.posts.length > 0)
    .map(s => {
      const latest = s.posts.reduce<Date>((d, p) => { const e = effectiveDate(p); return e && e > d ? e : d; }, s.updatedAt);
      return {
        id: s.id, slug: s.slug, title: s.title, description: s.description,
        coverUrl: s.coverUrl || s.posts.find(p => p.coverUrl)?.coverUrl || null,
        count: s.posts.length, minutes: s.posts.reduce((m, p) => m + p.readingMinutes, 0),
        updatedAt: latest.toISOString(), firstSlug: s.posts[0]?.slug ?? null,
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** One series with its visible stories as cards, in reading order. */
export async function getSeries(slug: string) {
  const series = await prisma.series.findUnique({
    where: { slug },
    include: { posts: { where: visibleWhere(), select: { id: true }, orderBy: seriesPostOrder } },
  });
  if (!series) return null;
  const posts = await getPostCardsByIds(series.posts.map(p => p.id));
  const minutes = posts.reduce((m, p) => m + p.readingMinutes, 0);
  const updatedAt = posts.reduce((d, p) => (p.publishedAt && p.publishedAt > d ? p.publishedAt : d), series.updatedAt.toISOString());
  return { ...series, posts, minutes, updatedAt, coverUrl: series.coverUrl || posts.find(p => p.coverUrl)?.coverUrl || null };
}

export async function getContentBundle(): Promise<Partial<ContentBundle>> {
  try {
    const row = await prisma.content.findUnique({ where: { id: 1 } });
    return (row?.data as Partial<ContentBundle>) ?? {};
  } catch {
    return {};
  }
}

// ─── Embedded site content (contentCard nodes) ────────────────────────────────

export type EmbeddedItem =
  | { kind: 'product'; id: string; title: string; subtitle: string; image?: string; href: string; price: string; category: string }
  | { kind: 'project'; id: string; title: string; subtitle: string; image?: string; href: string; tags: string[]; metric?: string }
  | { kind: 'experience'; id: string; title: string; subtitle: string; image?: string; period: string; bullets: string[] }
  | { kind: 'post'; id: string; title: string; subtitle: string; image?: string; href: string; readingMinutes: number };

export type EmbedMap = Record<string, EmbeddedItem>; // key: `${kind}:${id}`

export async function resolveEmbeds(refs: ContentRef[]): Promise<EmbedMap> {
  const out: EmbedMap = {};
  if (!refs.length) return out;
  const bundle = await getContentBundle();

  for (const p of bundle.products ?? []) {
    if (p.status !== 'published') continue;
    out[`product:${p.id}`] = {
      kind: 'product', id: p.id, title: p.title, subtitle: p.tagline || p.description,
      image: p.cover || p.media?.find(m => m.kind === 'image')?.url,
      href: `/shop/${p.slug}`, price: p.priceLabel || (p.price ? `${p.price} ${p.currency}` : ''), category: p.category,
    };
  }
  for (const p of bundle.projects ?? []) {
    out[`project:${p.id}`] = {
      kind: 'project', id: p.id, title: p.title, subtitle: p.description,
      image: p.caseFile?.images?.find(i => !/\.(mp4|webm|ogg|mov)(\?|$)/i.test(i.src))?.src || p.logoUrl,
      href: `/projects/${p.id}`, tags: p.tech ?? [], metric: p.metric,
    };
  }
  for (const e of bundle.experiences ?? []) {
    out[`experience:${e.id}`] = {
      kind: 'experience', id: e.id, title: e.title, subtitle: e.logline || e.job,
      image: e.poster, period: e.fromTo, bullets: (e.outcomes?.length ? e.outcomes : e.bullets ?? []).slice(0, 3),
    };
  }

  const postIds = refs.filter(r => r.kind === 'post').map(r => r.id);
  for (const c of await getPostCardsByIds(postIds)) {
    out[`post:${c.id}`] = {
      kind: 'post', id: c.id, title: c.title, subtitle: c.subtitle || c.excerpt,
      image: c.coverUrl ?? undefined, href: `/blog/${c.slug}`, readingMinutes: c.readingMinutes,
    };
  }
  return out;
}

export async function resolveEmbedsForDoc(doc: unknown): Promise<EmbedMap> {
  return isDoc(doc) ? resolveEmbeds(collectContentRefs(doc)) : {};
}
