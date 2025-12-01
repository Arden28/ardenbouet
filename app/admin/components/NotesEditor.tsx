'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Plus, Trash2, Calendar, Clock, FileText, Image as ImageIcon } from 'lucide-react';
import type { Note } from '../types'; 
import { TextField, uid, splitComma, EditorDrawer, Button, useIsDark } from './atoms';

// Dynamic import for the markdown editor to avoid hydration issues
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

export default function NotesEditor({ value, onChange }: { value: Note[]; onChange: (n: Note[]) => void }) {
  const [draft, setDraft] = useState<Note | null>(null);
  const isDark = useIsDark();

  const save = () => {
    if (!draft || !draft.title.trim()) return;
    
    // Auto-slug and Reading Time logic
    const slug = draft.slug || draft.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    let reading = draft.reading;
    if (!reading && draft.bodyMd) {
        const words = draft.bodyMd.trim().split(/\s+/).length;
        reading = `${Math.ceil(words / 200)} min read`;
    }

    const item = { ...draft, slug, reading };
    const exists = value.find(p => p.id === item.id);
    const next = exists ? value.map(p => (p.id === item.id ? item : p)) : [item, ...value];
    onChange(next);
    setDraft(null);
  };

  const remove = (id: string) => { if (confirm('Delete note?')) onChange(value.filter(n => n.id !== id)); };

  const insertSnippet = (snippet: string) => {
    if (!draft) return;
    setDraft({ ...draft, bodyMd: (draft.bodyMd || '') + snippet });
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button onClick={() => setDraft({ id: uid(), slug: '', title: '', excerpt: '', cover: '', date: new Date().toISOString().split('T')[0], reading: '', tags: [], bodyMd: '' })} className="group flex h-48 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 transition-colors hover:border-[color:var(--brand)] hover:bg-[color:var(--brand)]/5 hover:text-[color:var(--brand)] dark:border-zinc-700 dark:bg-zinc-900/50">
          <div className="rounded-full bg-white p-3 shadow-sm transition-transform group-hover:scale-110 dark:bg-zinc-800"><Plus className="h-6 w-6" /></div>
          <span className="text-sm font-medium">Write Note</span>
        </button>

        {value.map((n) => (
          <div key={n.id} className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
            <div className="h-32 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
                {n.cover ? (
                    <img src={n.cover} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                    <div className="flex h-full items-center justify-center text-zinc-300"><FileText className="h-8 w-8" /></div>
                )}
                <div className="absolute top-2 right-2 bg-black/50 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded-full">{n.reading || '1 min'}</div>
            </div>
            <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 mb-2">{n.title}</h3>
                <p className="text-xs text-zinc-500 line-clamp-2 mb-4 flex-1">{n.excerpt}</p>
                
                <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
                     <span className="text-[10px] text-zinc-400 font-mono">{n.date}</span>
                     <div className="flex gap-2">
                        <Button variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => remove(n.id)}><Trash2 className="h-3 w-3" /></Button>
                        <Button variant="secondary" className="h-7 px-2 text-xs" onClick={() => setDraft({ ...n })}>Edit</Button>
                     </div>
                </div>
            </div>
          </div>
        ))}
      </div>

      <EditorDrawer isOpen={!!draft} onClose={() => setDraft(null)} title="Edit Note" actions={<Button variant="primary" onClick={save}>Save</Button>}>
        {draft && (
            <div className="space-y-6">
                 <TextField label="Title" value={draft.title} onChange={v => setDraft({...draft, title: v})} required />
                 <div className="grid grid-cols-2 gap-4">
                     <TextField label="Date (YYYY-MM-DD)" value={draft.date} onChange={v => setDraft({...draft, date: v})} />
                     <TextField label="Slug (Optional)" value={draft.slug} onChange={v => setDraft({...draft, slug: v})} placeholder="auto-generated" />
                 </div>
                 <TextField label="Excerpt" value={draft.excerpt} onChange={v => setDraft({...draft, excerpt: v})} textarea />
                 <TextField label="Cover Image URL" value={draft.cover || ''} onChange={v => setDraft({...draft, cover: v})} />
                 <TextField label="Tags (comma sep)" value={draft.tags?.join(', ') || ''} onChange={v => setDraft({...draft, tags: splitComma(v)})} />

                 {/* Markdown Editor Section */}
                 <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Content</span>
                        <div className="flex gap-1">
                            <button onClick={() => insertSnippet('\n![Alt](url)\n')} className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded hover:bg-zinc-200">+ Img</button>
                            <button onClick={() => insertSnippet('\n```tsx\n\n```\n')} className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded hover:bg-zinc-200">+ Code</button>
                            <button onClick={() => insertSnippet('\n> [!NOTE]\n> \n')} className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded hover:bg-zinc-200">+ Callout</button>
                        </div>
                    </div>
                    <div data-color-mode={isDark ? 'dark' : 'light'} className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                        <MDEditor
                            value={draft.bodyMd || ''}
                            onChange={(v) => setDraft({ ...draft, bodyMd: v || '' })}
                            height={400}
                            preview="edit"
                            visibleDragbar={false}
                        />
                    </div>
                 </div>
            </div>
        )}
      </EditorDrawer>
    </>
  );
}