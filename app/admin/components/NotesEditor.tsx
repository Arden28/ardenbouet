'use client';
// app/admin/components/NotesEditor.tsx

import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import {
  Plus, FileText, Search, AlignLeft, Columns2, Eye, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Note } from '../types';
import { TextField, uid, Button, Rule, useIsDark, LanguageField } from './atoms';
import { ArrayField } from './ArrayField';

// @ts-ignore — no type declarations shipped for these CSS side-effect imports
import '@uiw/react-md-editor/markdown-editor.css';
// @ts-ignore
import '@uiw/react-markdown-preview/markdown.css';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

// ─── Types ───────────────────────────────────────────────────────────────────
type PreviewMode = 'edit' | 'live' | 'preview';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function calcReading(md?: string): string {
  if (!md) return '';
  const words = md.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}

function countWords(md?: string): number {
  if (!md) return 0;
  return md.trim().split(/\s+/).filter(Boolean).length;
}

function autoSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

// ─── Snippet library ─────────────────────────────────────────────────────────
const SNIPPETS = [
  { label: 'H2',        text: '\n## Heading\n' },
  { label: 'H3',        text: '\n### Heading\n' },
  { label: '```tsx',    text: '\n```tsx\n// code\n```\n' },
  { label: '```bash',   text: '\n```bash\n\n```\n' },
  { label: '`inline`',  text: '`code`' },
  { label: 'Table',     text: '\n| Column | Column |\n|--------|--------|\n| Cell   | Cell   |\n' },
  { label: 'Quote',     text: '\n> Blockquote text\n' },
  { label: 'Image',     text: '\n![Alt text](https://)\n' },
  { label: 'Link',      text: '[text](https://)' },
  { label: '💡 Tip',    text: '\n> [!TIP]\n> \n' },
  { label: '📝 Note',   text: '\n> [!NOTE]\n> \n' },
  { label: '⚠ Warning', text: '\n> [!WARNING]\n> \n' },
  { label: '🚨 Danger', text: '\n> [!CAUTION]\n> \n' },
  { label: 'HR',        text: '\n---\n' },
] as const;

const PREVIEW_MODES: { mode: PreviewMode; Icon: React.ElementType; label: string }[] = [
  { mode: 'edit',    Icon: AlignLeft, label: 'Edit'    },
  { mode: 'live',    Icon: Columns2,  label: 'Split'   },
  { mode: 'preview', Icon: Eye,       label: 'Preview' },
];

