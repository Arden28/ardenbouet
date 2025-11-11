'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { ContentBundle } from './types';
import ProjectsEditor from './components/ProjectsEditor';
import ExperienceEditor from './components/ExperienceEditor';
import JourneyEditor from './components/JourneyEditor';
import MessagesEditor from './components/MessagesEditor';
import { Chip, downloadJSON } from './components/atoms';
import NotesEditor from './components/NotesEditor';

const STORAGE_KEY = 'arden_cms_v2'; // bump key since bundle shape changed

type Tab = 'projects' | 'experience' | 'journey' | 'notes' | 'messages';

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('projects');

  const [bundle, setBundle] = useState<ContentBundle | null>(null);
  const [status, setStatus] = useState<'idle' | 'dirty' | 'saving' | 'error' | 'loaded' | 'loading'>('loading');
  const [autosave, setAutosave] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/content', { method: 'GET', credentials: 'same-origin', cache: 'no-store' });
        if (res.status === 401) {
          router.push('/admin/login?next=/admin');
          return;
        }
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json() as any;

        // MIGRATION: if server still returns old { notes }, map to new { messages }
        const migrated: ContentBundle = {
          projects: json.projects ?? [],
          experiences: json.experiences ?? [],
          journey: json.journey ?? [],
          notes: json.notes ?? [],
          messages: json.messages ?? (json.notes
            ? (json.notes as any[]).map((n) => ({
                id: n.id ?? Math.random().toString(36).slice(2,10),
                date: n.date || new Date().toISOString().slice(0,10),
                fromName: '',
                fromEmail: '',
                subject: n.title || n.slug || 'Note',
                tags: n.tags || [],
                status: 'read',
                bodyMd: n.bodyMd || n.excerpt || '',
              }))
            : []),
        };

        setBundle(migrated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        setStatus('loaded');
      } catch {
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) {
            setBundle(JSON.parse(cached));
            setStatus('loaded');
            return;
          }
        } catch {}
        setBundle({ projects: [], experiences: [], journey: [], notes: [], messages: [] });
        setStatus('idle');
      }
    })();
  }, [router]);

  // Persist & optional autosave
  useEffect(() => {
    if (!bundle) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bundle));
    setStatus(prev => (prev === 'saving' ? prev : 'dirty'));

    if (autosave) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => { void saveServer(); }, 800);
    }
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundle, autosave]);

  const counts = useMemo(
    () => ({
      p: bundle?.projects.length ?? 0,
      e: bundle?.experiences.length ?? 0,
      j: bundle?.journey.length ?? 0,
      n: bundle?.notes.length ?? 0,
      m: bundle?.messages.length ?? 0,
    }),
    [bundle]
  );

  // Import/Export
  const onImport = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    const parsed = JSON.parse(text) as Partial<ContentBundle> & Record<string, unknown>;
    if (!parsed.projects || !parsed.experiences || !parsed.journey || !parsed.messages) {
      alert('Invalid content file (expect projects/experiences/journey/messages).');
      return;
    }
    setBundle(parsed as ContentBundle);
  };
  const exportAll = () => { if (bundle) downloadJSON('content.json', bundle); };

  const resetAll = () => {
    if (!bundle) return;
    if (confirm('Reset dashboard to empty? This will overwrite local changes.')) {
      setBundle({ projects: [], experiences: [], journey: [], notes: [], messages: [] });
    }
  };

  // Save -> server
  async function saveServer() {
    if (!bundle) return;
    try {
      setStatus('saving');
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(bundle),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus('loaded');
    } catch {
      setStatus('error');
      alert('Could not save to server.');
    }
  }

  async function logout() {
    try { await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' }); } catch {}
    router.push('/admin/login');
    router.refresh();
  }

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (status === 'dirty' && !autosave) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [status, autosave]);

  if (!bundle) {
    return (
      <section className="mx-auto mt-8 max-w-6xl px-4 pb-20">
        <div className="reel-frame grain p-6 text-sm text-zinc-600 dark:text-zinc-300">
          Loading content…
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto mt-8 max-w-6xl px-4 pb-20">
      <header className="reel-frame grain p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">
              <span className="bg-gradient-to-r from-black to-[color:var(--brand)] bg-clip-text text-transparent dark:from-white dark:to-[color:var(--brand)]">
                Content Dashboard
              </span>
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">DB-first. JSON export/import; autosave optional.</p>

            <div className="mt-2 flex items-center gap-3 text-xs text-zinc-500">
              <span
                className={[
                  'inline-flex items-center gap-1 rounded px-2 py-0.5 ring-1',
                  status === 'dirty'  ? 'text-amber-700 ring-amber-300 bg-amber-50/70 dark:bg-amber-900/10' :
                  status === 'saving' ? 'text-sky-700 ring-sky-300 bg-sky-50/70 dark:bg-sky-900/10' :
                  status === 'loaded' ? 'text-emerald-700 ring-emerald-300 bg-emerald-50/70 dark:bg-emerald-900/10' :
                  status === 'error'  ? 'text-red-700 ring-red-300 bg-red-50/70 dark:bg-red-900/10' :
                                        'text-zinc-600 ring-zinc-300 bg-zinc-50/70 dark:bg-zinc-800/50'
                ].join(' ')}
              >
                {status === 'dirty'  && 'Unsaved changes'}
                {status === 'saving' && 'Saving…'}
                {status === 'loaded' && 'All changes saved'}
                {status === 'error'  && 'Error'}
                {status === 'idle'   && 'Idle'}
                {status === 'loading'&& 'Loading…'}
              </span>

              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="h-3 w-3 rounded border-zinc-300" checked={autosave} onChange={e => setAutosave(e.target.checked)} />
                Autosave (debounced)
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm text-zinc-800 shadow-sm backdrop-blur dark:border-zinc-700/50 dark:bg-zinc-900/70 dark:text-zinc-200">
              Import
              <input type="file" accept="application/json" hidden onChange={e => onImport(e.target.files?.[0] || null)} />
            </label>
            <button onClick={exportAll} className="rounded-md bg-[color:var(--brand)] px-3 py-2 text-sm font-semibold text-white hover:opacity-95">Export JSON</button>
            <button onClick={resetAll} className="rounded-md border px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300">Reset</button>
            <button onClick={saveServer} disabled={status === 'saving'} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60">
              {status === 'saving' ? 'Saving…' : 'Save to server'}
            </button>
            <button onClick={logout} className="rounded-md border px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300">Logout</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip active={tab === 'projects'}   onClick={() => setTab('projects')}>Projects <span className="ml-1 rounded bg-[color:var(--brand-soft)] px-1">{counts.p}</span></Chip>
          <Chip active={tab === 'experience'} onClick={() => setTab('experience')}>Experience <span className="ml-1 rounded bg-[color:var(--brand-soft)] px-1">{counts.e}</span></Chip>
          <Chip active={tab === 'journey'}    onClick={() => setTab('journey')}>Journey <span className="ml-1 rounded bg-[color:var(--brand-soft)] px-1">{counts.j}</span></Chip>
          <Chip active={tab === 'notes'}      onClick={() => setTab('notes')}>Notes <span className="ml-1 rounded bg-[color:var(--brand-soft)] px-1">{counts.n}</span></Chip>
          <Chip active={tab === 'messages'}   onClick={() => setTab('messages')}>Messages <span className="ml-1 rounded bg-[color:var(--brand-soft)] px-1">{counts.m}</span></Chip>
        </div>
      </header>

      {/* Panels */}
      <div className="mt-6 space-y-6">
        {tab === 'projects'   && <ProjectsEditor   value={bundle.projects}   onChange={v => setBundle(b => ({ ...(b as ContentBundle), projects: v }))} />}
        {tab === 'experience' && <ExperienceEditor value={bundle.experiences} onChange={v => setBundle(b => ({ ...(b as ContentBundle), experiences: v }))} />}
        {tab === 'journey'    && <JourneyEditor    value={bundle.journey}    onChange={v => setBundle(b => ({ ...(b as ContentBundle), journey: v }))} />}
        {tab === 'notes'      && <NotesEditor    value={bundle.notes}     onChange={v => setBundle(b => ({ ...(b as ContentBundle), notes: v }))} />}
        {tab === 'messages'   && <MessagesEditor   value={bundle.messages}   onChange={v => setBundle(b => ({ ...(b as ContentBundle), messages: v }))} />}
      </div>
    </section>
  );
}
