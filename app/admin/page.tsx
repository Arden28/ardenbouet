'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Download, CheckCircle2, Loader2 } from 'lucide-react';

import type { ContentBundle } from './types';
import ProjectsEditor from './components/ProjectsEditor';
import ExperienceEditor from './components/ExperienceEditor';
import JourneyEditor from './components/JourneyEditor';
import MessagesEditor from './components/MessagesEditor';
import NotesEditor from './components/NotesEditor';
// Note: Added Toggle to imports
import { Chip, downloadJSON, Button, cn, Toggle } from './components/atoms'; 

const STORAGE_KEY = 'arden_cms_v2';
type Tab = 'projects' | 'experience' | 'journey' | 'notes';

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('projects');
  const [bundle, setBundle] = useState<ContentBundle | null>(null);
  const [status, setStatus] = useState<'idle' | 'dirty' | 'saving' | 'error' | 'loaded' | 'loading'>('loading');
  const [autosave, setAutosave] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- 1. Initial Load ---
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/content', { method: 'GET', credentials: 'same-origin', cache: 'no-store' });
        if (res.status === 401) { router.push('/admin/login?next=/admin'); return; }
        if (!res.ok) throw new Error();
        const json = await res.json() as any;

        const migrated: ContentBundle = {
            projects: json.projects ?? [],
            experiences: json.experiences ?? [],
            journey: json.journey ?? [],
            notes: json.notes ?? [],
        };
        setBundle(migrated);
        setStatus('loaded');
      } catch {
        setBundle({ projects: [], experiences: [], journey: [], notes: [] });
        setStatus('idle');
      }
    })();
  }, [router]);

  // --- 2. Autosave Logic ---
  useEffect(() => {
    if (!bundle) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bundle));
    setStatus(prev => (prev === 'saving' ? prev : 'dirty'));
    if (autosave) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => { void saveServer(); }, 1500); // Increased debounce slightly for safety
    }
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [bundle, autosave]);

  // --- 3. Actions ---
  const onImport = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    try {
        setBundle(JSON.parse(text));
    } catch(e) { alert("Error importing"); }
  };
  const exportAll = () => { if (bundle) downloadJSON('content.json', bundle); };
  
  async function saveServer() {
    if (!bundle) return;
    try {
      setStatus('saving');
      await fetch('/api/admin/content', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(bundle) });
      setStatus('loaded');
    } catch { setStatus('error'); }
  }

  const counts = useMemo(() => ({
    projects: bundle?.projects.length ?? 0,
    experience: bundle?.experiences.length ?? 0,
    journey: bundle?.journey.length ?? 0,
    notes: bundle?.notes.length ?? 0,
    // messages: bundle?.messages.length ?? 0,
  }), [bundle]);

  if (!bundle) return <div className="flex h-screen items-center justify-center text-zinc-400"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">
      {/* --- Sticky Header --- */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-black/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            
          {/* Brand & Status */}
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black tracking-tight text-[color:var(--brand)]">
              ACMS<span className="text-zinc-300 dark:text-zinc-700">v2</span>
            </h1>
            
            <div className={cn("flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors", 
                status === 'dirty' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                status === 'saving' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            )}>
                {status === 'saving' && <Loader2 className="h-3 w-3 animate-spin" />}
                {status === 'dirty' && <div className="h-2 w-2 rounded-full bg-current" />}
                {status === 'loaded' && <CheckCircle2 className="h-3 w-3" />}
                <span>{status === 'dirty' ? 'Unsaved' : status === 'saving' ? 'Saving' : 'Synced'}</span>
            </div>
          </div>

          {/* Navigation Tabs (Centered) */}
          <nav className="hidden items-center gap-1 md:flex">
            {(['projects', 'experience', 'journey', 'notes'] as Tab[]).map((t) => (
                <Chip key={t} active={tab === t} onClick={() => setTab(t)} count={counts[t]}>
                    <span className="capitalize">{t}</span>
                </Chip>
            ))}
          </nav>

          {/* Toolbar */}
          <div className="flex items-center gap-4">
            {/* UPDATED: The new Toggle Component */}
            <Toggle checked={autosave} onChange={setAutosave} label="Autosave" />
            
            <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
            
            <div className="flex items-center gap-1">
                <Button variant="ghost" className="h-8 w-8 p-0" title="Import" onClick={() => document.getElementById('imp')?.click()}>
                    <Upload className="h-4 w-4" />
                    <input id="imp" type="file" hidden accept=".json" onChange={e => onImport(e.target.files?.[0] || null)} />
                </Button>
                <Button variant="ghost" className="h-8 w-8 p-0" title="Export" onClick={exportAll}><Download className="h-4 w-4" /></Button>
            </div>
            
            <Button variant="primary" onClick={saveServer} loading={status === 'saving'} disabled={status === 'loading'} className="h-8 text-xs">
                Save Changes
            </Button>
          </div>
        </div>
        
        {/* Mobile Tabs */}
        <div className="flex overflow-x-auto border-t border-zinc-100 bg-zinc-50/50 p-2 dark:border-zinc-800 dark:bg-zinc-900/50 md:hidden">
            {(['projects', 'experience', 'journey', 'notes'] as Tab[]).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={cn("px-3 py-1 text-sm font-medium", tab===t ? "text-[color:var(--brand)]" : "text-zinc-500")}>
                    {t}
                </button>
            ))}
        </div>
      </header>

      {/* --- Main Workspace --- */}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 pb-32">
        <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
        >
            {tab === 'projects'   && <ProjectsEditor   value={bundle.projects}    onChange={v => setBundle(b => ({ ...b!, projects: v }))} />}
            {tab === 'experience' && <ExperienceEditor value={bundle.experiences} onChange={v => setBundle(b => ({ ...b!, experiences: v }))} />}
            {tab === 'journey'    && <JourneyEditor    value={bundle.journey}     onChange={v => setBundle(b => ({ ...b!, journey: v }))} />}
            {tab === 'notes'      && <NotesEditor      value={bundle.notes}       onChange={v => setBundle(b => ({ ...b!, notes: v }))} />}
        </motion.div>
      </main>
    </div>
  );
}