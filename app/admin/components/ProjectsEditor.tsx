'use client';
// app/admin/components/ProjectsEditor.tsx

import { useState } from 'react';
import { Plus, Trash2, MoveUp, MoveDown, Hash, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Project, CaseImage } from '../types';
import {
  TextField, uid, EditorDrawer, Button, Chip, Rule, cn, LanguageField, MediaPickerField,
} from './atoms';
import { ArrayField } from './ArrayField';

const EXPO = [0.16, 1, 0.3, 1] as const;

// ─── Token input (tag chips, intentional Enter/comma commit) ──────────────────
// This component correctly uses onKeyDown to commit chips — it is NOT affected
// by the same bug as the plain textarea fields.
function TokenInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (t: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const commit = () => {
    const v = input.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setInput('');
  };

  return (
    <div>
      <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
        {label}
      </span>
      <div className="flex min-h-[42px] flex-wrap gap-1.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2">
        {value.map(t => (
          <span
            key={t}
            className="inline-flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-600 dark:text-zinc-400"
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(value.filter(x => x !== t))}
              className="text-zinc-400 hover:text-red-500 transition-colors"
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="min-w-[100px] flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
          placeholder={placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(); }
          }}
          onBlur={commit}
        />
      </div>
    </div>
  );
}

