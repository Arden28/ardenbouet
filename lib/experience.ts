// lib/experience.ts — data for the experience detail page: linked projects, durations and the career timeline.
import 'server-only';
import type { Experience, Project } from '@/app/admin/types';
import { getContentBundle } from '@/lib/blog/queries';
import { localize } from '@/lib/i18n/content';
import type { Locale } from '@/lib/i18n/config';
import { experienceRange, nowYm, ym } from '@/lib/experienceDates';

export * from '@/lib/experienceDates';

export type TimelineSegment = { id: string; label: string; role: string; left: number; width: number; current: boolean; ongoing: boolean };
export type Timeline = { segments: TimelineSegment[]; ticks: { year: number; left: number }[] };

/** Every dated experience as a segment on one shared axis (first start → now or last end). */
export function careerTimeline(all: Experience[], currentId: string): Timeline | null {
  const dated = all
    .map(e => { const r = experienceRange(e); return { e, s: ym(r.start), end: ym(r.end) }; })
    .filter((x): x is { e: Experience; s: number; end: number | null } => x.s !== null);
  if (!dated.some(x => x.e.id === currentId)) return null;
  const min = Math.min(...dated.map(x => x.s));
  const max = Math.max(nowYm(), ...dated.map(x => x.end ?? nowYm())) + 1;
  const span = Math.max(max - min, 12);
  const pct = (v: number) => ((v - min) / span) * 100;
  const segments = dated
    .sort((a, b) => a.s - b.s)
    .map(({ e, s, end }) => {
      const stop = (end ?? nowYm()) + 1;
      return { id: e.id, label: e.title, role: e.job, left: pct(s), width: Math.max(pct(stop) - pct(s), 1.2), current: e.id === currentId, ongoing: end === null };
    });
  const ticks: { year: number; left: number }[] = [];
  for (let y = Math.ceil(min / 12); y * 12 <= max; y++) ticks.push({ year: y, left: pct(y * 12) });
  return { segments, ticks };
}

export type ExperiencePageData = {
  experience: Experience;
  projects: Project[];
  newer: Experience | null;
  older: Experience | null;
  all: Experience[];
};

/** One experience (localized) with its linked projects in the order set on the projects admin. */
export async function loadExperience(id: string, locale: Locale): Promise<ExperiencePageData | null> {
  const bundle = await getContentBundle();
  const list = (bundle.experiences ?? []) as Experience[];
  const idx = list.findIndex(e => e.id === id);
  if (idx < 0) return null;
  const projects = ((bundle.projects ?? []) as Project[])
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.experienceId === id)
    .sort((a, b) => (a.p.experienceOrder ?? Number.MAX_SAFE_INTEGER) - (b.p.experienceOrder ?? Number.MAX_SAFE_INTEGER) || a.i - b.i)
    .map(({ p }) => localize(p, locale) as Project);
  // The list is most recent first, so the previous index is the newer role.
  return {
    experience: localize(list[idx], locale) as Experience,
    projects,
    newer: idx > 0 ? (localize(list[idx - 1], locale) as Experience) : null,
    older: idx < list.length - 1 ? (localize(list[idx + 1], locale) as Experience) : null,
    all: list.map(e => localize(e, locale) as Experience),
  };
}

/** Number of linked projects per experience id (for the home timeline). */
export function projectCounts(projects: Project[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of projects) if (p.experienceId) out[p.experienceId] = (out[p.experienceId] ?? 0) + 1;
  return out;
}
