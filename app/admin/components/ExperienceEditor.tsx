'use client';
// app/admin/components/ExperienceEditor.tsx

import { useState } from 'react';
import { Plus, MoveUp, MoveDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Experience } from '../types';
import {
  TextField, SelectField, MediaPickerField, uid,
  EditorDrawer, Button, Rule, LanguageField,
} from './atoms';
import { ArrayField } from './ArrayField';

const EXPO = [0.16, 1, 0.3, 1] as const;

function SectionHeader({
  count,
  onAdd,
}: {
  count: number;
  onAdd: () => void;
}) {
  return (
    <>
      <Rule />
      <div className="flex items-baseline justify-between py-4">
        <div className="flex items-baseline gap-3">
          <h2 className="font-heading text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
            Experience
          </h2>
          <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
            ({count})
          </span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          Add entry →
        </button>
      </div>
      <Rule />
    </>
  );
}

export default function ExperienceEditor({
  value,
  onChange,
}: {
  value: Experience[];
  onChange: (e: Experience[]) => void;
}) {
  const [draft, setDraft] = useState<Experience | null>(null);

  const newExperience = () =>
    setDraft({
      id: uid(), title: '', job: '', fromTo: '',
      bullets: [], type: 'Freelance', tags: [], language: 'en',
    });

  const save = () => {
    if (!draft || !draft.title.trim()) return;
    const clean  = {
      ...draft,
      bullets:  draft.bullets.filter(Boolean),
      outcomes: draft.outcomes?.filter(Boolean),
    };
    const exists = value.find(p => p.id === clean.id);
    const next   = exists
      ? value.map(p => p.id === clean.id ? clean : p)
      : [clean, ...value];
    onChange(next);
    setDraft(null);
  };

  const remove = (id: string) => {
    if (confirm('Delete this experience?')) onChange(value.filter(e => e.id !== id));
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = value.findIndex(e => e.id === id);
    if (idx < 0 || idx + dir < 0 || idx + dir >= value.length) return;
    const next = [...value];
    [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
    onChange(next);
  };

  return (
    <>
      <SectionHeader count={value.length} onAdd={newExperience} />

      <ul className="mt-0">
        <AnimatePresence mode="popLayout">
          {value.map(e => (
            <motion.li
              key={e.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3, ease: EXPO }}
              className="group relative"
            >
              <div className="flex items-center gap-5 py-4 px-1 transition-colors duration-150 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40">
                <span className="hidden shrink-0 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 sm:inline whitespace-nowrap">
                  {e.type}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
                    {e.title || 'Untitled'}
                  </h3>
                  <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 truncate">
                    {[e.job, e.location].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="hidden shrink-0 font-mono text-[10px] text-zinc-400 dark:text-zinc-600 sm:block whitespace-nowrap">
                  {e.fromTo}
                </span>
                <div className="flex shrink-0 items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button type="button" onClick={() => move(e.id, -1)} className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                    <MoveUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => move(e.id, 1)} className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                    <MoveDown className="h-3.5 w-3.5" />
                  </button>
                  <Button variant="danger"    size="sm" onClick={() => remove(e.id)}>Del</Button>
                  <Button variant="secondary" size="sm" onClick={() => setDraft({ ...e })}>Edit</Button>
                </div>
              </div>
              {e.logline && (
                <div className="max-h-0 overflow-hidden px-1 transition-[max-height] duration-300 group-hover:max-h-10">
                  <p className="border-t border-zinc-100 dark:border-zinc-900 py-1.5 font-mono text-[10px] italic text-zinc-400 dark:text-zinc-600">
                    "{e.logline}"
                  </p>
                </div>
              )}
              <Rule />
              <span aria-hidden className="absolute left-0 top-0 h-0 w-[2px] bg-[#2467AC] transition-[height] duration-300 group-hover:h-full" />
            </motion.li>
          ))}
        </AnimatePresence>

        {value.length === 0 && (
          <li className="py-12 text-center">
            <button
              type="button"
              onClick={newExperience}
              className="inline-flex items-center gap-2 border border-dashed border-zinc-300 dark:border-zinc-700 px-6 py-3 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:border-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add first experience
            </button>
          </li>
        )}
      </ul>

      <EditorDrawer
        isOpen={!!draft}
        onClose={() => setDraft(null)}
        title="Edit Experience"
        actions={<Button variant="primary" onClick={save}>Save</Button>}
      >
        {draft && (
          /*
            key={draft.id} remounts the entire form — including all ArrayField
            components — whenever a different draft is opened. This resets local
            string state inside ArrayField to the new draft's values without
            needing a useEffect sync.
          */
          <div key={draft.id} className="space-y-5">
            <TextField
              label="Company / Organization"
              value={draft.title}
              onChange={v => setDraft({ ...draft, title: v })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Role"
                value={draft.job}
                onChange={v => setDraft({ ...draft, job: v })}
              />
              <SelectField
                label="Employment type"
                value={draft.type}
                onChange={v => setDraft({ ...draft, type: v as any })}
                options={['Freelance', 'Contract', 'Full-time', 'Part-time', 'Intern']}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SelectField
                label="Location"
                value={draft.location ?? 'Remote'}
                onChange={v => setDraft({ ...draft, location: v as any })}
                options={['Remote', 'On-site', 'Hybrid']}
              />
              <TextField
                label="Date range"
                value={draft.fromTo}
                onChange={v => setDraft({ ...draft, fromTo: v })}
                placeholder="Jan 2024 – Present"
              />
            </div>
            <TextField
              label="Logline (one-liner)"
              value={draft.logline ?? ''}
              onChange={v => setDraft({ ...draft, logline: v })}
            />
            <Rule />

            {/*
              ArrayField fixes the newline bug:
              - Local raw string updated freely on every keystroke
              - Parent array updated only on onBlur via splitLines
            */}
            <ArrayField
              label="Key responsibilities (one per line)"
              value={draft.bullets ?? []}
              onChange={v => setDraft({ ...draft, bullets: v })}
              separator="line"
              rows={5}
              placeholder="Led the migration from REST to GraphQL…"
            />
            <ArrayField
              label="Outcomes (one per line)"
              value={draft.outcomes ?? []}
              onChange={v => setDraft({ ...draft, outcomes: v })}
              separator="line"
              rows={3}
              placeholder="Reduced API latency by 40%…"
            />
            <ArrayField
              label="Tech tags (comma-separated)"
              value={draft.tags ?? []}
              onChange={v => setDraft({ ...draft, tags: v })}
              separator="comma"
              placeholder="Laravel, React, Docker…"
            />
            <MediaPickerField
              label="Company logo"
              value={draft.poster ?? ''}
              onChange={v => setDraft({ ...draft, poster: v })}
              accept="image/*"
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