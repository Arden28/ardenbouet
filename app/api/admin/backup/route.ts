// GET  /api/admin/backup?sections=content,blog,…&secrets=1 — download a JSON backup; ?counts=1 — rows per section
// POST /api/admin/backup { data, sections, mode: 'merge'|'replace', dryRun } — preview or apply an import
import { err, isAdminRequest, json, readJson } from '@/lib/apiUtil';
import { SECTIONS, dataCounts, exportData, importData, type Section } from '@/lib/backup';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const pick = (raw: unknown): Section[] =>
  (Array.isArray(raw) ? raw : String(raw ?? '').split(',')).map(String).filter((s): s is Section => (SECTIONS as readonly string[]).includes(s));

export async function GET(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const sp = new URL(req.url).searchParams;
  if (sp.get('counts') === '1') return json({ counts: await dataCounts() });
  const sections = pick(sp.get('sections') ?? SECTIONS.join(','));
  if (!sections.length) return err('Choose at least one section');
  const data = await exportData(sections, sp.get('secrets') === '1');
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="ardenbouet-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const body = await readJson(req);
  if (!body) return err('Invalid JSON');
  const sections = pick(body.sections);
  if (!sections.length) return err('Choose at least one section');
  try {
    const report = await importData(body.data, sections, body.mode === 'replace' ? 'replace' : 'merge', body.dryRun !== false);
    return json({ report, applied: body.dryRun === false });
  } catch (e) {
    return err((e as Error).message, 422);
  }
}
