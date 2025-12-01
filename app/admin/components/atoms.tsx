'use client';

import { useEffect, useState, useRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Download, Save } from 'lucide-react';

/* ===================== Utils ===================== */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export function slugify(input: string) {
  return (input || '').toString().toLowerCase().trim()
    .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');
}

export const splitLines = (v: string) => v.split('\n').map(s => s.trim()).filter(Boolean);
export const splitComma = (v: string) => v.split(',').map(s => s.trim()).filter(Boolean);

export function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
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

/**
 * A modern, animated toggle switch.
 */
export function Toggle({ 
  checked, 
  onChange, 
  label 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void; 
  label?: string 
}) {
  return (
    <label className="group inline-flex cursor-pointer items-center gap-2">
      <div className="relative">
        <input 
          type="checkbox" 
          className="sr-only" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)} 
        />
        {/* Track */}
        <div 
          className={cn(
            "h-5 w-9 rounded-full transition-colors duration-300", 
            checked 
              ? "bg-[color:var(--brand)]" 
              : "bg-zinc-300 dark:bg-zinc-700 group-hover:bg-zinc-400 dark:group-hover:bg-zinc-600"
          )} 
        />
        {/* Knob */}
        <motion.div 
          className="absolute left-1 top-1 h-3 w-3 rounded-full bg-white shadow-sm"
          animate={{ x: checked ? 16 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
      {label && (
        <span className="text-xs font-medium text-zinc-500 transition-colors group-hover:text-zinc-800 dark:text-zinc-400 dark:group-hover:text-zinc-200 select-none">
          {label}
        </span>
      )}
    </label>
  );
}

/* ===================== Modern UI Atoms ===================== */

export function Button({ 
  children, variant = 'secondary', className, loading, icon: Icon, ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost', loading?: boolean, icon?: any }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-[color:var(--brand)] text-white hover:opacity-90 shadow-md shadow-[color:var(--brand)]/20",
    secondary: "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/50",
    danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400",
    ghost: "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-black/5 dark:hover:bg-white/5",
  };

  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {!loading && Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}

export function TextField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  required?: boolean;
  className?: string;
}) {
  const { label, value, onChange, placeholder, textarea, required, className } = props;
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">{label}</span>
      {textarea ? (
        <textarea
          className="min-h-[100px] w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-800 outline-none transition-all focus:border-[color:var(--brand)] focus:bg-white focus:ring-2 focus:ring-[color:var(--brand)]/10 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-200 dark:focus:bg-black"
          value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} required={required}
        />
      ) : (
        <input
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-800 outline-none transition-all focus:border-[color:var(--brand)] focus:bg-white focus:ring-2 focus:ring-[color:var(--brand)]/10 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-200 dark:focus:bg-black"
          value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} required={required}
        />
      )}
    </label>
  );
}

/** * THE DRAWER: This is the key to the modern UX. 
 * Instead of editing in-line, we slide this over.
 */
export function EditorDrawer({ 
  isOpen, onClose, title, children, actions 
}: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-zinc-900/20 backdrop-blur-[2px] dark:bg-black/40"
          />
          {/* Drawer */}
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-white shadow-2xl dark:bg-[#09090b] sm:border-l sm:border-zinc-200 sm:dark:border-zinc-800"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 p-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">{title}</h2>
              <div className="flex items-center gap-2">
                {actions}
                <button onClick={onClose} className="rounded-md p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function Chip({ active, children, onClick, count }: { active?: boolean; children: React.ReactNode; onClick?: () => void, count?: number }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
        active 
          ? "border-[color:var(--brand)] bg-[color:var(--brand)]/5 text-[color:var(--brand)] ring-2 ring-[color:var(--brand)]/10" 
          : "border-transparent bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
      )}
    >
      {children}
      {count !== undefined && (
        <span className={cn(
          "flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[10px] font-bold",
          active ? "bg-[color:var(--brand)] text-white" : "bg-zinc-300 dark:bg-zinc-600 text-zinc-800 dark:text-zinc-200"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}