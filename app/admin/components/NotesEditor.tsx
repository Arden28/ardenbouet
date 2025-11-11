'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { Note } from '../types'; // or replace with your local Note type if not using types.ts
import { TextField, Chip, uid, splitComma, useIsDark } from './atoms';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

export default function NotesEditor({ value, onChange }: { value: Note[]; onChange: (n: Note[]) => void }) {
  const empty: Note = {
    id: uid(),
    slug: '',
    title: '',
    excerpt: '',
    cover: '',
    date: '',
    reading: '5 min',
    tags: [],
    bodyMd: '',
  };

  const [draft, setDraft] = useState<Note>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [tagsText, setTagsText] = useState('');
  const [previewMode, setPreviewMode] = useState<'edit' | 'live' | 'preview'>('edit');
  const isDark = useIsDark();

  const slugify = (input: string) =>
    (input ?? '')
      .toString()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);

  const startNew = () => {
    setDraft({ ...empty, id: uid() });
    setTagsText('');
    setPreviewMode('edit');
    setEditId(null);
  };

  const startEdit = (id: string) => {
    const n = value.find(v => v.id === id);
    if (!n) return;
    setDraft(JSON.parse(JSON.stringify(n)));
    setTagsText((n.tags || []).join(', '));
    setPreviewMode('edit');
    setEditId(id);
  };

  const save = () => {
    const item: Note = {
      ...draft,
      slug: draft.slug || slugify(draft.title),
      tags: splitComma(tagsText),
    };
    if (!item.title.trim()) return;

    // compute reading time if body present and reading empty
    if ((item.bodyMd?.trim()?.length ?? 0) > 0 && !item.reading?.trim()) {
      const words = item.bodyMd!.trim().split(/\s+/).length;
      item.reading = `${Math.max(1, Math.round(words / 200))} min`;
    }

    if (editId) onChange(value.map(v => (v.id === editId ? item : v)));
    else onChange([item, ...value]);
    startNew();
  };

  const del = (id: string) => onChange(value.filter(v => v.id !== id));

  const move = (id: string, dir: -1 | 1) => {
    const i = value.findIndex(v => v.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const clone = [...value];
    const [it] = clone.splice(i, 1);
    clone.splice(j, 0, it);
    onChange(clone);
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
      <div className="md:col-span-2 reel-frame grain p-4">
        <h3 className="text-sm font-semibold">Note Editor</h3>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <TextField label="Title" value={draft.title} onChange={v => setDraft({ ...draft, title: v })} required />
          <TextField label="Slug (auto if blank)" value={draft.slug} onChange={v => setDraft({ ...draft, slug: slugify(v) })} />
          <TextField label="Excerpt" value={draft.excerpt} onChange={v => setDraft({ ...draft, excerpt: v })} textarea />
          <TextField label="Cover URL" value={draft.cover || ''} onChange={v => setDraft({ ...draft, cover: v })} />
          <TextField label="Date (ISO)" value={draft.date} onChange={v => setDraft({ ...draft, date: v })} placeholder="2025-11-11" />
          <TextField label="Reading time" value={draft.reading} onChange={v => setDraft({ ...draft, reading: v })} placeholder="5 min" />
          <TextField label="Tags (comma)" value={tagsText} onChange={setTagsText} placeholder="saaS, devops" />

          {/* BODY (Markdown) */}
          <div className="mt-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Body (Markdown)</span>
            <div
              data-color-mode={isDark ? 'dark' : 'light'}
              className="mt-2 rounded-lg border border-zinc-200/70 bg-white/80 shadow-sm backdrop-blur dark:border-zinc-700/50 dark:bg-zinc-900/70"
            >
              <MDEditor
                value={draft.bodyMd || ''}
                onChange={(v) => setDraft({ ...draft, bodyMd: v || '' })}
                height={360}
                preview={previewMode}      // 'edit' | 'live' | 'preview'
                visibleDragbar={false}
                textareaProps={{ placeholder: 'Write your note in Markdown…' }}
                overflow
              />
            </div>

            {/* Editor actions */}
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <button className="rounded border px-2 py-1" onClick={() => setPreviewMode('edit')}>Edit</button>
              <button className="rounded border px-2 py-1" onClick={() => setPreviewMode('live')}>Live</button>
              <button className="rounded border px-2 py-1" onClick={() => setPreviewMode('preview')}>Preview</button>

              <button
                type="button"
                className="rounded border px-2 py-1"
                onClick={() => {
                  const md = (draft.bodyMd || '').trim();
                  const words = md ? md.split(/\s+/).length : 0;
                  const mins = Math.max(1, Math.round(words / 200));
                  setDraft({ ...draft, reading: `${mins} min` });
                }}
              >
                Auto reading time
              </button>

              <button
                type="button"
                className="rounded border px-2 py-1"
                onClick={() => {
                  if (!draft.excerpt?.trim()) {
                    const para = (draft.bodyMd || '').split(/\n\s*\n/)[0] || '';
                    setDraft({ ...draft, excerpt: para.slice(0, 240) });
                  }
                }}
              >
                Generate excerpt
              </button>

              <button
                type="button"
                className="rounded border px-2 py-1"
                title="Insert callout"
                onClick={() => {
                  const snippet = `\n> [!NOTE]\n> Your callout here.\n\n`;
                  setDraft((d) => ({ ...d, bodyMd: (d.bodyMd || '') + snippet }));
                }}
              >
                + Callout
              </button>

              <button
                type="button"
                className="rounded border px-2 py-1"
                title="Insert fenced code block"
                onClick={() => {
                  const snippet = `\n\`\`\`tsx\n// code here\n\`\`\`\n\n`;
                  setDraft((d) => ({ ...d, bodyMd: (d.bodyMd || '') + snippet }));
                }}
              >
                + Code block
              </button>

              <button
                type="button"
                className="rounded border px-2 py-1"
                title="Insert image"
                onClick={() => {
                  const snippet = `\n![alt text](https://.../image.png)\n\n`;
                  setDraft((d) => ({ ...d, bodyMd: (d.bodyMd || '') + snippet }));
                }}
              >
                + Image
              </button>

              <button
                type="button"
                className="rounded border px-2 py-1"
                title="Insert table"
                onClick={() => {
                  const snippet = `\n| Col A | Col B |\n|:-----:|:-----:|\n|  A1   |  B1   |\n|  A2   |  B2   |\n\n`;
                  setDraft((d) => ({ ...d, bodyMd: (d.bodyMd || '') + snippet }));
                }}
              >
                + Table
              </button>
            </div>
          </div>

          <div className="mt-2 flex gap-2">
            <button onClick={save} className="rounded-md bg-[color:var(--brand)] px-3 py-2 text-sm font-semibold text-white hover:opacity-95">
              {editId ? 'Update' : 'Add note'}
            </button>
            <button onClick={startNew} className="rounded-md border px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300">
              Reset form
            </button>
          </div>
        </div>
      </div>

      <div className="md:col-span-3 reel-frame grain p-4">
        <h3 className="text-sm font-semibold">Notes ({value.length})</h3>
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {value.map(n => (
            <li key={n.id} className="rounded-lg border border-zinc-200/70 p-3 text-sm dark:border-zinc-700/50">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{n.title || <em>Untitled</em>}</div>
                  <div className="text-xs text-zinc-500">{n.date} • {n.reading}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => move(n.id, -1)} className="rounded border px-2 py-1">↑</button>
                  <button onClick={() => move(n.id, 1)}  className="rounded border px-2 py-1">↓</button>
                  <button onClick={() => startEdit(n.id)} className="rounded border px-2 py-1">Edit</button>
                  <button onClick={() => del(n.id)} className="rounded border px-2 py-1 text-red-600">Del</button>
                </div>
              </div>
              <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{n.excerpt}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