// ─── Images manager ───────────────────────────────────────────────────────────
function ImagesManager({
  images,
  onChange,
}: {
  images: CaseImage[];
  onChange: (imgs: CaseImage[]) => void;
}) {
  const add    = () => onChange([...images, { src: '', alt: '' }]);
  const update = (i: number, field: keyof CaseImage, val: string) => {
    const next = [...images]; next[i] = { ...next[i], [field]: val }; onChange(next);
  };
  const remove = (i: number) => onChange(images.filter((_, idx) => idx !== i));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
          Gallery Images
        </span>
        <Button variant="secondary" size="sm" onClick={add}>+ Add</Button>
      </div>
      {images.length === 0 && (
        <p className="font-mono text-[9px] text-zinc-400 dark:text-zinc-600">No images.</p>
      )}
      <div className="space-y-2">
        {images.map((img, i) => (
          <div
            key={i}
            className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                Image {i + 1}
              </span>
              <button type="button" onClick={() => remove(i)} className="text-zinc-400 hover:text-red-500 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <MediaPickerField
              label="Image URL"
              value={img.src}
              onChange={v => update(i, 'src', v)}
              accept="image/*"
              placeholder="https://…"
            />
            <input
              className="w-full bg-transparent text-xs text-zinc-600 dark:text-zinc-400 outline-none placeholder:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 pb-1"
              placeholder="Alt description"
              value={img.alt}
              onChange={e => update(i, 'alt', e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProjectsEditor({
  value,
  onChange,
}: {
  value: Project[];
  onChange: (p: Project[]) => void;
}) {
  const [draft, setDraft] = useState<Project | null>(null);

  const newProject = () =>
    setDraft({ id: uid(), title: '', description: '', logoUrl: '', url: '', tags: [], tech: [], language: 'en' });

  const save = () => {
    if (!draft || !draft.title.trim()) return;
    const exists = value.find(p => p.id === draft.id);
    const next   = exists
      ? value.map(p => p.id === draft.id ? draft : p)
      : [draft, ...value];
    onChange(next);
    setDraft(null);
  };

  const remove = (id: string) => {
    if (confirm('Delete this project?')) onChange(value.filter(p => p.id !== id));
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = value.findIndex(p => p.id === id);
    if (idx < 0 || idx + dir < 0 || idx + dir >= value.length) return;
    const next = [...value];
    [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
    onChange(next);
  };

  return (
    <>
      <Rule />
      <div className="flex items-baseline justify-between py-4">
        <div className="flex items-baseline gap-3">
          <h2 className="font-heading text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
            Projects
          </h2>
          <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
            ({value.length})
          </span>
        </div>
        <button
          type="button"
          onClick={newProject}
          className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          New project →
        </button>
      </div>
      <Rule />

      <motion.div
        layout
        className="mt-6 grid grid-cols-1 border-l border-t border-zinc-200 dark:border-zinc-800 sm:grid-cols-2 xl:grid-cols-3"
      >
        {/* Add new */}
        <button
          type="button"
          onClick={newProject}
          className="group flex h-48 flex-col items-center justify-center gap-3 border-b border-r border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors duration-150"
        >
          <div className="flex h-8 w-8 items-center justify-center border border-zinc-300 dark:border-zinc-700 group-hover:border-zinc-700 dark:group-hover:border-zinc-400 transition-colors">
            <Plus className="h-4 w-4" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest">New Project</span>
        </button>

        <AnimatePresence mode="popLayout">
          {value.map(p => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, ease: EXPO }}
              className="group relative border-b border-r border-zinc-200 dark:border-zinc-800"
            >
              <article className="flex h-full flex-col p-5 transition-colors duration-150 hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40">
                <div className="mb-3 flex items-start gap-3">
                  {p.logoUrl ? (
                    <img src={p.logoUrl} alt="" className="h-9 w-9 shrink-0 border border-zinc-200 dark:border-zinc-800 object-contain bg-white dark:bg-zinc-900 p-1" />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
                      <span className="font-mono text-[9px] text-zinc-400">{p.title.slice(0, 2).toUpperCase() || '??'}</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
                      {p.title || 'Untitled'}
                    </h3>
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1 font-mono text-[9px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors truncate mt-0.5">
                        <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                        {p.url.replace(/^https?:\/\//, '').slice(0, 30)}
                      </a>
                    )}
                  </div>
                </div>
                <p className="flex-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {p.description || <span className="italic">No description.</span>}
                </p>
                {p.tech && p.tech.length > 0 && (
                  <p className="mt-2 font-mono text-[9px] uppercase tracking-widest text-zinc-300 dark:text-zinc-700">
                    {p.tech.slice(0, 4).join(' · ')}
                  </p>
                )}
                {p.caseFile && (
                  <div className="mt-2 inline-flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5">
                    <Hash className="h-3 w-3 text-zinc-400" />
                    <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-400">Case file</span>
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900 pt-3">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button type="button" onClick={() => move(p.id, -1)} className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                      <MoveUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => move(p.id, 1)} className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                      <MoveDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="danger"    size="sm" onClick={() => remove(p.id)}>Delete</Button>
                    <Button variant="secondary" size="sm" onClick={() => setDraft({ ...p })}>Edit</Button>
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
        title={draft?.title || 'New Project'}
        actions={<Button variant="primary" onClick={save}>Save</Button>}
      >
        {draft && (
          /*
            key={draft.id} resets all local ArrayField string states when
            a different draft is opened.
          */
          <div key={draft.id} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Title"
                value={draft.title}
                onChange={v => setDraft({ ...draft, title: v })}
                required
              />
              <TextField
                label="Live URL"
                value={draft.url}
                onChange={v => setDraft({ ...draft, url: v })}
                placeholder="https://…"
              />
            </div>

            <TextField
              label="Description"
              value={draft.description}
              onChange={v => setDraft({ ...draft, description: v })}
              textarea
              rows={3}
            />

            {/* Category tags — chip selector, no free-text parsing needed */}
            <div>
              <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
                Category Tags
              </span>
              <div className="flex flex-wrap gap-2">
                {(['saas', 'client', 'open-source', 'mobile', 'job'] as const).map(t => (
                  <Chip
                    key={t}
                    active={draft.tags.includes(t)}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        tags: draft.tags.includes(t)
                          ? draft.tags.filter(x => x !== t)
                          : [...draft.tags, t],
                      })
                    }
                  >
                    {t}
                  </Chip>
                ))}
              </div>
            </div>

            {/*
              ArrayField (comma) — tech stack.
              Previously: onChange={v => setDraft({...draft, tech: splitComma(v)})}
              Bug: splitComma ran on every keystroke, stripping the trailing comma
              before the user could finish typing the next technology.
            */}
            <ArrayField
              label="Tech Stack (comma-separated)"
              value={draft.tech ?? []}
              onChange={v => setDraft({ ...draft, tech: v })}
              separator="comma"
              placeholder="React, Next.js, Prisma…"
            />

            <MediaPickerField
              label="Logo URL"
              value={draft.logoUrl}
              onChange={v => setDraft({ ...draft, logoUrl: v })}
              accept="image/*"
            />
            <TextField
              label="Metric (e.g. 12k users)"
              value={(draft as any).metric ?? ''}
              onChange={v => setDraft({ ...draft, metric: v } as any)}
              placeholder="Optional"
            />

            <LanguageField
              value={draft.language ?? 'en'}
              onChange={v => setDraft({ ...draft, language: v })}
            />

            <Rule />

            {/* Case File */}
            <div>
              <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
                Case File
              </p>
              <div className="space-y-4 border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-900/30">
                <TextField
                  label="Problem"
                  value={draft.caseFile?.problem ?? ''}
                  onChange={v => setDraft({ ...draft, caseFile: { ...draft.caseFile!, problem: v } })}
                  textarea
                  rows={3}
                />

                {/*
                  ArrayField (line) — approach steps.
                  Previously: onChange called splitLines on each keystroke,
                  which filtered out empty lines immediately, preventing Enter.
                */}
                <ArrayField
                  label="Approach (one step per line)"
                  value={draft.caseFile?.approach ?? []}
                  onChange={v => setDraft({ ...draft, caseFile: { ...draft.caseFile!, approach: v } })}
                  separator="line"
                  rows={5}
                  placeholder="Used Redis for caching…"
                />

                <TextField
                  label="Result"
                  value={draft.caseFile?.result ?? ''}
                  onChange={v => setDraft({ ...draft, caseFile: { ...draft.caseFile!, result: v } })}
                  textarea
                  rows={3}
                />

                {/* TokenInput — intentional chip commit on Enter/comma (correct behaviour) */}
                <div className="grid grid-cols-2 gap-4">
                  <TokenInput
                    label="Case Tags"
                    value={draft.caseFile?.tags ?? []}
                    onChange={v => setDraft({ ...draft, caseFile: { ...draft.caseFile!, tags: v } })}
                    placeholder="ux, design…"
                  />
                  <TokenInput
                    label="Case Tech"
                    value={draft.caseFile?.tech ?? []}
                    onChange={v => setDraft({ ...draft, caseFile: { ...draft.caseFile!, tech: v } })}
                    placeholder="Figma, Stripe…"
                  />
                </div>

                <ImagesManager
                  images={draft.caseFile?.images ?? []}
                  onChange={imgs => setDraft({ ...draft, caseFile: { ...draft.caseFile!, images: imgs } })}
                />
              </div>
            </div>
          </div>
        )}
      </EditorDrawer>
    </>
  );
}