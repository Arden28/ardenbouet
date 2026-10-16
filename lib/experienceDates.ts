// lib/experienceDates.ts — pure date helpers for experiences (no server imports, safe anywhere).
// Start/end months ("YYYY-MM") are the source of truth; the legacy free-text period is only read as a fallback.
import type { Experience } from '@/app/admin/types';
import type { Locale } from '@/lib/i18n/config';
import type { UiT } from '@/lib/i18n/ui';

/** "2024-09" → months since year 0 (null when missing or malformed). */
export function ym(v?: string): number | null {
  const m = /^(\d{4})-(\d{1,2})$/.exec((v ?? '').trim());
  if (!m) return null;
  const month = Number(m[2]);
  return month >= 1 && month <= 12 ? Number(m[1]) * 12 + (month - 1) : null;
}
export const nowYm = () => { const d = new Date(); return d.getFullYear() * 12 + d.getMonth(); };

const MONTHS: Record<string, number> = {
  jan: 1, janv: 1, january: 1, janvier: 1, feb: 2, fev: 2, fevr: 2, february: 2, fevrier: 2, mar: 3, march: 3, mars: 3,
  apr: 4, avr: 4, april: 4, avril: 4, may: 5, mai: 5, jun: 6, june: 6, juin: 6, jul: 7, juil: 7, july: 7, juillet: 7,
  aug: 8, aou: 8, august: 8, aout: 8, sep: 9, sept: 9, september: 9, septembre: 9, oct: 10, october: 10, octobre: 10,
  nov: 11, november: 11, novembre: 11, dec: 12, december: 12, decembre: 12,
};
const ONGOING = /^(present|now|current|today|ongoing|aujourd.?hui|present|actuel|maintenant|en cours)$/;

/** One side of a period: "Sept. 2024" / "03/2025" / "2024" → "YYYY-MM"; "Present" → 'present'. */
function parseSide(raw: string): string | 'present' | null {
  const s = raw.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!s) return null;
  if (ONGOING.test(s)) return 'present';
  const pad = (month: number, year: string) => (month >= 1 && month <= 12 ? `${year}-${String(month).padStart(2, '0')}` : null);
  let m = /^([a-z]+)\s+(\d{4})$/.exec(s); // "sept 2024", "mars 2025"
  if (m) return MONTHS[m[1]] ? pad(MONTHS[m[1]], m[2]) : null;
  m = /^(\d{1,2})[/-](\d{4})$/.exec(s); // "09/2024"
  if (m) return pad(Number(m[1]), m[2]);
  m = /^(\d{4})[/-](\d{1,2})$/.exec(s); // "2024-09"
  if (m) return pad(Number(m[2]), m[1]);
  m = /^(\d{4})$/.exec(s); // "2024"
  return m ? `${m[1]}-01` : null;
}

/**
 * Reads a free-text period such as "Sept. 2024 ~ Mar 2025 · 7 months", "Sep 2024 – Present" or "2023 → aujourd’hui".
 * Returns the parsed bounds (end null = ongoing) and the two display halves, or null if it can't be split.
 */
export function parsePeriod(text?: string): { start: string | null; end: string | null; ongoing: boolean; startLabel: string; endLabel: string } | null {
  const body = (text ?? '').split('·')[0].replace(/\(.*?\)/g, '').trim();
  // Separators: dashes, "~", arrows, "to" / "au" / "à", " - ", and "2023-2024". (\b doesn't work next to "à".)
  const parts = body.split(/\s*(?:–|—|~|→|->|\sto\s|\sau\s|\sà\s|\s-\s|(?<=\d{4})-(?=\d{4})|-(?=\s*[A-Za-zÀ-ÿ]))\s*/i).map(p => p.trim()).filter(Boolean);
  if (parts.length !== 2) return null;
  const a = parseSide(parts[0]), b = parseSide(parts[1]);
  if (!a || a === 'present' || !b) return null;
  return { start: a, end: b === 'present' ? null : b, ongoing: b === 'present', startLabel: parts[0], endLabel: parts[1] };
}

/** Start/end for an experience: the structured fields when set, otherwise read from the period text. */
export function experienceRange(e: Pick<Experience, 'startDate' | 'endDate' | 'fromTo'>): { start?: string; end?: string } {
  if (ym(e.startDate) !== null) return { start: e.startDate, end: ym(e.endDate) !== null ? e.endDate : undefined };
  const p = parsePeriod(e.fromTo);
  return p?.start ? { start: p.start, end: p.end ?? undefined } : {};
}

/** Fills missing startDate/endDate from the legacy period text (read-only view; nothing is written). */
export function withExperienceDates<T extends { experiences?: Experience[] }>(bundle: T): T {
  if (!bundle?.experiences?.length) return bundle;
  return {
    ...bundle,
    experiences: bundle.experiences.map(x => {
      if (ym(x.startDate) !== null) return x;
      const r = experienceRange(x);
      return r.start ? { ...x, startDate: r.start, endDate: r.end ?? '' } : x;
    }),
  };
}

/** "Sep 2024 – Mar 2025" / "Sep 2024 – Present" (falls back to the legacy period text). */
export function periodLabel(x: Pick<Experience, 'startDate' | 'endDate' | 'fromTo'>, locale: Locale, ui: UiT): string {
  const r = experienceRange(x);
  if (!r.start) return x.fromTo ?? '';
  return `${formatYm(r.start, locale)} – ${r.end ? formatYm(r.end, locale) : ui('exp.present')}`;
}

/** Inclusive month count, e.g. Sep 2024 → Mar 2025 = 7 months. */
export function monthsBetween(start?: string, end?: string): number | null {
  const s = ym(start);
  if (s === null) return null;
  const e = ym(end) ?? nowYm();
  return e >= s ? e - s + 1 : null;
}

export function formatDuration(months: number | null, ui: UiT): string {
  if (!months) return '';
  const y = Math.floor(months / 12), m = months % 12;
  return [y ? ui(y === 1 ? 'exp.year' : 'exp.years', { n: y }) : '', m ? ui(m === 1 ? 'exp.month' : 'exp.months', { n: m }) : ''].filter(Boolean).join(' ');
}

export function formatYm(v: string | undefined, locale: Locale): string {
  const n = ym(v);
  if (n === null) return '';
  return new Date(Math.floor(n / 12), n % 12, 1).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', year: 'numeric' });
}
