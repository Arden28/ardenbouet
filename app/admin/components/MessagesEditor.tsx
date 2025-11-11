'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { Message } from '../types';
import { Chip, TextField, uid, splitComma, useIsDark } from './atoms';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

export default function MessagesEditor({ value, onChange }: { value: Message[]; onChange: (m: Message[]) => void }) {
  const empty: Message = {
    id: uid(),
    date: new Date().toISOString().slice(0, 10),
    fromName: '',
    fromEmail: '',
    subject: '',
    tags: [],
    status: 'unread',
    bodyMd: '',
  };

  const [draft, setDraft] = useState<Message>(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [tagsText, setTagsText] = useState('');
  const isDark = useIsDark();

  const startNew = () => { setDraft({ ...empty, id: uid() }); setTagsText(''); setEditId(null); };
  const startEdit = (id: string) => {
    const m = value.find(v => v.id === id); if (!m) return;
    setDraft(JSON.parse(JSON.stringify(m)));
    setTagsText((m.tags || []).join(', '));
    setEditId(id);
  };

  const save = () => {
    const item: Message = {
      ...draft,
      tags: splitComma(tagsText),
      status: draft.status || 'unread',
      date: draft.date || new Date().toISOString().slice(0,10),
    };
    if (!item.subject.trim()) return;
    if (editId) onChange(value.map(v => (v.id === editId ? item : v)));
    else onChange([item, ...value]);
    startNew();
  };

  const del  = (id: string) => onChange(value.filter(v => v.id !== id));
  const move = (id: string, dir: -1 | 1) => {
    const i = value.findIndex(v => v.id === id); if (i < 0) return;
    const j = i + dir; if (j < 0 || j >= value.length) return;
    const clone = [...value]; const [it] = clone.splice(i, 1); clone.splice(j, 0, it); onChange(clone);
  };

  const toggleStatus = () => {
    const order: Message['status'][] = ['unread','read','archived'];
    const next = order[(order.indexOf(draft.status) + 1) % order.length];
    setDraft({ ...draft, status: next });
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
      <div className="md:col-span-2 reel-frame grain p-4">
        <h3 className="text-sm font-semibold">Message Editor</h3>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <TextField label="Date (ISO)" value={draft.date} onChange={v => setDraft({ ...draft, date: v })} placeholder="2025-11-11" />
          <TextField label="From Name" value={draft.fromName || ''} onChange={v => setDraft({ ...draft, fromName: v })} />
          <TextField label="From Email" value={draft.fromEmail || ''} onChange={v => setDraft({ ...draft, fromEmail: v })} />
          <TextField label="Subject" value={draft.subject} onChange={v => setDraft({ ...draft, subject: v })} required />
          <TextField label="Tags (comma)" value={tagsText} onChange={setTagsText} placeholder="lead, client, press" />

          <label className="block">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Status</span>
            <div className="mt-1 flex gap-2">
              <Chip active={draft.status === 'unread'}  onClick={() => setDraft({ ...draft, status: 'unread'  })}>unread</Chip>
              <Chip active={draft.status === 'read'}    onClick={() => setDraft({ ...draft, status: 'read'    })}>read</Chip>
              <Chip active={draft.status === 'archived'}onClick={() => setDraft({ ...draft, status: 'archived'})}>archived</Chip>
              <button className="rounded border px-2 py-1 text-xs" onClick={toggleStatus}>Cycle</button>
            </div>
          </label>

          <div className="mt-2">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Body (Markdown)</span>
            <div
              data-color-mode={isDark ? 'dark' : 'light'}
              className="mt-2 rounded-lg border border-zinc-200/70 bg-white/80 shadow-sm backdrop-blur dark:border-zinc-700/50 dark:bg-zinc-900/70"
            >
              <MDEditor
                value={draft.bodyMd}
                onChange={(v) => setDraft({ ...draft, bodyMd: v || '' })}
                height={300}
                preview="live"
                visibleDragbar={false}
                textareaProps={{ placeholder: 'Type your message in Markdown…' }}
                overflow
              />
            </div>
          </div>

          <div className="mt-2 flex gap-2">
            <button onClick={save} className="rounded-md bg-[color:var(--brand)] px-3 py-2 text-sm font-semibold text-white hover:opacity-95">
              {editId ? 'Update' : 'Add message'}
            </button>
            <button onClick={startNew} className="rounded-md border px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300">Reset form</button>
          </div>
        </div>
      </div>

      <div className="md:col-span-3 reel-frame grain p-4">
        <h3 className="text-sm font-semibold">Messages ({value.length})</h3>
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {value.map(m => (
            <li key={m.id} className="rounded-lg border border-zinc-200/70 p-3 text-sm dark:border-zinc-700/50">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{m.subject || <em>No subject</em>}</div>
                  <div className="text-xs text-zinc-500">
                    {m.date} • {m.fromName || m.fromEmail || '—'} • {m.status}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => move(m.id, -1)} className="rounded border px-2 py-1">↑</button>
                  <button onClick={() => move(m.id, 1)}  className="rounded border px-2 py-1">↓</button>
                  <button onClick={() => startEdit(m.id)} className="rounded border px-2 py-1">Edit</button>
                  <button onClick={() => del(m.id)} className="rounded border px-2 py-1 text-red-600">Del</button>
                </div>
              </div>
              {!!m.tags?.length && (
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {m.tags.map((t, i) => (
                    <span key={i} className="rounded-full border px-2 py-[2px] text-[11px] text-zinc-700 dark:text-zinc-300">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {m.bodyMd && (
                <div className="mt-2 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
                  {m.bodyMd.replace(/\s+/g,' ').slice(0,180)}{m.bodyMd.length>180?'…':''}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
