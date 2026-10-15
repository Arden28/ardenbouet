// lib/backup.ts — JSON export / import of site data (admin backup & restore).
import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { DEFAULT_CONTENT } from '@/lib/defaultContent';

export const BACKUP_VERSION = 2;
export const SECTIONS = ['content', 'blog', 'community', 'audience', 'crm', 'booking', 'bookings', 'commerce', 'inbox'] as const;
export type Section = (typeof SECTIONS)[number];
const CONTENT_KEYS = ['projects', 'experiences', 'journey', 'products', 'settings'] as const;
const SECRET_SETTINGS = ['r2SecretAccessKey', 'r2AccessKeyId'];

type Row = Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Delegate = any;

export async function exportData(sections: Section[], includeSecrets: boolean) {
  const out: Record<string, unknown> = { format: 'ardenbouet-backup', version: BACKUP_VERSION, exportedAt: new Date().toISOString(), sections };

  if (sections.includes('content')) {
    const row = await prisma.content.findUnique({ where: { id: 1 } });
    const data = { ...((row?.data as Record<string, unknown>) ?? DEFAULT_CONTENT) };
    const content: Record<string, unknown> = {};
    for (const k of CONTENT_KEYS) content[k] = data[k] ?? (k === 'settings' ? {} : []);
    if (!includeSecrets && content.settings && typeof content.settings === 'object') {
      content.settings = Object.fromEntries(Object.entries(content.settings as object).filter(([k]) => !SECRET_SETTINGS.includes(k)));
    }
    out.content = content;
  }
  if (sections.includes('blog')) {
    out.blog = {
      series: await prisma.series.findMany(),
      posts: await prisma.post.findMany({
        select: {
          id: true, slug: true, title: true, subtitle: true, excerpt: true, coverUrl: true, coverAlt: true, coverCaption: true, content: true, bodyMd: true,
          status: true, publishedAt: true, scheduledAt: true, tags: true, language: true, readingMinutes: true, wordCount: true, featured: true, commentsOpen: true,
          seoTitle: true, seoDescription: true, canonicalUrl: true, seriesId: true, seriesOrder: true, donationsEnabled: true, translationOfId: true, authorId: true, createdAt: true,
        },
      }),
    };
  }
  if (sections.includes('community')) {
    out.community = {
      readers: await prisma.reader.findMany(),
      writerGrants: await prisma.writerGrant.findMany(),
      comments: await prisma.comment.findMany({ orderBy: { createdAt: 'asc' } }),
      donations: await prisma.donation.findMany(),
    };
  }
  if (sections.includes('audience')) out.audience = { subscribers: await prisma.subscriber.findMany() };
  if (sections.includes('crm')) {
    out.crm = { clients: await prisma.crmClient.findMany(), projects: await prisma.crmProject.findMany(), invoices: await prisma.crmInvoice.findMany() };
  }
  if (sections.includes('booking')) {
    const cfg = await prisma.bookingConfig.findUnique({ where: { id: 1 } });
    out.booking = {
      config: cfg && { timezone: cfg.timezone, rules: cfg.rules, minNoticeMin: cfg.minNoticeMin, maxDaysAhead: cfg.maxDaysAhead, slotStepMin: cfg.slotStepMin, googleCalendarId: cfg.googleCalendarId },
      meetingTypes: await prisma.meetingType.findMany(),
    };
  }
  if (sections.includes('bookings')) out.bookings = { bookings: await prisma.booking.findMany() };
  if (sections.includes('commerce')) out.commerce = { orders: await prisma.order.findMany(), downloadTokens: await prisma.downloadToken.findMany() };
  if (sections.includes('inbox')) out.inbox = { messages: await prisma.message.findMany({ orderBy: { id: 'asc' } }) };
  return out;
}

export type ImportReport = Record<string, { create: number; update: number; skip: number; notes: string[] }>;
type Mode = 'merge' | 'replace';

const isObj = (v: unknown): v is Row => !!v && typeof v === 'object' && !Array.isArray(v);
const asArr = (v: unknown) => (Array.isArray(v) ? (v as Row[]) : []);
const date = (v: unknown) => (typeof v === 'string' && !isNaN(Date.parse(v)) ? new Date(v) : null);
const MAX_NOTES = 6;

