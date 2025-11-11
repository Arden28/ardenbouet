'use client';

import { useEffect, useState } from 'react';

/* ===================== Utils ===================== */
export const uid = () => Math.random().toString(36).slice(2, 10);

export function slugify(input: string) {
  const base = (input ?? '')
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

  return base
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

export const splitLines = (v: string) =>
  v.split('\n').map(s => s.trim()).filter(Boolean);

export const splitComma = (v: string) =>
  v.split(',').map(s => s.trim()).filter(Boolean);

export function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ===================== Small UI atoms ===================== */
export function TextField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  required?: boolean;
}) {
  const { label, value, onChange, placeholder, textarea, required } = props;
  return (
    <label className="block">
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      {textarea ? (
        <textarea
          className="mt-1 w-full rounded-lg border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm text-zinc-800 shadow-sm backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] dark:border-zinc-700/50 dark:bg-zinc-900/70 dark:text-zinc-200"
          value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} required={required} rows={4}
        />
      ) : (
        <input
          className="mt-1 w-full rounded-lg border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm text-zinc-800 shadow-sm backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] dark:border-zinc-700/50 dark:bg-zinc-900/70 dark:text-zinc-200"
          value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} required={required}
        />
      )}
    </label>
  );
}

export function Chip({
  active, children, onClick,
}: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-full border px-3 py-1 text-xs font-medium transition',
        active
          ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)] text-[color:var(--brand)]'
          : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/60',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

/* ===================== Theme bridge ===================== */
export function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains('dark'));
    update();
    const obs = new MutationObserver(update);
    obs.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}
