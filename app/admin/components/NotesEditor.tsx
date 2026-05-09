'use client';
// app/admin/components/NotesEditor.tsx

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Note } from '../types';
import {
  TextField, uid, EditorDrawer, Button, Rule, useIsDark,
} from './atoms';
import { ArrayField } from './ArrayField';

import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

const EXPO = [0.16, 1, 0.3, 1] as const;

function calcReading(md?: string): string {
  if (!md) return '';
  const words = md.trim().split(/\s+/).length;
  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

function SnippetBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-zinc-400 hover:border-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors duration-150"
    >
      {label}
    </button>
  );
}

export default function NotesEditor({
  value,
  onChange,
}: {
  value: Note[];
  onChange: (n: Note[]) => void;
}) {
  const [draft, setDraft] = useState<Note | null>(null);
  const isDark = useIsDark();

  const newNote = () =>
    setDraft({
      id: uid(), slug: '', title: '', excerpt: '', cover: '',
      date: new Date().toISOString().split('T')[0],
      reading: '', tags: [], bodyMd: '',
    });

  const save = () => {
    if (!draft || !draft.title.trim()) return;
    const slug    = draft.slug || draft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const reading = draft.reading || calcReading(draft.bodyMd);
    const item    = { ...draft, slug, reading };
    const exists  = value.find(p => p.id === item.id);
    const next    = exists ? value.map(p => p.id === item.id ? item : p) : [item, ...value];
    onChange(next);
    setDraft(null);
  };

  const remove = (id: string) => {
    if (confirm('Delete this note?')) onChange(value.filter(n => n.id !== id));
  };

  const insertSnippet = (snippet: string) => {
    if (!draft) return;
    setDraft({ ...draft, bodyMd: (draft.bodyMd ?? '') + snippet });
  };

  return (
    <>
      <Rule />
      <div className="flex items-baseline justify-between py-4">
        <div className="flex items-baseline gap-3">
          <h2 className="font-heading text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
            Notes
          </h2>
          <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">({value.length})</span>
        </div>
        <button
          type="button"
          onClick={newNote}
          className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          Write note →
        </button>
      </div>
      <Rule />

      <motion.div
        layout
        className="mt-6 grid grid-cols-1 border-l border-t border-zinc-200 dark:border-zinc-800 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <button
          type="button"
          onClick={newNote}
          className="group flex h-48 flex-col items-center justify-center gap-3 border-b border-r border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors duration-150"
        >
          <div className="flex h-8 w-8 items-center justify-center border border-zinc-300 dark:border-zinc-700 group-hover:border-zinc-700 dark:group-hover:border-zinc-400 transition-colors">
            <Plus className="h-4 w-4" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest">Write Note</span>
        </button>

        <AnimatePresence mode="popLayout">
          {value.map(n => (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, ease: EXPO }}
              className="group relative border-b border-r border-zinc-200 dark:border-zinc-800"
            >
              <article className="flex h-full flex-col">
                <div className="relative h-28 w-full overflow-hidden border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
                  {n.cover ? (
                    <img src={n.cover} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-300 dark:text-zinc-700">
                      <FileText className="h-7 w-7" />
                    </div>
                  )}
                  <span className="absolute right-2 top-2 border border-zinc-200 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                    {n.reading || '—'}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <time className="mb-1 font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                    {n.date}
                  </time>
                  <h3 className="font-heading text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 line-clamp-2">
                    {n.title || 'Untitled'}
                  </h3>
                  <p className="mt-1 flex-1 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {n.excerpt}
                  </p>
                  {n.tags.length > 0 && (
                    <p className="mt-2 font-mono text-[9px] uppercase tracking-widest text-zinc-300 dark:text-zinc-700 truncate">
                      {n.tags.join(' · ')}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-900 pt-3">
                    <Button variant="danger"    size="sm" onClick={() => remove(n.id)}>Del</Button>
                    <Button variant="secondary" size="sm" onClick={() => setDraft({ ...n })}>Edit</Button>
                  </div>
                </div>
              </article>
              <span aria-hidden className="absolute left-0 top-0 h-0 w-[2px] bg-[#2467AC] transition-[height] duration-300 group-hover:h-full" />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <EditorDrawer
        isOpen={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.title || 'New Note'}
        actions={<Button variant="primary" onClick={save}>Publish</Button>}
      >
        {draft && (
          /* key={draft.id} resets ArrayField local state on new draft open */
          <div key={draft.id} className="space-y-5">
            <TextField
              label="Title"
              value={draft.title}
              onChange={v => setDraft({ ...draft, title: v })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Date (YYYY-MM-DD)"
                value={draft.date}
                onChange={v => setDraft({ ...draft, date: v })}
              />
              <TextField
                label="Slug (auto-generated)"
                value={draft.slug}
                onChange={v => setDraft({ ...draft, slug: v })}
                placeholder="my-note-title"
                hint="Leave blank to auto-generate"
              />
            </div>
            <TextField
              label="Excerpt"
              value={draft.excerpt}
              onChange={v => setDraft({ ...draft, excerpt: v })}
              textarea
              rows={2}
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Cover Image URL"
                value={draft.cover ?? ''}
                onChange={v => setDraft({ ...draft, cover: v })}
              />
              <TextField
                label="Reading time"
                value={draft.reading}
                onChange={v => setDraft({ ...draft, reading: v })}
                placeholder={calcReading(draft.bodyMd) || '5 min read'}
                hint="Leave blank to auto-calculate"
              />
            </div>

            {/*
              ArrayField (comma) — tags.
              Previously: onChange={v => setDraft({...draft, tags: splitComma(v)})}
              Bug: the trailing comma was stripped on every keystroke, making it
              impossible to type "engineering, " before the next tag.
            */}
            <ArrayField
              label="Tags (comma-separated)"
              value={draft.tags ?? []}
              onChange={v => setDraft({ ...draft, tags: v })}
              separator="comma"
              placeholder="engineering, saas, iot"
            />

            <Rule />

            {/* Markdown editor */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
                  Content
                </span>
                <div className="flex gap-1">
                  <SnippetBtn label="+ Img"     onClick={() => insertSnippet('\n![Alt](url)\n')} />
                  <SnippetBtn label="+ Code"    onClick={() => insertSnippet('\n```tsx\n\n```\n')} />
                  <SnippetBtn label="+ Callout" onClick={() => insertSnippet('\n> [!NOTE]\n> \n')} />
                </div>
              </div>
              <div
                data-color-mode={isDark ? 'dark' : 'light'}
                className="border border-zinc-200 dark:border-zinc-800 overflow-hidden"
              >
                <MDEditor
                  value={draft.bodyMd ?? ''}
                  onChange={v => setDraft({ ...draft, bodyMd: v ?? '' })}
                  height={380}
                  preview="edit"
                  visibleDragbar={false}
                />
              </div>
              {draft.bodyMd && (
                <p className="mt-1 text-right font-mono text-[9px] text-zinc-400 dark:text-zinc-600">
                  ~{calcReading(draft.bodyMd)}
                </p>
              )}
            </div>
          </div>
        )}
      </EditorDrawer>
    </>
  );
}