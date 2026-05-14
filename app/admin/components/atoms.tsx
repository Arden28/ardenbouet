'use client';
// app/admin/components/atoms.tsx

import { useEffect, useState } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';

// ─── Motion ──────────────────────────────────────────────────────────────────
const EXPO = [0.16, 1, 0.3, 1] as const;

/* ===================== Utilities (unchanged) ===================== */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export function slugify(input: string) {
  return (input || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export const splitLines = (v: string) => v.split('\n').map(s => s.trim()).filter(Boolean);
export const splitComma = (v: string) => v.split(',').map(s => s.trim()).filter(Boolean);

export function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click(); a.remove(); URL.revokeObjectURL(url);
}

export function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark'));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

/* ===================== Inline spinner ===================== */
function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M7 2a5 5 0 0 1 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ===================== Toggle ===================== */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 group">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
        />
        {/* Track */}
        <div
          className={cn(
            'h-4 w-8 transition-colors duration-200',
            checked
              ? 'bg-[#2467AC]'
              : 'bg-zinc-300 dark:bg-zinc-700'
          )}
        />
        {/* Knob */}
        <motion.div
          className="absolute left-0.5 top-0.5 h-3 w-3 bg-zinc-900 dark:bg-zinc-100 shadow-sm"
          animate={{ x: checked ? 16 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      </div>
      {label && (
        <span className="select-none font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
          {label}
        </span>
      )}
    </label>
  );
}

/* ===================== Button ===================== */
export function Button({
  children,
  variant = 'secondary',
  className,
  loading,
  icon: Icon,
  size = 'default',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  icon?: React.ElementType;
  size?: 'default' | 'sm' | 'icon';
}) {
  const base = [
    'inline-flex items-center justify-center gap-1.5',
    'font-mono uppercase tracking-widest',
    'transition-colors duration-150',
    'focus-visible:outline-none',
    'disabled:opacity-40 disabled:pointer-events-none',
  ].join(' ');

  const sizes = {
    default: 'px-4 py-2 text-[10px]',
    sm:      'px-2.5 py-1.5 text-[9px]',
    icon:    'h-8 w-8 text-[10px]',
  };

  const variants = {
    primary: [
      'border border-zinc-900 dark:border-zinc-100',
      'bg-zinc-900 dark:bg-zinc-50',
      'text-white dark:text-zinc-900',
      'hover:bg-zinc-700 dark:hover:bg-zinc-200',
    ].join(' '),
    secondary: [
      'border border-zinc-200 dark:border-zinc-800',
      'bg-white dark:bg-zinc-900',
      'text-zinc-700 dark:text-zinc-300',
      'hover:bg-zinc-50 dark:hover:bg-zinc-800',
    ].join(' '),
    danger: [
      'border border-zinc-200 dark:border-zinc-800',
      'bg-transparent',
      'text-red-500 dark:text-red-400',
      'hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20',
    ].join(' '),
    ghost: [
      'border border-transparent',
      'text-zinc-500 dark:text-zinc-400',
      'hover:text-zinc-900 dark:hover:text-zinc-100',
      'hover:bg-zinc-100 dark:hover:bg-zinc-800',
    ].join(' '),
  };

  return (
    <button className={cn(base, sizes[size], variants[variant], className)} {...props}>
      {loading && <Spinner />}
      {!loading && Icon && <Icon className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

/* ===================== TextField ===================== */
/*
  Admin context uses boxed inputs (better density than line inputs).
  But no rounded-lg — consistent with the design system's no-radius rule.
  Labels use the same font-mono uppercase tracking pattern as the public site.
*/
export function TextField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  required?: boolean;
  className?: string;
  hint?: string;
  rows?: number;
}) {
  const { label, value, onChange, placeholder, textarea, required, className, hint, rows } = props;

  const inputCls = [
    'w-full border border-zinc-200 dark:border-zinc-800',
    'bg-white dark:bg-zinc-900',
    'px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100',
    'placeholder:text-zinc-400 dark:placeholder:text-zinc-600',
    'focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100',
    'transition-colors duration-150',
  ].join(' ');

  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
        {label}
        {required && <span className="ml-1 text-red-400" aria-hidden>*</span>}
      </span>
      {textarea ? (
        <textarea
          className={cn(inputCls, 'resize-none')}
          style={{ minHeight: `${(rows ?? 4) * 1.75}rem` }}
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          required={required}
        />
      ) : (
        <input
          className={inputCls}
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          required={required}
        />
      )}
      {hint && (
        <p className="mt-1 font-mono text-[9px] text-zinc-400 dark:text-zinc-600">{hint}</p>
      )}
    </label>
  );
}

/* ===================== SelectField ===================== */
export function SelectField({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  className?: string;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
        {label}
      </span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={[
          'w-full border border-zinc-200 dark:border-zinc-800',
          'bg-white dark:bg-zinc-900',
          'px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100',
          'focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100',
          'transition-colors duration-150',
          'appearance-none',
        ].join(' ')}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </label>
  );
}

/* ===================== EditorDrawer ===================== */
/*
  Slide-in from right — same motion pattern as ShopClient / QuickPeek.
  Clean white / zinc-900 bg for the editing context.
  Sharp corners throughout.
*/
export function EditorDrawer({
  isOpen,
  onClose,
  title,
  children,
  actions,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const prev  = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-zinc-900/30 backdrop-blur-[2px]"
            aria-hidden
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className={[
              'fixed inset-y-0 right-0 z-50',
              'flex w-full max-w-xl flex-col',
              'bg-white dark:bg-zinc-900',
              'border-l border-zinc-200 dark:border-zinc-800',
            ].join(' ')}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
              <h2 className="font-heading text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {title}
              </h2>
              <div className="flex items-center gap-2">
                {actions}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close drawer"
                  className={[
                    'inline-flex h-7 w-7 items-center justify-center',
                    'border border-zinc-200 dark:border-zinc-800',
                    'text-zinc-400',
                    'hover:border-zinc-900 hover:text-zinc-900',
                    'dark:hover:border-zinc-100 dark:hover:text-zinc-100',
                    'transition-colors duration-150',
                  ].join(' ')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div
              className={[
                'flex-1 overflow-y-auto p-5',
                '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]',
              ].join(' ')}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ===================== Chip ===================== */
/*
  Navigation / filter chips.
  Sharp rectangular bordered style — no pill/rounded shape.
*/
export function Chip({
  active,
  children,
  onClick,
  count,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 border px-3 py-1.5',
        'font-mono text-[10px] uppercase tracking-widest',
        'transition-colors duration-150 focus-visible:outline-none',
        active
          ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-50 bg-zinc-50 dark:bg-zinc-900'
          : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 hover:border-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn(
          'font-mono text-[9px] tabular-nums',
          active ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-300 dark:text-zinc-700'
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ===================== LanguageField ===================== */
const LANG_OPTS = [
  { key: 'en'   as const, flag: '🇬🇧', label: 'EN'    },
  { key: 'fr'   as const, flag: '🇫🇷', label: 'FR'    },
  { key: 'both' as const, flag: '🌐',  label: 'EN+FR' },
];

export function LanguageField({
  value = 'en',
  onChange,
}: {
  value?: 'en' | 'fr' | 'both';
  onChange: (v: 'en' | 'fr' | 'both') => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
        Language
      </span>
      <div className="flex border border-zinc-200 dark:border-zinc-800">
        {LANG_OPTS.map(o => (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            title={o.label}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 py-2 font-mono text-[9px] uppercase tracking-widest transition-colors border-r border-zinc-200 dark:border-zinc-800 last:border-0',
              value === o.key
                ? 'bg-[#2467AC] text-white'
                : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300',
            )}
          >
            <span aria-hidden>{o.flag}</span>
            <span>{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ===================== InlineRule ===================== */
export function Rule({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}