// ─── Full-screen editor overlay ───────────────────────────────────────────────
function NoteEditorOverlay({
  draft,
  onDraftChange,
  onSave,
  onClose,
}: {
  draft: Note;
  onDraftChange: (n: Note) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>('edit');
  const isDark = useIsDark();

  const words   = countWords(draft.bodyMd);
  const reading = calcReading(draft.bodyMd);

  const insert = (text: string) =>
    onDraftChange({ ...draft, bodyMd: (draft.bodyMd ?? '') + text });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950"
      role="dialog"
      aria-modal="true"
      aria-label="Note editor"
    >
      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-5 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close editor"
            className="inline-flex h-7 w-7 items-center justify-center border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-900 hover:text-zinc-900 dark:hover:border-zinc-100 dark:hover:text-zinc-100 transition-colors duration-150"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <span className="font-heading text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 max-w-[260px] truncate">
            {draft.title || 'Untitled note'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Preview mode toggle */}
          <div className="hidden items-center border border-zinc-200 dark:border-zinc-800 sm:flex">
            {PREVIEW_MODES.map(({ mode, Icon, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPreviewMode(mode)}
                aria-label={label}
                title={label}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5',
                  'font-mono text-[9px] uppercase tracking-widest',
                  'transition-colors duration-150 border-r border-zinc-200 dark:border-zinc-800 last:border-0',
                  previewMode === mode
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                    : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300',
                ].join(' ')}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>

          <Button variant="primary" onClick={onSave}>
            Publish
          </Button>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── SIDEBAR — metadata ──────────────────────────────────────── */}
        <aside className="hidden w-72 shrink-0 flex-col gap-5 overflow-y-auto border-r border-zinc-200 dark:border-zinc-800 p-5 lg:flex [&::-webkit-scrollbar]:hidden">
          <TextField
            label="Title *"
            value={draft.title}
            onChange={v => onDraftChange({ ...draft, title: v })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label="Date"
              value={draft.date}
              onChange={v => onDraftChange({ ...draft, date: v })}
            />
            <TextField
              label="Reading time"
              value={draft.reading}
              onChange={v => onDraftChange({ ...draft, reading: v })}
              placeholder={reading || '5 min'}
              hint="Auto from word count"
            />
          </div>
          <TextField
            label="Slug"
            value={draft.slug}
            onChange={v => onDraftChange({ ...draft, slug: v })}
            placeholder={autoSlug(draft.title) || 'my-note-title'}
            hint="Leave blank to auto-generate"
          />
          <TextField
            label="Excerpt"
            value={draft.excerpt}
            onChange={v => onDraftChange({ ...draft, excerpt: v })}
            textarea
            rows={3}
            placeholder="One-line summary shown in the blog grid…"
          />
          <TextField
            label="Cover image URL"
            value={draft.cover ?? ''}
            onChange={v => onDraftChange({ ...draft, cover: v })}
            placeholder="https://…"
          />
          {draft.cover && (
            <div className="relative aspect-video w-full overflow-hidden border border-zinc-200 dark:border-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={draft.cover} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <ArrayField
            label="Tags (comma-separated)"
            value={draft.tags ?? []}
            onChange={v => onDraftChange({ ...draft, tags: v })}
            separator="comma"
            placeholder="engineering, saas, iot"
          />
          <LanguageField
            value={draft.language ?? 'en'}
            onChange={v => onDraftChange({ ...draft, language: v })}
          />
        </aside>

        {/* ── EDITOR AREA ─────────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Snippet toolbar */}
          <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 [&::-webkit-scrollbar]:hidden">
            <span className="mr-2 shrink-0 font-mono text-[8px] uppercase tracking-widest text-zinc-300 dark:text-zinc-700">
              Insert
            </span>
            {SNIPPETS.map(({ label, text }) => (
              <button
                key={label}
                type="button"
                onClick={() => insert(text)}
                className="shrink-0 border border-zinc-200 dark:border-zinc-800 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-zinc-500 hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150 whitespace-nowrap"
              >
                {label}
              </button>
            ))}
          </div>

          {/* MDEditor */}
          <div
            data-color-mode={isDark ? 'dark' : 'light'}
            className="flex-1 overflow-hidden [&_.w-md-editor]:h-full [&_.w-md-editor]:border-0 [&_.w-md-editor]:shadow-none"
          >
            <MDEditor
              value={draft.bodyMd ?? ''}
              onChange={v => onDraftChange({ ...draft, bodyMd: v ?? '' })}
              preview={previewMode}
              height="100%"
              visibleDragbar={false}
              style={{ height: '100%' }}
            />
          </div>

          {/* Status bar */}
          <div className="flex shrink-0 items-center justify-between border-t border-zinc-200 dark:border-zinc-800 px-4 py-2">
            <div className="flex items-center gap-4">
              <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                {words.toLocaleString()} words
              </span>
              {words > 0 && (
                <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                  ~{reading} read
                </span>
              )}
            </div>
            {/* Mobile meta toggle shortcut hint */}
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-300 dark:text-zinc-700 lg:hidden">
              Scroll up for metadata
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Note card ────────────────────────────────────────────────────────────────
function NoteCard({
  note,
  onEdit,
  onDelete,
}: {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="group relative border border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100 transition-colors duration-150"
    >
      {/* Cover */}
      <div className="relative aspect-video w-full overflow-hidden border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        {note.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={note.cover}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-200 dark:text-zinc-800">
            <FileText className="h-8 w-8" />
          </div>
        )}
        {note.reading && (
          <span className="absolute right-2 top-2 border border-zinc-200/80 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            {note.reading}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-4">
        <time className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
          {note.date || '—'}
        </time>
        <h3 className="font-heading text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 line-clamp-2 leading-snug">
          {note.title || 'Untitled'}
        </h3>
        {note.excerpt && (
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {note.excerpt}
          </p>
        )}
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {note.tags.slice(0, 4).map(tag => (
              <span
                key={tag}
                className="border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-900 px-4 py-3">
        <Button variant="danger" size="sm" onClick={onDelete}>Del</Button>
        <Button variant="secondary" size="sm" onClick={onEdit}>Edit →</Button>
      </div>

      {/* Hover accent */}
      <span aria-hidden className="absolute left-0 top-0 h-0 w-[2px] bg-[#2467AC] transition-[height] duration-300 group-hover:h-full" />
    </motion.article>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function NotesEditor({
  value,
  onChange,
}: {
  value: Note[];
  onChange: (n: Note[]) => void;
}) {
  const [draft, setDraft]   = useState<Note | null>(null);
  const [query, setQuery]   = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return value;
    return value.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.excerpt?.toLowerCase().includes(q) ||
      n.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [value, query]);

  const newNote = () =>
    setDraft({
      id: uid(), slug: '', title: '', excerpt: '', cover: '',
      date: new Date().toISOString().split('T')[0],
      reading: '', tags: [], bodyMd: '', language: 'en',
    });

  const save = () => {
    if (!draft || !draft.title.trim()) return;
    const slug    = draft.slug || autoSlug(draft.title);
    const reading = draft.reading || calcReading(draft.bodyMd);
    const item    = { ...draft, slug, reading };
    const exists  = value.find(p => p.id === item.id);
    onChange(exists ? value.map(p => p.id === item.id ? item : p) : [item, ...value]);
    setDraft(null);
  };

  const remove = (id: string) => {
    if (confirm('Delete this note?')) onChange(value.filter(n => n.id !== id));
  };

  return (
    <>
      {/* ── Section header ───────────────────────────────────────────────── */}
      <Rule />
      <div className="flex items-center justify-between py-4">
        <div className="flex items-baseline gap-3">
          <h2 className="font-heading text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
            Notes
          </h2>
          <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
            ({value.length})
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search notes…"
              className="w-48 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-8 pr-3 py-1.5 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={newNote}
            className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Write note →
          </button>
        </div>
      </div>
      <Rule />

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* New note card */}
        <button
          type="button"
          onClick={newNote}
          className="group flex h-full min-h-[200px] flex-col items-center justify-center gap-3 border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-100 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors duration-150"
        >
          <div className="flex h-8 w-8 items-center justify-center border border-zinc-300 dark:border-zinc-700 group-hover:border-zinc-700 dark:group-hover:border-zinc-400 transition-colors">
            <Plus className="h-4 w-4" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest">Write Note</span>
        </button>

        <AnimatePresence mode="popLayout">
          {filtered.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={() => setDraft({ ...note })}
              onDelete={() => remove(note.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && query && (
        <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
          No notes match "{query}"
        </p>
      )}

      {/* ── Full-screen editor overlay ────────────────────────────────────── */}
      <AnimatePresence>
        {draft && (
          <NoteEditorOverlay
            draft={draft}
            onDraftChange={setDraft}
            onSave={save}
            onClose={() => setDraft(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}