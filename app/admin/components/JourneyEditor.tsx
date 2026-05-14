'use client';
// app/admin/components/JourneyEditor.tsx

import { useState } from 'react';
import { Plus, MoveUp, MoveDown, GraduationCap, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { JourneyItem } from '../types';
import {
  TextField, SelectField, uid, EditorDrawer, Button, Rule, LanguageField,
} from './atoms';

const EXPO = [0.16, 1, 0.3, 1] as const;

export default function JourneyEditor({
  value,
  onChange,
}: {
  value: JourneyItem[];
  onChange: (j: JourneyItem[]) => void;
}) {
  const [draft, setDraft] = useState<JourneyItem | null>(null);

  const newItem = () =>
    setDraft({ id: uid(), kind: 'education', year: '', title: '', org: '', url: '', note: '', language: 'en' });

  const save = () => {
    if (!draft || !draft.title.trim()) return;
    const exists = value.find(p => p.id === draft.id);
    const next   = exists ? value.map(p => p.id === draft.id ? draft : p) : [draft, ...value];
    onChange(next);
    setDraft(null);
  };

  const remove = (id: string) => {
    if (confirm('Delete this entry?')) onChange(value.filter(j => j.id !== id));
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = value.findIndex(j => j.id === id);
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
            Journey
          </h2>
          <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">({value.length})</span>
        </div>
        <button
          type="button"
          onClick={newItem}
          className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          Add entry →
        </button>
      </div>
      <Rule />

      <ul className="mt-0">
        <AnimatePresence mode="popLayout">
          {value.map(j => (
            <motion.li
              key={j.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3, ease: EXPO }}
              className="group relative"
            >
              <div className="flex items-center gap-5 py-4 px-1 transition-colors duration-150 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40">

                {/* Kind icon */}
                <div
                  className={[
                    'shrink-0 flex h-8 w-8 items-center justify-center border',
                    j.kind === 'education'
                      ? 'border-zinc-200 dark:border-zinc-800 text-zinc-400'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-400',
                  ].join(' ')}
                >
                  {j.kind === 'education'
                    ? <GraduationCap className="h-3.5 w-3.5" />
                    : <Award className="h-3.5 w-3.5" />}
                </div>

                {/* Year */}
                <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 sm:block w-20">
                  {j.year}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
                    {j.title || 'Untitled'}
                  </h3>
                  {j.org && (
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 truncate">
                      {j.org}
                    </p>
                  )}
                </div>

                {/* Kind tag */}
                <span className="hidden shrink-0 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 sm:inline whitespace-nowrap">
                  {j.kind}
                </span>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button type="button" onClick={() => move(j.id, -1)} className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                    <MoveUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => move(j.id, 1)} className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                    <MoveDown className="h-3.5 w-3.5" />
                  </button>
                  <Button variant="danger"    size="sm" onClick={() => remove(j.id)}>Del</Button>
                  <Button variant="secondary" size="sm" onClick={() => setDraft({ ...j })}>Edit</Button>
                </div>
              </div>
              <Rule />

              <span aria-hidden className="absolute left-0 top-0 h-0 w-[2px] bg-[#2467AC] transition-[height] duration-300 group-hover:h-full" />
            </motion.li>
          ))}
        </AnimatePresence>

        {value.length === 0 && (
          <li className="py-12 text-center">
            <button
              type="button"
              onClick={newItem}
              className="inline-flex items-center gap-2 border border-dashed border-zinc-300 dark:border-zinc-700 px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:border-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add first entry
            </button>
          </li>
        )}
      </ul>

      <EditorDrawer
        isOpen={!!draft}
        onClose={() => setDraft(null)}
        title="Edit Journey Entry"
        actions={<Button variant="primary" onClick={save}>Save</Button>}
      >
        {draft && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Kind"
                value={draft.kind}
                onChange={v => setDraft({ ...draft, kind: v as any })}
                options={['education', 'cert']}
              />
              <TextField
                label="Year"
                value={draft.year}
                onChange={v => setDraft({ ...draft, year: v })}
                placeholder="2024"
              />
            </div>
            <TextField
              label="Title (degree / certification name)"
              value={draft.title}
              onChange={v => setDraft({ ...draft, title: v })}
              required
            />
            <TextField
              label="Organization"
              value={draft.org ?? ''}
              onChange={v => setDraft({ ...draft, org: v })}
              placeholder="University or platform"
            />
            <TextField
              label="Credential URL"
              value={draft.url ?? ''}
              onChange={v => setDraft({ ...draft, url: v })}
            />
            <TextField
              label="Note"
              value={draft.note ?? ''}
              onChange={v => setDraft({ ...draft, note: v })}
              textarea
              rows={3}
            />

            <LanguageField
              value={draft.language ?? 'en'}
              onChange={v => setDraft({ ...draft, language: v })}
            />
          </div>
        )}
      </EditorDrawer>
    </>
  );
}