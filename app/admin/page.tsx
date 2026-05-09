'use client';
// app/admin/page.tsx

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Download, Save, LogOut } from 'lucide-react';

import type { ContentBundle } from './types';
import ProjectsEditor   from './components/ProjectsEditor';
import ExperienceEditor from './components/ExperienceEditor';
import JourneyEditor    from './components/JourneyEditor';
import NotesEditor      from './components/NotesEditor';
import { Toggle, downloadJSON } from './components/atoms';

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab    = 'projects' | 'experience' | 'journey' | 'notes';
type Status = 'idle' | 'dirty' | 'saving' | 'error' | 'loaded' | 'loading';

const STORAGE_KEY = 'arden_cms_v2';
const EXPO        = [0.16, 1, 0.3, 1] as const;

// ─── Status dot ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<Status, { color: string; label: string; pulse?: boolean }> = {
  loading: { color: 'bg-zinc-600',   label: 'Loading…'  },
  idle:    { color: 'bg-zinc-600',   label: 'Ready'      },
  dirty:   { color: 'bg-amber-400',  label: 'Unsaved',   pulse: true },
  saving:  { color: 'bg-blue-400',   label: 'Saving…',   pulse: true },
  loaded:  { color: 'bg-[#2467AC]',  label: 'All saved'  },
  error:   { color: 'bg-red-500',    label: 'Save error', pulse: true },
};

function StatusDot({ status }: { status: Status }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-1.5 w-1.5">
        {cfg.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.color} opacity-75`} />
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${cfg.color}`} />
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400">
        {cfg.label}
      </span>
    </div>
  );
}

// ─── Nav item ─────────────────────────────────────────────────────────────────
function NavItem({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group relative flex w-full items-center gap-3 px-4 py-2.5',
        'transition-colors duration-150 focus-visible:outline-none',
        active
          ? 'text-zinc-100'
          : 'text-zinc-500 hover:text-zinc-300',
      ].join(' ')}
    >
      {/* Active left-edge lime bar */}
      <span
        className={[
          'absolute left-0 h-full w-[2px] bg-[#2467AC]',
          'transition-opacity duration-150',
          active ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        aria-hidden
      />
      <span className="flex-1 text-left font-mono text-[10px] uppercase tracking-widest">
        {label}
      </span>
      <span
        className={[
          'font-mono text-[9px] tabular-nums',
          active ? 'text-zinc-400' : 'text-zinc-700',
        ].join(' ')}
      >
        {count}
      </span>
    </button>
  );
}

// ─── Sidebar action button ────────────────────────────────────────────────────
function SidebarAction({
  onClick,
  icon: Icon,
  label,
  children,
}: {
  onClick?: () => void;
  icon?: React.ElementType;
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group flex w-full items-center gap-2 px-3 py-2',
        'font-mono text-[9px] uppercase tracking-widest',
        'text-zinc-500 hover:text-zinc-200',
        'transition-colors duration-150 focus-visible:outline-none',
      ].join(' ')}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      <span>{label}</span>
      {children}
    </button>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