/** Validates + (unless dryRun) applies a backup. Merge = upsert by id; replace = the backup becomes the section (site content lists only). */
export async function importData(payload: unknown, sections: Section[], mode: Mode, dryRun: boolean): Promise<ImportReport> {
  if (!isObj(payload) || payload.format !== 'ardenbouet-backup') throw new Error('This is not an ardenbouet backup file.');
  const report: ImportReport = {};
  const r = (k: string) => (report[k] ??= { create: 0, update: 0, skip: 0, notes: [] });
  const note = (rep: ImportReport[string], msg: string) => {
    if (rep.notes.length < MAX_NOTES) rep.notes.push(msg);
    else if (rep.notes.length === MAX_NOTES) rep.notes.push('…and more');
  };
  const ids = async (delegate: Delegate) => new Set<string | number>((await delegate.findMany({ select: { id: true } })).map((x: { id: string | number }) => x.id));
  const section = (key: Section) => (sections.includes(key) && isObj(payload[key]) ? (payload[key] as Row) : null);

  /**
   * Generic row-by-row upsert. `check` returns a reason to skip (e.g. a missing parent row). Writes are independent,
   * so one bad row (say a duplicate email) is reported instead of aborting the whole import.
   */
  const upsertRows = async (label: string, delegate: Delegate, rows: Row[], opts: { check?: (row: Row) => string | null; clean?: (row: Row) => Row; idType?: 'string' | 'number' } = {}) => {
    const rep = r(label);
    const existing = await ids(delegate);
    const accepted = new Set<string | number>();
    for (const raw of rows) {
      const id = raw.id;
      if (opts.idType === 'number' ? typeof id !== 'number' : typeof id !== 'string') { rep.skip++; continue; }
      const reason = opts.check?.(raw);
      if (reason) { rep.skip++; note(rep, reason); continue; }
      const { updatedAt: _u, ...row } = opts.clean ? opts.clean(raw) : raw;
      if (!dryRun) {
        try {
          const { id: _id, ...update } = row;
          await delegate.upsert({ where: { id }, create: row, update });
        } catch (e) {
          rep.skip++;
          const msg = (e as Error).message;
          const field = msg.match(/Unique constraint failed on the fields: \(`?([^`)]+)`?\)/)?.[1];
          note(rep, `${String(id).slice(0, 14)}: ${field ? `another row already has this ${field}` : msg.split('\n').filter(Boolean).pop()?.slice(0, 120)}`);
          continue;
        }
      }
      if (existing.has(id as string | number)) rep.update++; else rep.create++;
      accepted.add(id as string | number);
    }
    return accepted;
  };

  // ── Site content (JSON bundle) ────────────────────────────────────────────
  const content = section('content');
  if (content) {
    const row = await prisma.content.findUnique({ where: { id: 1 } });
    const current = { ...((row?.data as Row) ?? DEFAULT_CONTENT) };
    const next = { ...current };
    for (const key of CONTENT_KEYS) {
      const incoming = content[key];
      if (incoming === undefined) continue;
      const rep = r(`content.${key}`);
      if (key === 'settings') {
        if (!isObj(incoming)) { note(rep, 'settings must be an object, skipped'); continue; }
        next.settings = mode === 'replace' ? incoming : { ...(current.settings as object), ...incoming };
        rep.update++;
        continue;
      }
      if (!Array.isArray(incoming)) { note(rep, `${key} must be a list, skipped`); continue; }
      const existing = asArr(current[key]);
      const known = new Set(existing.map(i => i.id));
      const valid = asArr(incoming).filter(i => typeof i.id === 'string');
      rep.skip += asArr(incoming).length - valid.length;
      if (mode === 'replace') {
        next[key] = valid;
        rep.create += valid.filter(i => !known.has(i.id)).length;
        rep.update += valid.filter(i => known.has(i.id)).length;
      } else {
        const byId = new Map(existing.map(i => [i.id, i]));
        for (const i of valid) { if (byId.has(i.id)) rep.update++; else rep.create++; byId.set(i.id, i); }
        next[key] = Array.from(byId.values());
      }
    }
    if (!dryRun) await prisma.content.upsert({ where: { id: 1 }, create: { id: 1, data: next as Prisma.InputJsonValue }, update: { data: next as Prisma.InputJsonValue } });
  }

  // ── Community: readers first, since stories, comments and donations point at them ─
  const community = section('community');
  const readerIds = await ids(prisma.reader);
  if (community) {
    (await upsertRows('community.readers', prisma.reader, asArr(community.readers))).forEach(id => readerIds.add(id));
    await upsertRows('community.writerGrants', prisma.writerGrant, asArr(community.writerGrants), {
      check: g => (readerIds.has(g.readerId as string) ? null : `grant ${g.id}: reader missing`),
    });
  }

  // ── Blog ──────────────────────────────────────────────────────────────────
  const blog = section('blog');
  const postIds = await ids(prisma.post);
  if (blog) {
    const seriesIds = await ids(prisma.series);
    const rs = r('blog.series'), rp = r('blog.posts');
    for (const s of asArr(blog.series)) {
      if (typeof s.id !== 'string' || typeof s.slug !== 'string' || typeof s.title !== 'string') { rs.skip++; continue; }
      const clash = await prisma.series.findFirst({ where: { slug: s.slug, NOT: { id: s.id } }, select: { id: true } });
      if (clash) { rs.skip++; note(rs, `series “${s.title}”: slug already used`); continue; }
      if (seriesIds.has(s.id)) rs.update++; else rs.create++;
      seriesIds.add(s.id);
      const data = { slug: s.slug, title: s.title, description: String(s.description ?? ''), coverUrl: (s.coverUrl as string) ?? null };
      if (!dryRun) await prisma.series.upsert({ where: { id: s.id }, create: { id: s.id, ...data }, update: data });
    }
    for (const p of asArr(blog.posts)) {
      if (typeof p.id !== 'string' || typeof p.slug !== 'string') { rp.skip++; continue; }
      const clash = await prisma.post.findFirst({ where: { slug: p.slug, NOT: { id: p.id } }, select: { id: true } });
      if (clash) { rp.skip++; note(rp, `story “${p.title}”: slug /${p.slug} already used`); continue; }
      if (postIds.has(p.id)) rp.update++; else rp.create++;
      postIds.add(p.id);
      const authorOk = typeof p.authorId === 'string' && readerIds.has(p.authorId);
      if (typeof p.authorId === 'string' && !authorOk) note(rp, `story “${p.title}”: author not found (include “Readers & community”), imported as yours`);
      const data = {
        slug: p.slug, title: String(p.title ?? ''), subtitle: String(p.subtitle ?? ''), excerpt: String(p.excerpt ?? ''),
        coverUrl: (p.coverUrl as string) ?? null, coverAlt: (p.coverAlt as string) ?? null, coverCaption: (p.coverCaption as string) ?? null,
        content: (p.content ?? undefined) as Prisma.InputJsonValue | undefined, bodyMd: (p.bodyMd as string) ?? null,
        status: (['DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'].includes(String(p.status)) ? p.status : 'DRAFT') as 'DRAFT',
        publishedAt: date(p.publishedAt), scheduledAt: date(p.scheduledAt),
        tags: Array.isArray(p.tags) ? p.tags.map(String) : [], language: String(p.language ?? 'en'),
        readingMinutes: Number(p.readingMinutes) || 1, wordCount: Number(p.wordCount) || 0, featured: !!p.featured, commentsOpen: p.commentsOpen !== false,
        seoTitle: (p.seoTitle as string) ?? null, seoDescription: (p.seoDescription as string) ?? null, canonicalUrl: (p.canonicalUrl as string) ?? null,
        seriesId: typeof p.seriesId === 'string' && seriesIds.has(p.seriesId) ? p.seriesId : null,
        seriesOrder: Number(p.seriesOrder) || 0, donationsEnabled: !!p.donationsEnabled,
        authorId: authorOk ? (p.authorId as string) : null,
      };
      if (!dryRun) await prisma.post.upsert({ where: { id: p.id }, create: { id: p.id, ...data }, update: data });
    }
    if (mode === 'replace') note(rp, 'Stories are never deleted by an import (they hold reader responses); they are only added and updated.');
  }

  // ── Community (cont.): responses and donations need stories ───────────────
  if (community) {
    const commentIds = await ids(prisma.comment);
    const comments = [...asArr(community.comments)].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    await upsertRows('community.comments', prisma.comment, comments, {
      check: c => {
        if (!postIds.has(c.postId as string)) return `response ${c.id}: story missing`;
        if (c.readerId && !readerIds.has(c.readerId as string)) return `response ${c.id}: reader missing`;
        if (c.parentId && !commentIds.has(c.parentId as string)) return `response ${c.id}: parent missing`;
        commentIds.add(c.id as string);
        return null;
      },
    });
    await upsertRows('community.donations', prisma.donation, asArr(community.donations), {
      clean: d => ({
        ...d,
        postId: d.postId && postIds.has(d.postId as string) ? d.postId : null,
        recipientId: d.recipientId && readerIds.has(d.recipientId as string) ? d.recipientId : null,
        donorId: d.donorId && readerIds.has(d.donorId as string) ? d.donorId : null,
      }),
    });
  }

  // ── Audience ──────────────────────────────────────────────────────────────
  const audience = section('audience');
  if (audience) await upsertRows('audience.subscribers', prisma.subscriber, asArr(audience.subscribers));

  // ── CRM ───────────────────────────────────────────────────────────────────
  const crm = section('crm');
  if (crm) {
    const dates = (row: Row) => { const o = { ...row }; for (const k of ['startDate', 'endDate', 'issuedAt', 'dueAt', 'paidAt']) if (k in o) o[k] = date(o[k]); return o; };
    const clientIds = await ids(prisma.crmClient);
    (await upsertRows('crm.clients', prisma.crmClient, asArr(crm.clients), { clean: dates })).forEach(id => clientIds.add(id));
    const projectIds = await ids(prisma.crmProject);
    (await upsertRows('crm.projects', prisma.crmProject, asArr(crm.projects), {
      clean: dates, check: p => (clientIds.has(p.clientId as string) ? null : `project ${p.id}: client missing`),
    })).forEach(id => projectIds.add(id));
    await upsertRows('crm.invoices', prisma.crmInvoice, asArr(crm.invoices), {
      clean: i => ({ ...dates(i), projectId: i.projectId && projectIds.has(i.projectId as string) ? i.projectId : null }),
      check: i => (clientIds.has(i.clientId as string) ? null : `invoice ${i.id}: client missing`),
    });
  }

  // ── Booking setup + bookings ──────────────────────────────────────────────
  const booking = section('booking');
  const typeIds = await ids(prisma.meetingType);
  if (booking) {
    const rc = r('booking.config');
    const cfg = booking.config;
    if (isObj(cfg)) {
      rc.update++;
      const data = {
        timezone: String(cfg.timezone ?? 'Africa/Nairobi'), rules: (cfg.rules ?? []) as Prisma.InputJsonValue,
        minNoticeMin: Number(cfg.minNoticeMin) || 0, maxDaysAhead: Number(cfg.maxDaysAhead) || 30, slotStepMin: Number(cfg.slotStepMin) || 30,
        googleCalendarId: String(cfg.googleCalendarId ?? 'primary'),
      };
      if (!dryRun) await prisma.bookingConfig.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
    }
    (await upsertRows('booking.meetingTypes', prisma.meetingType, asArr(booking.meetingTypes))).forEach(id => typeIds.add(id));
  }
  const bookings = section('bookings');
  if (bookings) {
    await upsertRows('bookings.bookings', prisma.booking, asArr(bookings.bookings), {
      check: b => (typeIds.has(b.meetingTypeId as string) ? null : `booking ${b.id}: meeting type missing (include “Booking setup”)`),
    });
  }

  // ── Commerce ──────────────────────────────────────────────────────────────
  const commerce = section('commerce');
  if (commerce) {
    await upsertRows('commerce.orders', prisma.order, asArr(commerce.orders));
    await upsertRows('commerce.downloadTokens', prisma.downloadToken, asArr(commerce.downloadTokens));
  }

  // ── Inbox ─────────────────────────────────────────────────────────────────
  const inbox = section('inbox');
  if (inbox) {
    await upsertRows('inbox.messages', prisma.message, asArr(inbox.messages), { idType: 'number' });
    // Explicit ids don't advance the serial sequence; move it past the highest id so new messages don't collide.
    if (!dryRun) await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Message"', 'id'), GREATEST((SELECT COALESCE(MAX(id), 0) FROM "Message"), 1))`);
  }

  return report;
}

/** Row counts per section, shown next to each checkbox on the export screen. */
export async function dataCounts(): Promise<Record<Section, number>> {
  const row = await prisma.content.findUnique({ where: { id: 1 } });
  const data = (row?.data as Row) ?? {};
  const contentCount = (['projects', 'experiences', 'journey', 'products'] as const).reduce((s, k) => s + asArr(data[k]).length, 0);
  const [posts, series, readers, comments, subscribers, clients, crmProjects, invoices, types, bookings, orders, messages] = await Promise.all([
    prisma.post.count(), prisma.series.count(), prisma.reader.count(), prisma.comment.count(), prisma.subscriber.count(),
    prisma.crmClient.count(), prisma.crmProject.count(), prisma.crmInvoice.count(), prisma.meetingType.count(),
    prisma.booking.count(), prisma.order.count(), prisma.message.count(),
  ]);
  return {
    content: contentCount, blog: posts + series, community: readers + comments, audience: subscribers,
    crm: clients + crmProjects + invoices, booking: types, bookings, commerce: orders, inbox: messages,
  };
}
