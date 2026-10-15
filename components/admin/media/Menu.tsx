'use client';
// Floating menu used for right-click context menus, ⋮ buttons and filter chips (Drive-style).
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';

export type MenuEntry =
  | { label: string; icon?: ReactNode; shortcut?: string; onSelect: () => void; danger?: boolean; disabled?: boolean; checked?: boolean }
  | 'sep';

export type MenuState = { x: number; y: number; items: MenuEntry[]; align?: 'left' | 'right' } | null;

export function Menu({ state, onClose }: { state: MenuState; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [active, setActive] = useState(-1);

  useLayoutEffect(() => {
    if (!state || !ref.current) { setPos(null); return; }
    const r = ref.current.getBoundingClientRect();
    const pad = 8;
    let left = state.align === 'right' ? state.x - r.width : state.x;
    let top = state.y;
    if (left + r.width > window.innerWidth - pad) left = window.innerWidth - r.width - pad;
    if (top + r.height > window.innerHeight - pad) top = Math.max(pad, state.y - r.height);
    setPos({ left: Math.max(pad, left), top: Math.max(pad, top) });
    setActive(-1);
    ref.current.focus();
  }, [state]);

  useEffect(() => {
    if (!state) return;
    const close = () => onClose();
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    window.addEventListener('mousedown', onDown, true);
    window.addEventListener('resize', close);
    window.addEventListener('blur', close);
    document.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('mousedown', onDown, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('blur', close);
      document.removeEventListener('scroll', close, true);
    };
  }, [state, onClose]);

  if (!state || typeof document === 'undefined') return null;
  const items = state.items;
  const actionable = items.map((it, i) => (it !== 'sep' && !it.disabled ? i : -1)).filter(i => i >= 0);

  const onKey = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const at = actionable.indexOf(active);
      const next = e.key === 'ArrowDown' ? actionable[(at + 1) % actionable.length] : actionable[(at - 1 + actionable.length) % actionable.length];
      setActive(next ?? -1);
    }
    if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      const it = items[active];
      if (it !== 'sep') { onClose(); it.onSelect(); }
    }
  };

  return createPortal(
    <div
      ref={ref}
      role="menu"
      tabIndex={-1}
      onKeyDown={onKey}
      onContextMenu={e => e.preventDefault()}
      style={{ left: pos?.left ?? state.x, top: pos?.top ?? state.y, visibility: pos ? 'visible' : 'hidden' }}
      className="blog-ui fixed z-[400] min-w-[232px] max-w-[300px] animate-[menu-in_120ms_ease-out] rounded-xl border border-[#ececec] bg-white py-1.5 text-[14px] text-[#242424] shadow-[0_8px_28px_rgba(0,0,0,0.14)] outline-none"
    >
      {items.map((it, i) =>
        it === 'sep' ? (
          <div key={`sep-${i}`} className="my-1.5 h-px bg-[#f0f0f0]" />
        ) : (
          <button
            key={it.label}
            type="button"
            role="menuitem"
            disabled={it.disabled}
            onMouseEnter={() => setActive(i)}
            onClick={() => { onClose(); it.onSelect(); }}
            className={`flex w-full items-center gap-3 px-4 py-[7px] text-left disabled:opacity-35 ${active === i ? 'bg-[#f2f2f2]' : ''} ${it.danger ? 'text-[#c94a4a]' : ''}`}
          >
            <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center ${it.danger ? '' : 'text-[#6b6b6b]'}`}>
              {it.checked ? <Check className="h-4 w-4 text-[#242424]" /> : it.icon}
            </span>
            <span className="min-w-0 flex-1 truncate">{it.label}</span>
            {it.shortcut && <span className="text-[12px] text-[#9b9b9b]">{it.shortcut}</span>}
          </button>
        ),
      )}
    </div>,
    document.body,
  );
}

/** Opens a menu anchored under an element (for ⋮ buttons and chips). */
export function anchorMenu(el: HTMLElement, items: MenuEntry[], align: 'left' | 'right' = 'left'): NonNullable<MenuState> {
  const r = el.getBoundingClientRect();
  return { x: align === 'right' ? r.right : r.left, y: r.bottom + 4, items, align };
}
