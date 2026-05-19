'use client';
// app/admin/components/NotesEditor.tsx

import { useState, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { createLowlight, common } from 'lowlight';
import { Markdown } from 'tiptap-markdown';
import type { Editor } from '@tiptap/core';
import 'highlight.js/styles/atom-one-dark.css';
import {
  Plus, FileText, Search, X,
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  Quote, Terminal, Link2, Minus, Undo2, Redo2,
  Image as ImageIcon, Table2, RowsIcon, Columns3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Note } from '../types';
import { TextField, MediaPickerField, uid, Button, Rule, cn, LanguageField } from './atoms';
import { ArrayField } from './ArrayField';

const lowlight = createLowlight(common);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function calcReading(text: string): string {
  if (!text) return '';
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 200))} min`;
}

function autoSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

// ─── Tiptap toolbar ──────────────────────────────────────────────────────────
function ToolbarBtn({
  onClick, active, title, children,
}: {
  onClick: () => void; active?: boolean; title?: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center transition-colors duration-100 focus-visible:outline-none',
        active
          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
          : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100',
      )}
    >
      {children}
    </button>
  );
}

function ToolbarSep() {
  return <span className="mx-0.5 h-4 w-px shrink-0 bg-zinc-200 dark:bg-zinc-700" />;
}

function EditorToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL:', prev ?? 'https://');
    if (url === null) return;
    if (url === '') { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  };

  const insertImage = () => {
    const url = window.prompt('Image URL:');
    if (!url) return;
    const alt = window.prompt('Alt text (optional):') ?? '';
    editor.chain().focus().setImage({ src: url, alt }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 shrink-0 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-2 py-1.5">
      <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (⌘B)">
        <Bold className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (⌘I)">
        <Italic className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
        <Code className="h-3.5 w-3.5" />
      </ToolbarBtn>

      <ToolbarSep />

      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
        <span className="font-mono text-[10px] font-bold leading-none">H2</span>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
        <span className="font-mono text-[10px] font-bold leading-none">H3</span>
      </ToolbarBtn>

      <ToolbarSep />

      <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
        <List className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarBtn>

      <ToolbarSep />

      <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
        <Quote className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
        <Terminal className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={setLink} active={editor.isActive('link')} title="Link">
        <Link2 className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
        <Minus className="h-3.5 w-3.5" />
      </ToolbarBtn>

      <ToolbarSep />

      <ToolbarBtn onClick={insertImage} title="Insert image">
        <ImageIcon className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={insertTable} active={editor.isActive('table')} title="Insert table">
        <Table2 className="h-3.5 w-3.5" />
      </ToolbarBtn>

      {/* Table row/column controls — only visible when cursor is inside a table */}
      {editor.isActive('table') && (
        <>
          <ToolbarSep />
          <ToolbarBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="Add row below">
            <RowsIcon className="h-3.5 w-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add column right">
            <Columns3 className="h-3.5 w-3.5" />
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().deleteRow().run()} title="Delete row">
            <span className="font-mono text-[9px] font-bold leading-none">-R</span>
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete column">
            <span className="font-mono text-[9px] font-bold leading-none">-C</span>
          </ToolbarBtn>
          <ToolbarBtn onClick={() => editor.chain().focus().deleteTable().run()} title="Delete table">
            <span className="font-mono text-[9px] font-bold leading-none text-red-500">Del</span>
          </ToolbarBtn>
        </>
      )}

      <ToolbarSep />

      <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Undo (⌘Z)">
        <Undo2 className="h-3.5 w-3.5" />
      </ToolbarBtn>
      <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Redo (⌘⇧Z)">
        <Redo2 className="h-3.5 w-3.5" />
      </ToolbarBtn>
    </div>
  );
}

// ─── Tiptap editor ───────────────────────────────────────────────────────────
function TiptapEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder: 'Start writing your note…' }),
      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer' },
      }),
      ImageExtension.configure({ inline: false, allowBase64: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({ lowlight }),
      Markdown.configure({ html: false, tightLists: true }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onChange((editor.storage as any).markdown.getMarkdown());
    },
  });

  const words = editor?.getText().trim().split(/\s+/).filter(Boolean).length ?? 0;
  const readingTime = words > 0 ? `~${Math.max(1, Math.ceil(words / 200))} min read` : '';

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <EditorToolbar editor={editor} />

      <EditorContent
        editor={editor}
        className="tiptap-prose flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden"
      />

      {/* Status bar */}
      <div className="flex shrink-0 items-center justify-between border-t border-zinc-200 dark:border-zinc-800 px-4 py-2">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            {words.toLocaleString()} words
          </span>
          {readingTime && (
            <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
              {readingTime}
            </span>
          )}
        </div>
        <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-300 dark:text-zinc-700 lg:hidden">
          Scroll up for metadata
        </span>
      </div>
    </div>
  );
}

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
        <Button variant="primary" onClick={onSave}>Publish</Button>
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
              placeholder={calcReading(draft.bodyMd ?? '') || '5 min'}
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
          <MediaPickerField
            label="Cover image"
            value={draft.cover ?? ''}
            onChange={v => onDraftChange({ ...draft, cover: v })}
            accept="image/*"
          />
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

        {/* ── EDITOR ──────────────────────────────────────────────────── */}
        <TiptapEditor
          key={draft.id}
          value={draft.bodyMd ?? ''}
          onChange={v => onDraftChange({ ...draft, bodyMd: v })}
        />
      </div>
    </motion.div>
  );
}

// ─── Note card ────────────────────────────────────────────────────────────────
function NoteCard({ note, onEdit, onDelete }: { note: Note; onEdit: () => void; onDelete: () => void }) {
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

      <span aria-hidden className="absolute left-0 top-0 h-0 w-[2px] bg-[#2467AC] transition-[height] duration-300 group-hover:h-full" />
    </motion.article>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function NotesEditor({ value, onChange }: { value: Note[]; onChange: (n: Note[]) => void }) {
  const [draft, setDraft] = useState<Note | null>(null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return value;
    return value.filter(n =>
      n.title.toLowerCase().includes(q) ||
      n.excerpt?.toLowerCase().includes(q) ||
      n.tags.some(t => t.toLowerCase().includes(q)),
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
    const text    = draft.bodyMd ?? '';
    const reading = draft.reading || calcReading(text);
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
      <Rule />
      <div className="flex items-center justify-between py-4">
        <div className="flex items-baseline gap-3">
          <h2 className="font-heading text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
            Notes
          </h2>
          <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">({value.length})</span>
        </div>
        <div className="flex items-center gap-3">
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

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          No notes match &quot;{query}&quot;
        </p>
      )}

      <AnimatePresence>
        {draft && (
          <NoteEditorOverlay
            key={draft.id}
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
