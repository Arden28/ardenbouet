'use client';
// /admin/data — import & export: download any part of the site's data as JSON, or restore / migrate from a backup.
// Imports are always previewed (dry run) before anything is written.
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Briefcase, CalendarCog, CalendarDays, Check, Download, FileJson, FileText, Inbox, Layers, Mail, RotateCcw, ShieldAlert,
  ShoppingBag, Upload, Users, X,
} from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Button, PageIntro, Toggle, cx } from '@/components/admin/ui';
import { ConfirmDialog } from '@/components/admin/media/shared';

type Key = 'content' | 'blog' | 'community' | 'audience' | 'crm' | 'booking' | 'bookings' | 'commerce' | 'inbox';
type Report = Record<string, { create: number; update: number; skip: number; notes: string[] }>;

const SECTIONS: { key: Key; label: string; hint: string; icon: typeof Layers; personal?: boolean }[] = [
  { key: 'content', label: 'Site content', hint: 'Projects, experience, education, products, settings', icon: Layers },
  { key: 'blog', label: 'Blog', hint: 'Stories and series', icon: FileText },
  { key: 'community', label: 'Readers & community', hint: 'Readers, writer access, responses, donations', icon: Users, personal: true },
  { key: 'audience', label: 'Newsletter', hint: 'Subscribers', icon: Mail, personal: true },
  { key: 'crm', label: 'CRM', hint: 'Clients, projects, invoices', icon: Briefcase, personal: true },
  { key: 'booking', label: 'Booking setup', hint: 'Availability and meeting types', icon: CalendarCog },
  { key: 'bookings', label: 'Bookings', hint: 'Scheduled and past meetings', icon: CalendarDays, personal: true },
  { key: 'commerce', label: 'Orders', hint: 'Orders and download links', icon: ShoppingBag, personal: true },
  { key: 'inbox', label: 'Messages', hint: 'Contact form messages', icon: Inbox, personal: true },
];
const LABEL = Object.fromEntries(SECTIONS.map(s => [s.key, s.label])) as Record<Key, string>;
const SUB: Record<string, string> = {
  projects: 'projects', experiences: 'experience', journey: 'education', products: 'products', settings: 'settings', posts: 'stories', series: 'series',
  readers: 'readers', writerGrants: 'writer access', comments: 'responses', donations: 'donations', subscribers: 'subscribers', clients: 'clients',
  invoices: 'invoices', config: 'availability', meetingTypes: 'meeting types', bookings: 'bookings', orders: 'orders', downloadTokens: 'download links', messages: 'messages',
};
const rowLabel = (k: string) => { const [s, sub] = k.split('.'); return `${LABEL[s as Key] ?? s} · ${SUB[sub] ?? sub}`; };

/** Rows per section inside a backup file (for the summary chips). */
function fileCounts(data: Record<string, unknown>): Partial<Record<Key, number>> {
  const out: Partial<Record<Key, number>> = {};
  for (const s of SECTIONS) {
    const v = data[s.key];
    if (!v || typeof v !== 'object') continue;
    out[s.key] = Object.values(v as Record<string, unknown>).reduce<number>((n, x) => n + (Array.isArray(x) ? x.length : x && typeof x === 'object' ? 1 : 0), 0);
  }
  return out;
}

