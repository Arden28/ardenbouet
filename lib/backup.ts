// lib/backup.ts — JSON export / import of site data (admin backup & restore).
import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { DEFAULT_CONTENT } from '@/lib/defaultContent';

export const BACKUP_VERSION = 1;
export const SECTIONS = ['content', 'blog', 'crm', 'booking'] as const;
export type Section = (typeof SECTIONS)[number];
const CONTENT_KEYS = ['projects', 'experiences', 'journey', 'products', 'settings'] as const;
const SECRET_SETTINGS = ['r2SecretAccessKey', 'r2AccessKeyId'];

export async function exportData(sections: Section[], includeSecrets: boolean) {
  const out: Record<string, unknown> = { format: 'ardenbouet-backup', version: BACKUP_VERSION, exportedAt: new Date().toISOString() };

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
          seoTitle: true, seoDescription: true, canonicalUrl: true, seriesId: true, seriesOrder: true, donationsEnabled: true, translationOfId: true, createdAt: true,
        },
      }),
    };
  }
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
  return out;
}

export type ImportReport = Record<string, { create: number; update: number; skip: number; notes: string[] }>;
type Mode = 'merge' | 'replace';

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const asArr = (v: unknown) => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);
const date = (v: unknown) => (typeof v === 'string' && !isNaN(Date.parse(v)) ? new Date(v) : null);

