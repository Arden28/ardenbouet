'use client';
// app/admin/components/ArrayField.tsx
//
// Fixes the "can't type newlines or commas" bug.
//
// Root cause: the editors were calling splitLines(v) / splitComma(v) inside
// onChange, which runs filter(Boolean) on every keystroke. A trailing '\n' or
// ',' is immediately stripped, so the cursor jumps and the user can never
// finish the line.
//
// Fix: keep a local raw string in useState. The parent array is only updated
// on onBlur (or when the user leaves the field). The form wrapper uses
// key={draft.id} so local state resets whenever a new draft is opened.

import { useState } from 'react';
import { cn, splitLines, splitComma } from './atoms';

// ─── Shared input style (matches TextField in atoms.tsx) ─────────────────────
const inputCls = [
  'w-full border border-zinc-200 dark:border-zinc-800',
  'bg-white dark:bg-zinc-900',
  'px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100',
  'placeholder:text-zinc-400 dark:placeholder:text-zinc-600',
  'focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100',
  'transition-colors duration-150',
].join(' ');

// ─── ArrayField ───────────────────────────────────────────────────────────────
export function ArrayField({
  label,
  value,
  onChange,
  separator = 'line',
  placeholder,
  rows       = 4,
  hint,
  className,
}: {
  label:      string;
  value:      string[];
  onChange:   (v: string[]) => void;
  /** 'line'  → textarea, one item per line, parsed with splitLines on blur
   *  'comma' → single-line input, comma-separated, parsed with splitComma on blur */
  separator?: 'line' | 'comma';
  placeholder?: string;
  rows?:      number;
  hint?:      string;
  className?: string;
}) {
  // Initialise the raw string from the current array.
  // No useEffect sync needed — the parent wraps the form in key={draft.id}
  // which remounts this component whenever a different draft is opened.
  const initialRaw = separator === 'line'
    ? value.join('\n')
    : value.join(', ');

  const [raw, setRaw] = useState(initialRaw);

  const commit = () => {
    const parsed = separator === 'line' ? splitLines(raw) : splitComma(raw);
    onChange(parsed);
  };

  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
        {label}
      </span>

      {separator === 'line' ? (
        <textarea
          className={cn(inputCls, 'resize-none')}
          style={{ minHeight: `${rows * 1.75}rem` }}
          value={raw}
          placeholder={placeholder}
          // Update local state freely — no parsing on every keystroke
          onChange={e => setRaw(e.target.value)}
          // Parse and emit to parent only when the user leaves the field
          onBlur={commit}
        />
      ) : (
        <input
          className={inputCls}
          value={raw}
          placeholder={placeholder}
          onChange={e => setRaw(e.target.value)}
          onBlur={commit}
        />
      )}

      {hint && (
        <p className="mt-1 font-mono text-[9px] text-zinc-400 dark:text-zinc-600">
          {hint}
        </p>
      )}
    </label>
  );
}