function SectionTile({ s, checked, onToggle, count, disabled }: { s: (typeof SECTIONS)[number]; checked: boolean; onToggle: () => void; count?: number; disabled?: boolean }) {
  const Icon = s.icon;
  return (
    <button type="button" role="checkbox" aria-checked={checked} disabled={disabled} onClick={onToggle}
      className={cx('flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors disabled:opacity-40', checked ? 'border-[#242424] bg-[#fafafa]' : 'border-[#ececec] hover:border-[#c4c4c4]')}>
      <span className={cx('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors', checked ? 'border-[#242424] bg-[#242424] text-white' : 'border-[#d4d4d4]')}>
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-[14px] font-medium text-[#242424]"><Icon className="h-4 w-4 text-[#6b6b6b]" /> {s.label}</span>
        <span className="mt-0.5 block text-[12px] leading-5 text-[#9b9b9b]">{s.hint}</span>
      </span>
      {count !== undefined && <span className="shrink-0 rounded-full bg-[#f2f2f2] px-2 py-0.5 text-[12px] tabular-nums text-[#6b6b6b]">{count.toLocaleString()}</span>}
    </button>
  );
}

export default function DataPage() {
  // ── Export ──
  const [counts, setCounts] = useState<Record<Key, number> | null>(null);
  const [exportSel, setExportSel] = useState<Key[]>(SECTIONS.map(s => s.key));
  const [secrets, setSecrets] = useState(false);
  useEffect(() => { fetch('/api/admin/backup?counts=1', { cache: 'no-store' }).then(r => r.json()).then(d => setCounts(d.counts)).catch(() => {}); }, []);
  const exportUrl = `/api/admin/backup?sections=${exportSel.join(',')}${secrets ? '&secrets=1' : ''}`;
  const personalSelected = exportSel.some(k => SECTIONS.find(s => s.key === k)?.personal);
  const toggleExport = (k: Key) => setExportSel(s => (s.includes(k) ? s.filter(x => x !== k) : [...s, k]));

  // ── Import ──
  const [file, setFile] = useState<{ name: string; size: number; data: Record<string, unknown> } | null>(null);
  const [importSel, setImportSel] = useState<Key[]>([]);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [report, setReport] = useState<Report | null>(null);
  const [applied, setApplied] = useState(false);
  const [busy, setBusy] = useState<'' | 'preview' | 'apply'>('');
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const inFile = useMemo(() => (file ? fileCounts(file.data) : {}), [file]);

  const reset = () => { setFile(null); setReport(null); setApplied(false); setError(''); setImportSel([]); };
  const pickFile = async (f: File | undefined) => {
    reset();
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (data?.format !== 'ardenbouet-backup') { setError('This file isn’t an ardenbouet backup.'); return; }
      setFile({ name: f.name, size: f.size, data });
      setImportSel(SECTIONS.map(s => s.key).filter(k => data[k]));
    } catch { setError('That file isn’t valid JSON.'); }
  };

  const run = async (dryRun: boolean) => {
    if (!file) return;
    setBusy(dryRun ? 'preview' : 'apply');
    setError('');
    const res = await fetch('/api/admin/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: file.data, sections: importSel, mode, dryRun }) });
    const d = await res.json().catch(() => ({}));
    setBusy('');
    if (!res.ok) { setError(d.error ?? 'Import failed'); setReport(null); return; }
    setReport(d.report);
    setApplied(!dryRun);
    if (!dryRun) fetch('/api/admin/backup?counts=1', { cache: 'no-store' }).then(r => r.json()).then(x => setCounts(x.counts)).catch(() => {});
  };

  const totals = report && Object.values(report).reduce((t, v) => ({ create: t.create + v.create, update: t.update + v.update, skip: t.skip + v.skip }), { create: 0, update: 0, skip: 0 });
  const exportedAt = typeof file?.data.exportedAt === 'string' ? new Date(file.data.exportedAt) : null;

  return (
    <AdminShell title="Import & export">
      <div className="mx-auto max-w-[960px]">
        <PageIntro title="Import & export" description="Download your data as JSON, or restore and migrate it from a backup. Imports are previewed before anything changes." />

        {/* Export */}
        <section className="rounded-2xl border border-[#f0f0f0] bg-white p-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="flex items-center gap-2 text-[17px] font-semibold text-[#242424]"><Download className="h-[18px] w-[18px]" /> Export</h2>
              <p className="mt-1 text-[13px] text-[#6b6b6b]">Choose what to include. The file can be imported back here or into another install.</p>
            </div>
            <button type="button" onClick={() => setExportSel(exportSel.length === SECTIONS.length ? [] : SECTIONS.map(s => s.key))} className="text-[13px] text-[#6b6b6b] underline-offset-4 hover:text-[#242424] hover:underline">
              {exportSel.length === SECTIONS.length ? 'Select none' : 'Select all'}
            </button>
          </div>
          <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {SECTIONS.map(s => <SectionTile key={s.key} s={s} checked={exportSel.includes(s.key)} onToggle={() => toggleExport(s.key)} count={counts?.[s.key]} />)}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[#f6f6f6] pt-5">
            <a href={exportSel.length ? exportUrl : undefined} aria-disabled={!exportSel.length}
              className={cx('inline-flex items-center gap-2 rounded-full bg-[#242424] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-black', !exportSel.length && 'pointer-events-none opacity-40')}>
              <Download className="h-4 w-4" /> Download JSON
            </a>
            {exportSel.includes('content') && (
              <div className="max-w-[340px]"><Toggle checked={secrets} onChange={setSecrets} label="Include storage secrets" hint="R2 keys saved in Settings, only if you need them in the file" /></div>
            )}
          </div>
          {personalSelected && (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-[#fdf6e7] px-3.5 py-2.5 text-[13px] leading-5 text-[#7a5a00]">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> This export contains people’s names and email addresses. Keep the file somewhere private.
            </p>
          )}
        </section>

        {/* Import */}
        <section className="mt-6 rounded-2xl border border-[#f0f0f0] bg-white p-6">
          <h2 className="flex items-center gap-2 text-[17px] font-semibold text-[#242424]"><Upload className="h-[18px] w-[18px]" /> Import</h2>
          <p className="mt-1 text-[13px] text-[#6b6b6b]">Rows are matched by id: new ones are added, existing ones updated. Nothing is deleted unless you choose “Replace” for site content.</p>

          <input ref={input} type="file" accept="application/json,.json" hidden onChange={e => { pickFile(e.target.files?.[0]); e.target.value = ''; }} />
          {!file ? (
            <button type="button" onClick={() => input.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files?.[0]); }}
              className={cx('mt-5 flex w-full flex-col items-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors', dragging ? 'border-[#1a8917] bg-[#f3faf3]' : 'border-[#e6e6e6] hover:border-[#c4c4c4]')}>
              <FileJson className="h-9 w-9 text-[#9b9b9b]" strokeWidth={1.4} />
              <span className="mt-3 text-[15px] font-medium text-[#242424]">Drop a backup file here, or click to choose</span>
              <span className="mt-1 text-[13px] text-[#9b9b9b]">.json files exported from this page</span>
            </button>
          ) : (
            <>
              <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#fafafa] px-4 py-3">
                <FileJson className="h-6 w-6 shrink-0 text-[#6b6b6b]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-[#242424]">{file.name}</p>
                  <p className="text-[12px] text-[#9b9b9b]">{(file.size / 1024).toFixed(1)} KB{exportedAt ? ` · exported ${exportedAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}` : ''}</p>
                </div>
                <button type="button" onClick={reset} aria-label="Remove file" className="rounded-full p-1.5 text-[#6b6b6b] hover:bg-[#ececec]"><X className="h-4 w-4" /></button>
              </div>

              <p className="mt-5 text-[13px] font-medium text-[#242424]">Import these sections</p>
              <div className="mt-2 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {SECTIONS.map(s => (
                  <SectionTile key={s.key} s={s} count={inFile[s.key]} disabled={inFile[s.key] === undefined || applied}
                    checked={importSel.includes(s.key)} onToggle={() => { setReport(null); setImportSel(x => (x.includes(s.key) ? x.filter(k => k !== s.key) : [...x, s.key])); }} />
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 text-[13px]">
                <span className="mr-1 text-[#6b6b6b]">Site content</span>
                {(['merge', 'replace'] as const).map(m => (
                  <button key={m} type="button" disabled={applied} onClick={() => { setMode(m); setReport(null); }}
                    className={cx('rounded-full px-3.5 py-1.5', mode === m ? 'bg-[#242424] text-white' : 'border border-[#e6e6e6] text-[#242424] hover:border-[#c4c4c4]')}>
                    {m === 'merge' ? 'Merge (add & update)' : 'Replace lists'}
                  </button>
                ))}
              </div>
              {mode === 'replace' && (
                <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#7a5a00]"><AlertTriangle className="h-3.5 w-3.5" /> Projects, experience, education and products will match the file exactly; items not in it are removed. Other sections are always merged.</p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-2">
                {!applied && <Button onClick={() => run(true)} busy={busy === 'preview'} disabled={!importSel.length}>Preview import</Button>}
                {report && !applied && <Button variant="primary" busy={busy === 'apply'} onClick={() => setConfirming(true)}>Apply import</Button>}
                {applied && <Button onClick={reset}><RotateCcw className="h-4 w-4" /> Import another file</Button>}
              </div>
            </>
          )}
          {error && <p className="mt-4 rounded-lg bg-[#fdf1f1] px-3.5 py-2.5 text-[13px] text-[#c94a4a]">{error}</p>}

          {report && totals && (
            <div className="mt-6 overflow-hidden rounded-xl border border-[#ececec]">
              <div className={cx('flex flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3 text-[13px]', applied ? 'bg-[#eef7ee] text-[#1a6b17]' : 'bg-[#fafafa] text-[#6b6b6b]')}>
                <span className="flex items-center gap-1.5 font-medium">{applied ? <><Check className="h-4 w-4" /> Import applied</> : 'Preview, nothing has changed yet'}</span>
                <span>{totals.create} new</span><span>{totals.update} updated</span>{totals.skip > 0 && <span>{totals.skip} skipped</span>}
              </div>
              <table className="w-full text-[13px]">
                <thead className="text-left text-[11px] uppercase tracking-[0.06em] text-[#9b9b9b]">
                  <tr className="border-t border-[#f2f2f2]"><th className="px-4 py-2 font-medium">What</th><th className="px-4 py-2 text-right font-medium">New</th><th className="px-4 py-2 text-right font-medium">Updated</th><th className="px-4 py-2 text-right font-medium">Skipped</th></tr>
                </thead>
                <tbody>
                  {Object.entries(report).map(([k, v]) => (
                    <tr key={k} className="border-t border-[#f6f6f6] align-top">
                      <td className="px-4 py-2.5 text-[#242424]">{rowLabel(k)}{v.notes.map(n => <span key={n} className="mt-0.5 block text-[12px] text-[#9b9b9b]">{n}</span>)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{v.create}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{v.update}</td>
                      <td className={cx('px-4 py-2.5 text-right tabular-nums', v.skip > 0 && 'text-[#7a5a00]')}>{v.skip}</td>
                    </tr>
                  ))}
                  {Object.keys(report).length === 0 && <tr><td colSpan={4} className="px-4 py-3 text-[#9b9b9b]">Nothing in this file for the selected sections.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {confirming && totals && (
        <ConfirmDialog
          title="Apply this import?"
          okLabel="Apply import"
          danger={mode === 'replace'}
          body={<p>{totals.create} rows will be added and {totals.update} updated{mode === 'replace' ? ', and site content lists will be replaced by the file' : ''}. Consider downloading an export first so you can roll back.</p>}
          onConfirm={() => run(false)}
          onClose={() => setConfirming(false)}
        />
      )}
    </AdminShell>
  );
}