/** Validates + (unless dryRun) applies a backup. Merge = upsert by id; replace = the backup becomes the section. */
export async function importData(payload: unknown, sections: Section[], mode: Mode, dryRun: boolean): Promise<ImportReport> {
  if (!isObj(payload) || payload.format !== 'ardenbouet-backup') throw new Error('This is not an ardenbouet backup file.');
  const report: ImportReport = {};
  const r = (k: string) => (report[k] ??= { create: 0, update: 0, skip: 0, notes: [] });

  // ── Site content (JSON bundle) ────────────────────────────────────────────
  if (sections.includes('content') && isObj(payload.content)) {
    const row = await prisma.content.findUnique({ where: { id: 1 } });
    const current = { ...((row?.data as Record<string, unknown>) ?? DEFAULT_CONTENT) };
    const next = { ...current };
    for (const key of CONTENT_KEYS) {
      const incoming = payload.content[key];
      if (incoming === undefined) continue;
      const rep = r(`content.${key}`);
      if (key === 'settings') {
        if (!isObj(incoming)) { rep.notes.push('settings must be an object, skipped'); continue; }
        next.settings = mode === 'replace' ? incoming : { ...(current.settings as object), ...incoming };
        rep.update++;
        continue;
      }
      if (!Array.isArray(incoming)) { rep.notes.push(`${key} must be a list, skipped`); continue; }
      const existing = asArr(current[key]);
      const ids = new Set(existing.map(i => i.id));
      const valid = asArr(incoming).filter(i => typeof i.id === 'string');
      rep.skip += asArr(incoming).length - valid.length;
      if (mode === 'replace') {
        next[key] = valid;
        rep.create += valid.filter(i => !ids.has(i.id)).length;
        rep.update += valid.filter(i => ids.has(i.id)).length;
      } else {
        const byId = new Map(existing.map(i => [i.id, i]));
        for (const i of valid) { if (byId.has(i.id)) rep.update++; else rep.create++; byId.set(i.id, i); }
        next[key] = Array.from(byId.values());
      }
    }
    if (!dryRun) await prisma.content.upsert({ where: { id: 1 }, create: { id: 1, data: next as Prisma.InputJsonValue }, update: { data: next as Prisma.InputJsonValue } });
  }

  // ── Blog ──────────────────────────────────────────────────────────────────
  if (sections.includes('blog') && isObj(payload.blog)) {
    const series = asArr(payload.blog.series);
    const posts = asArr(payload.blog.posts);
    const rs = r('blog.series'), rp = r('blog.posts');
    const ops: Prisma.PrismaPromise<unknown>[] = [];
    for (const s of series) {
      if (typeof s.id !== 'string' || typeof s.slug !== 'string' || typeof s.title !== 'string') { rs.skip++; continue; }
      const exists = await prisma.series.findUnique({ where: { id: s.id }, select: { id: true } });
      const clash = await prisma.series.findFirst({ where: { slug: s.slug, NOT: { id: s.id } }, select: { id: true } });
      if (clash) { rs.skip++; rs.notes.push(`series “${s.title}”: slug already used`); continue; }
      exists ? rs.update++ : rs.create++;
      const data = { slug: s.slug, title: s.title, description: String(s.description ?? ''), coverUrl: (s.coverUrl as string) ?? null };
      ops.push(prisma.series.upsert({ where: { id: s.id }, create: { id: s.id, ...data }, update: data }));
    }
    for (const p of posts) {
      if (typeof p.id !== 'string' || typeof p.slug !== 'string') { rp.skip++; continue; }
      const exists = await prisma.post.findUnique({ where: { id: p.id }, select: { id: true } });
      const clash = await prisma.post.findFirst({ where: { slug: p.slug, NOT: { id: p.id } }, select: { id: true } });
      if (clash) { rp.skip++; rp.notes.push(`story “${p.title}”: slug /${p.slug} already used`); continue; }
      exists ? rp.update++ : rp.create++;
      const data = {
        slug: p.slug, title: String(p.title ?? ''), subtitle: String(p.subtitle ?? ''), excerpt: String(p.excerpt ?? ''),
        coverUrl: (p.coverUrl as string) ?? null, coverAlt: (p.coverAlt as string) ?? null, coverCaption: (p.coverCaption as string) ?? null,
        content: (p.content ?? undefined) as Prisma.InputJsonValue | undefined, bodyMd: (p.bodyMd as string) ?? null,
        status: (['DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED'].includes(String(p.status)) ? p.status : 'DRAFT') as 'DRAFT',
        publishedAt: date(p.publishedAt), scheduledAt: date(p.scheduledAt),
        tags: Array.isArray(p.tags) ? p.tags.map(String) : [], language: String(p.language ?? 'en'),
        readingMinutes: Number(p.readingMinutes) || 1, wordCount: Number(p.wordCount) || 0, featured: !!p.featured, commentsOpen: p.commentsOpen !== false,
        seoTitle: (p.seoTitle as string) ?? null, seoDescription: (p.seoDescription as string) ?? null, canonicalUrl: (p.canonicalUrl as string) ?? null,
        seriesId: typeof p.seriesId === 'string' && series.some(s => s.id === p.seriesId) ? p.seriesId : null,
        seriesOrder: Number(p.seriesOrder) || 0, donationsEnabled: !!p.donationsEnabled,
      };
      ops.push(prisma.post.upsert({ where: { id: p.id }, create: { id: p.id, ...data }, update: data }));
    }
    if (mode === 'replace') rp.notes.push('Blog import never deletes existing stories (they hold reader responses); it only adds and updates.');
    if (!dryRun && ops.length) await prisma.$transaction(ops);
  }

  // ── CRM ───────────────────────────────────────────────────────────────────
  if (sections.includes('crm') && isObj(payload.crm)) {
    const sets = [
      ['clients', asArr(payload.crm.clients), prisma.crmClient],
      ['projects', asArr(payload.crm.projects), prisma.crmProject],
      ['invoices', asArr(payload.crm.invoices), prisma.crmInvoice],
    ] as const;
    const ops: Prisma.PrismaPromise<unknown>[] = [];
    for (const [name, rows] of sets) {
      const rep = r(`crm.${name}`);
      for (const row of rows) {
        if (typeof row.id !== 'string') { rep.skip++; continue; }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const delegate = (prisma as any)[name === 'clients' ? 'crmClient' : name === 'projects' ? 'crmProject' : 'crmInvoice'];
        const exists = await delegate.findUnique({ where: { id: row.id }, select: { id: true } });
        exists ? rep.update++ : rep.create++;
        const { id, createdAt: _c, updatedAt: _u, ...rest } = row;
        for (const k of ['startDate', 'endDate', 'issuedAt', 'dueAt', 'paidAt']) if (k in rest) rest[k] = date(rest[k]);
        ops.push(delegate.upsert({ where: { id }, create: { id, ...rest }, update: rest }));
      }
    }
    if (!dryRun && ops.length) {
      try { await prisma.$transaction(ops); } catch (e) { throw new Error(`CRM import failed: ${(e as Error).message.split('\n').pop()}`); }
    }
  }

  // ── Booking ───────────────────────────────────────────────────────────────
  if (sections.includes('booking') && isObj(payload.booking)) {
    const rc = r('booking.config'), rt = r('booking.meetingTypes');
    const cfg = payload.booking.config;
    const ops: Prisma.PrismaPromise<unknown>[] = [];
    if (isObj(cfg)) {
      rc.update++;
      const data = {
        timezone: String(cfg.timezone ?? 'Africa/Nairobi'), rules: (cfg.rules ?? []) as Prisma.InputJsonValue,
        minNoticeMin: Number(cfg.minNoticeMin) || 0, maxDaysAhead: Number(cfg.maxDaysAhead) || 30, slotStepMin: Number(cfg.slotStepMin) || 30,
        googleCalendarId: String(cfg.googleCalendarId ?? 'primary'),
      };
      ops.push(prisma.bookingConfig.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data }));
    }
    for (const t of asArr(payload.booking.meetingTypes)) {
      if (typeof t.id !== 'string' || typeof t.slug !== 'string') { rt.skip++; continue; }
      const exists = await prisma.meetingType.findUnique({ where: { id: t.id }, select: { id: true } });
      exists ? rt.update++ : rt.create++;
      const { id, createdAt: _c, updatedAt: _u, ...rest } = t;
      ops.push(prisma.meetingType.upsert({ where: { id: id as string }, create: { id: id as string, ...(rest as object) } as never, update: rest as never }));
    }
    if (!dryRun && ops.length) await prisma.$transaction(ops);
  }

  return report;
}