// Matches the final layout exactly — no layout shift when bundle loads.
function Skeleton() {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden w-[220px] shrink-0 flex-col bg-zinc-900 lg:flex" />
      <div className="flex flex-1 flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        <div className="flex h-14 items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 px-6">
          <div className="h-3 w-24 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-32 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 border-l border-t border-zinc-200 dark:border-zinc-800 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse border-b border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter();

  const [tab,      setTab]      = useState<Tab>('projects');
  const [bundle,   setBundle]   = useState<ContentBundle | null>(null);
  const [status,   setStatus]   = useState<Status>('loading');
  const [autosave, setAutosave] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/content', {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (res.status === 401) { router.push('/admin/login?next=/admin'); return; }
        if (!res.ok) throw new Error();
        const json = await res.json() as any;
        setBundle({
          projects:    json.projects    ?? [],
          experiences: json.experiences ?? [],
          journey:     json.journey     ?? [],
          notes:       json.notes       ?? [],
        });
        setStatus('loaded');
      } catch {
        setBundle({ projects: [], experiences: [], journey: [], notes: [] });
        setStatus('idle');
      }
    })();
  }, [router]);

  // ── Autosave + localStorage ───────────────────────────────────────────────
  useEffect(() => {
    if (!bundle) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bundle));
    setStatus(prev => prev === 'saving' ? prev : 'dirty');
    if (autosave) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => { void saveServer(); }, 1500);
    }
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundle, autosave]);

  // ── Server save ───────────────────────────────────────────────────────────
  async function saveServer() {
    if (!bundle) return;
    try {
      setStatus('saving');
      await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(bundle),
      });
      setStatus('loaded');
    } catch {
      setStatus('error');
    }
  }

  // ── Import / export ───────────────────────────────────────────────────────
  const onImport = async (file: File | null) => {
    if (!file) return;
    try {
      setBundle(JSON.parse(await file.text()));
    } catch { alert('Invalid JSON file.'); }
  };

  const exportAll = () => {
    if (bundle) downloadJSON('content.json', bundle);
  };

  // ── Counts ────────────────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    projects:   bundle?.projects.length    ?? 0,
    experience: bundle?.experiences.length ?? 0,
    journey:    bundle?.journey.length     ?? 0,
    notes:      bundle?.notes.length       ?? 0,
  }), [bundle]);

  if (!bundle) return <Skeleton />;

  const NAV: { key: Tab; label: string; count: number }[] = [
    { key: 'projects',   label: 'Projects',   count: counts.projects   },
    { key: 'experience', label: 'Experience', count: counts.experience },
    { key: 'journey',    label: 'Journey',    count: counts.journey    },
    { key: 'notes',      label: 'Notes',      count: counts.notes      },
  ];

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
      {/*
        Dark sidebar — authoritative, permanent.
        bg-zinc-900 creates strong contrast with the light content area.
      */}
      <aside className="hidden w-[220px] shrink-0 flex-col bg-zinc-900 lg:flex">

        {/* Brand */}
        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-800 px-4">
          <div
            className={[
              'inline-flex h-8 w-8 shrink-0 items-center justify-center',
              'border border-zinc-700',
              'font-heading text-[10px] font-black text-zinc-100',
            ].join(' ')}
          >
            AB
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
            Admin CMS
          </span>
        </div>

        {/* Status */}
        <div className="shrink-0 border-b border-zinc-800 px-4 py-3">
          <StatusDot status={status} />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2" aria-label="Admin sections">
          {NAV.map(item => (
            <NavItem
              key={item.key}
              label={item.label}
              count={item.count}
              active={tab === item.key}
              onClick={() => setTab(item.key)}
            />
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="shrink-0 border-t border-zinc-800 py-2">
          {/* Autosave toggle */}
          <div className="flex items-center justify-between px-4 py-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
              Autosave
            </span>
            <Toggle checked={autosave} onChange={setAutosave} />
          </div>

          <div className="h-px mx-4 bg-zinc-800 my-1" />

          {/* Import */}
          <SidebarAction icon={Upload} label="Import JSON" onClick={() => document.getElementById('admin-import')?.click()}>
            <input
              id="admin-import"
              type="file"
              hidden
              accept=".json"
              onChange={e => onImport(e.target.files?.[0] ?? null)}
            />
          </SidebarAction>

          {/* Export */}
          <SidebarAction icon={Download} label="Export JSON" onClick={exportAll} />

          <div className="h-px mx-4 bg-zinc-800 my-1" />

          {/* Save */}
          <div className="px-3 py-2">
            <button
              type="button"
              onClick={saveServer}
              disabled={status === 'saving' || status === 'loading'}
              className={[
                'w-full py-2',
                'font-mono text-[10px] uppercase tracking-widest',
                'border transition-colors duration-150 focus-visible:outline-none',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                status === 'dirty' || status === 'error'
                  ? 'border-zinc-100 bg-zinc-100 text-zinc-900 hover:bg-zinc-200'
                  : 'border-zinc-700 bg-transparent text-zinc-500 hover:border-zinc-400 hover:text-zinc-300',
              ].join(' ')}
            >
              {status === 'saving' ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </aside>

      {/* ── CONTENT AREA ─────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">

        {/* Mobile top bar (tablet / mobile) */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-7 w-7 items-center justify-center border border-zinc-900 dark:border-zinc-100 font-heading text-[9px] font-black">
              AB
            </div>
            <StatusDot status={status} />
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile tab selector */}
            <select
              value={tab}
              onChange={e => setTab(e.target.value as Tab)}
              className={[
                'border border-zinc-200 dark:border-zinc-800',
                'bg-white dark:bg-zinc-900',
                'px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest',
                'text-zinc-700 dark:text-zinc-300',
                'focus:outline-none',
              ].join(' ')}
            >
              {NAV.map(n => (
                <option key={n.key} value={n.key}>{n.label} ({n.count})</option>
              ))}
            </select>
            <button
              type="button"
              onClick={saveServer}
              disabled={status === 'saving'}
              className="border border-zinc-900 dark:border-zinc-100 px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest text-zinc-900 dark:text-zinc-100 hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-50 dark:hover:text-zinc-900 transition-colors disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </header>

        {/* Main editor content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: EXPO }}
            >
              {tab === 'projects'   && (
                <ProjectsEditor
                  value={bundle.projects}
                  onChange={v => setBundle(b => ({ ...b!, projects: v }))}
                />
              )}
              {tab === 'experience' && (
                <ExperienceEditor
                  value={bundle.experiences}
                  onChange={v => setBundle(b => ({ ...b!, experiences: v }))}
                />
              )}
              {tab === 'journey'    && (
                <JourneyEditor
                  value={bundle.journey}
                  onChange={v => setBundle(b => ({ ...b!, journey: v }))}
                />
              )}
              {tab === 'notes'      && (
                <NotesEditor
                  value={bundle.notes}
                  onChange={v => setBundle(b => ({ ...b!, notes: v }))}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}