'use client';
// Backup & restore: JSON export of chosen sections, import with a dry-run preview first.
import { useRef, useState } from 'react';
import { Download, Upload, FileJson, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/admin/ui';

const SECTIONS = [
  { key: 'content', label: 'Site content', hint: 'Projects, experience, education, products, settings' },
  { key: 'blog', label: 'Blog', hint: 'Stories and series (not reader responses)' },
  { key: 'crm', label: 'CRM', hint: 'Clients, projects, invoices' },
  { key: 'booking', label: 'Booking setup', hint: 'Availability and meeting types (not bookings)' },
] as const;
type Report = Record<string, { create: number; update: number; skip: number; notes: string[] }>;

export function BackupCard() {
  const [sections, setSections] = useState<string[]>(['content', 'blog']);
  const [secrets, setSecrets] = useState(false);
  const [file, setFile] = useState<{ name: string; data: unknown } | null>(null);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [report, setReport] = useState<Report | null>(null);
  const [applied, setApplied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);

  const toggle = (k: string) => { setSections(s => (s.includes(k) ? s.filter(x => x !== k) : [...s, k])); setReport(null); };
  const exportUrl = `/api/admin/backup?sections=${sections.join(',')}${secrets ? '&secrets=1' : ''}`;

  const run = async (dryRun: boolean) => {
    if (!file) return;
    setBusy(true);
    setError('');
    const res = await fetch('/api/admin/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: file.data, sections, mode, dryRun }) });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) { setError(d.error); setReport(null); return; }
    setReport(d.report);
    setApplied(!dryRun);
  };

  const pickFile = async (f: File | undefined) => {
    setReport(null);
    setApplied(false);
    setError('');
    if (!f) return;
    try { setFile({ name: f.name, data: JSON.parse(await f.text()) }); } catch { setError('That file is not valid JSON.'); setFile(null); }
  };

  return (
    <section className="rounded-2xl border border-[#f0f0f0] bg-white p-6">
      <h2 className="text-[15px] font-semibold text-[#242424]">Backup & restore</h2>
      <p className="mt-1 text-[13px] text-[#6b6b6b]">Download your data as JSON, or import a backup. Imports are previewed before anything changes.</p>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {SECTIONS.map(s => (
          <label key={s.key} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${sections.includes(s.key) ? 'border-[#242424]' : 'border-[#ececec]'}`}>
            <input type="checkbox" checked={sections.includes(s.key)} onChange={() => toggle(s.key)} className="mt-0.5 accent-[#242424]" />
            <span><span className="block text-[14px] font-medium text-[#242424]">{s.label}</span><span className="block text-[12px] text-[#9b9b9b]">{s.hint}</span></span>
          </label>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-[#f6f6f6] pt-5">
        <a href={sections.length ? exportUrl : undefined} aria-disabled={!sections.length}
          className={`inline-flex items-center gap-2 rounded-full bg-[#242424] px-4 py-2 text-[14px] font-medium text-white hover:bg-black ${sections.length ? '' : 'pointer-events-none opacity-40'}`}>
          <Download className="h-4 w-4" /> Export JSON
        </a>
        <label className="flex items-center gap-2 text-[13px] text-[#6b6b6b]">
          <input type="checkbox" checked={secrets} onChange={e => setSecrets(e.target.checked)} className="accent-[#c94a4a]" /> Include storage secrets
        </label>
      </div>

      <div className="mt-5 rounded-xl bg-[#fafafa] p-4">
        <input ref={input} type="file" accept="application/json,.json" hidden onChange={e => pickFile(e.target.files?.[0])} />
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => input.current?.click()}><Upload className="h-4 w-4" /> Choose backup file</Button>
          {file && <span className="flex items-center gap-1.5 text-[13px] text-[#242424]"><FileJson className="h-4 w-4 text-[#6b6b6b]" /> {file.name}</span>}
        </div>
        {file && (
          <>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px]">
              <span className="text-[#6b6b6b]">Mode</span>
              {(['merge', 'replace'] as const).map(m => (
                <button key={m} type="button" onClick={() => { setMode(m); setReport(null); }} className={`rounded-full px-3 py-1 ${mode === m ? 'bg-[#242424] text-white' : 'border border-[#e6e6e6] bg-white'}`}>
                  {m === 'merge' ? 'Merge (add & update by id)' : 'Replace sections'}
                </button>
              ))}
            </div>
            {mode === 'replace' && (
              <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#7a5a00]"><AlertTriangle className="h-3.5 w-3.5" /> Replace makes the chosen content lists match the file exactly (items not in the file are removed).</p>
            )}
            <div className="mt-4 flex gap-2">
              <Button onClick={() => run(true)} busy={busy && !report} disabled={!sections.length}>Preview import</Button>
              {report && !applied && <Button variant="primary" busy={busy} onClick={() => { if (confirm('Apply this import?')) run(false); }}>Apply import</Button>}
            </div>
          </>
        )}
        {error && <p className="mt-3 text-[13px] text-[#c94a4a]">{error}</p>}
        {report && (
          <div className="mt-4 overflow-hidden rounded-lg border border-[#ececec] bg-white">
            {applied && <p className="flex items-center gap-2 border-b border-[#f2f2f2] bg-[#eef7ee] px-4 py-2 text-[13px] text-[#1a6b17]"><Check className="h-4 w-4" /> Import applied.</p>}
            <table className="w-full text-[13px]">
              <thead className="text-left text-[11px] uppercase tracking-[0.06em] text-[#9b9b9b]">
                <tr><th className="px-4 py-2 font-medium">Section</th><th className="px-4 py-2 text-right font-medium">New</th><th className="px-4 py-2 text-right font-medium">Updated</th><th className="px-4 py-2 text-right font-medium">Skipped</th></tr>
              </thead>
              <tbody>
                {Object.entries(report).map(([k, v]) => (
                  <tr key={k} className="border-t border-[#f6f6f6] align-top">
                    <td className="px-4 py-2 text-[#242424]">{k}{v.notes.map(n => <span key={n} className="block text-[12px] text-[#9b9b9b]">{n}</span>)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{v.create}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{v.update}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{v.skip}</td>
                  </tr>
                ))}
                {Object.keys(report).length === 0 && <tr><td colSpan={4} className="px-4 py-3 text-[#9b9b9b]">Nothing in this file for the selected sections.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
