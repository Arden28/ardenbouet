'use client';
// Admin design system — small, consistent primitives in the Medium visual language.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Loader2, Check, AlertCircle, Plus } from 'lucide-react';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function Button({ children, variant = 'secondary', size = 'md', busy, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'dark' | 'ghost' | 'danger'; size?: 'sm' | 'md'; busy?: boolean;
}) {
  const v = {
    primary: 'bg-[#1a8917] text-white hover:bg-[#156d12]',
    dark: 'bg-[#242424] text-white hover:bg-black',
    secondary: 'border border-[#e6e6e6] bg-white text-[#242424] hover:border-[#242424]',
    ghost: 'text-[#6b6b6b] hover:bg-[#f2f2f2] hover:text-[#242424]',
    danger: 'text-[#c94a4a] hover:bg-[#fdf1f1]',
  }[variant];
  const s = size === 'sm' ? 'px-3 py-1.5 text-[13px]' : 'px-4 py-2 text-[14px]';
  return (
    <button type="button" {...rest} disabled={rest.disabled || busy} className={cx('inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors disabled:opacity-50', v, s, className)}>
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}{children}
    </button>
  );
}

export function PageIntro({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-[26px] font-bold tracking-[-0.02em] text-[#242424]">{title}</h2>
        {description && <p className="mt-1 max-w-[620px] text-[14px] leading-[22px] text-[#6b6b6b]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { key: T; label: string; count?: number; alert?: boolean }[] }) {
  return (
    <nav className="no-scrollbar -mb-px flex gap-6 overflow-x-auto border-b border-[#f2f2f2] text-[14px]">
      {items.map(it => (
        <button key={it.key} type="button" onClick={() => onChange(it.key)}
          className={cx('shrink-0 border-b pb-3', value === it.key ? 'border-[#242424] text-[#242424]' : 'border-transparent text-[#6b6b6b] hover:text-[#242424]')}>
          {it.label}
          {it.count !== undefined && <span className={cx('ml-1.5', it.alert && it.count ? 'rounded-full bg-[#1a8917] px-1.5 text-[11px] text-white' : 'text-[#9b9b9b]')}>{it.count}</span>}
        </button>
      ))}
    </nav>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Search', className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <label className={cx('flex items-center gap-2 rounded-full bg-white px-3 py-1.5 ring-1 ring-[#e6e6e6] focus-within:ring-[#242424]', className)}>
      <Search className="h-4 w-4 text-[#9b9b9b]" />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none" />
      {value && <button type="button" onClick={() => onChange('')} aria-label="Clear"><X className="h-3.5 w-3.5 text-[#9b9b9b]" /></button>}
    </label>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'green' | 'amber' | 'blue' | 'red' }) {
  const t = { neutral: 'bg-[#f2f2f2] text-[#6b6b6b]', green: 'bg-[#eef7ee] text-[#1a6b17]', amber: 'bg-[#fdf6e7] text-[#7a5a00]', blue: 'bg-[#eef4fb] text-[#2467ac]', red: 'bg-[#fdf1f1] text-[#c94a4a]' }[tone];
  return <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium', t)}>{children}</span>;
}

export function Empty({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#e6e6e6] px-6 py-16 text-center">
      <p className="text-[16px] font-medium text-[#242424]">{title}</p>
      {body && <p className="mt-1 max-w-[420px] text-[14px] text-[#6b6b6b]">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner() {
  return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#9b9b9b]" /></div>;
}

export function SaveStatus({ state, error }: { state: 'idle' | 'dirty' | 'saving' | 'saved' | 'error'; error?: string }) {
  if (state === 'saving') return <span className="flex items-center gap-1.5 text-[13px] text-[#9b9b9b]"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</span>;
  if (state === 'dirty') return <span className="text-[13px] text-[#9b9b9b]">Unsaved changes</span>;
  if (state === 'error') return <span className="flex items-center gap-1.5 text-[13px] text-[#c94a4a]" title={error}><AlertCircle className="h-3.5 w-3.5" /> Not saved</span>;
  if (state === 'saved') return <span className="flex items-center gap-1.5 text-[13px] text-[#9b9b9b]"><Check className="h-3.5 w-3.5" /> Saved</span>;
  return null;
}

// ─── Form fields ─────────────────────────────────────────────────────────────

export const inputCls = 'w-full rounded-lg border border-[#e6e6e6] bg-white px-3 py-2 text-[14px] text-[#242424] outline-none transition-colors placeholder:text-[#b3b3b3] focus:border-[#242424]';

export function Field({ label, hint, children, className }: { label?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="mb-1.5 block text-[13px] font-medium text-[#242424]">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-[12px] text-[#9b9b9b]">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cx('relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors', checked ? 'bg-[#1a8917]' : 'bg-[#d4d4d4]')}>
        <span className={cx('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
      </button>
      <span className="text-[14px] text-[#242424]">{label}{hint && <span className="block text-[12px] text-[#9b9b9b]">{hint}</span>}</span>
    </label>
  );
}

export function TagInput({ value, onChange, placeholder = 'Add and press Enter', suggestions = [] }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; suggestions?: string[] }) {
  const [draft, setDraft] = useState('');
  const add = (raw: string) => {
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    const next = [...value];
    for (const p of parts) if (!next.includes(p)) next.push(p);
    onChange(next);
    setDraft('');
  };
  const sugg = suggestions.filter(s => !value.includes(s) && (!draft || s.toLowerCase().includes(draft.toLowerCase()))).slice(0, 8);
  return (
    <div>
      <div className="flex min-h-[40px] flex-wrap items-center gap-1.5 rounded-lg border border-[#e6e6e6] bg-white p-1.5 focus-within:border-[#242424]">
        {value.map(t => (
          <span key={t} className="flex items-center gap-1 rounded-md bg-[#f2f2f2] px-2 py-0.5 text-[13px] text-[#242424]">
            {t}<button type="button" onClick={() => onChange(value.filter(x => x !== t))} aria-label={`Remove ${t}`} className="text-[#9b9b9b] hover:text-[#242424]"><X className="h-3 w-3" /></button>
          </span>
        ))}
        <input value={draft} onChange={e => setDraft(e.target.value)} placeholder={value.length ? '' : placeholder}
          onKeyDown={e => {
            if ((e.key === 'Enter' || e.key === ',') && draft.trim()) { e.preventDefault(); add(draft); }
            if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => draft.trim() && add(draft)}
          className="min-w-[120px] flex-1 bg-transparent px-1 text-[14px] outline-none" />
      </div>
      {sugg.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1">{sugg.map(s => <button key={s} type="button" onClick={() => add(s)} className="rounded-full bg-[#f6f6f6] px-2 py-0.5 text-[12px] text-[#6b6b6b] hover:bg-[#ececec]">+ {s}</button>)}</div>}
    </div>
  );
}

/** Ordered list of short strings (bullets, features, steps). */
export function ListInput({ value, onChange, placeholder = 'Add an item', multiline = false }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string; multiline?: boolean }) {
  const refs = useRef<(HTMLInputElement | HTMLTextAreaElement | null)[]>([]);
  const update = (i: number, v: string) => onChange(value.map((x, j) => (j === i ? v : x)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-1.5">
      {value.map((item, i) => (
        <div key={i} className="group flex items-start gap-1.5">
          <span className="mt-2 w-5 shrink-0 text-right font-mono text-[11px] text-[#c4c4c4]">{i + 1}</span>
          {multiline
            ? <textarea ref={el => { refs.current[i] = el; }} value={item} onChange={e => update(i, e.target.value)} rows={2} className={inputCls} />
            : <input ref={el => { refs.current[i] = el; }} value={item} onChange={e => update(i, e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onChange([...value.slice(0, i + 1), '', ...value.slice(i + 1)]); setTimeout(() => refs.current[i + 1]?.focus(), 0); } }}
                className={inputCls} />}
          <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <button type="button" onClick={() => move(i, -1)} className="rounded p-1.5 text-[#9b9b9b] hover:text-[#242424]" aria-label="Move up">↑</button>
            <button type="button" onClick={() => move(i, 1)} className="rounded p-1.5 text-[#9b9b9b] hover:text-[#242424]" aria-label="Move down">↓</button>
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="rounded p-1.5 text-[#9b9b9b] hover:text-[#c94a4a]" aria-label="Remove"><X className="h-4 w-4" /></button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => { onChange([...value, '']); setTimeout(() => refs.current[value.length]?.focus(), 0); }} className="ml-6 flex items-center gap-1.5 text-[13px] text-[#6b6b6b] hover:text-[#242424]">
        <Plus className="h-3.5 w-3.5" /> {placeholder}
      </button>
    </div>
  );
}

// ─── Drawer ──────────────────────────────────────────────────────────────────

export function Drawer({ open, onClose, title, subtitle, children, footer, width = 640 }: {
  open: boolean; onClose: () => void; title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; width?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open || typeof document === 'undefined') return null;
  return createPortal(
    <div className="blog-ui fixed inset-0 z-[150] flex justify-end bg-black/25" onMouseDown={onClose}>
      <div className="flex h-full w-full flex-col bg-white shadow-2xl animate-[drawer-in_.22s_ease-out]" style={{ maxWidth: width }} onMouseDown={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex items-start justify-between gap-4 border-b border-[#f2f2f2] px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-[17px] font-semibold text-[#242424]">{title}</h2>
            {subtitle && <div className="mt-0.5 text-[13px] text-[#6b6b6b]">{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-[#6b6b6b] hover:bg-[#f2f2f2]" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-[#f2f2f2] px-6 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
