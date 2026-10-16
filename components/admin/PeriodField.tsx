'use client';
// Start/end month picker for admin forms: two month popovers (year stepper + month grid), an
// "I currently work here" switch, and a live summary with the duration. Values are "YYYY-MM"; end '' = present.
import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const toNum = (v?: string) => { const m = /^(\d{4})-(\d{2})$/.exec(v ?? ''); return m ? Number(m[1]) * 12 + Number(m[2]) - 1 : null; };
const toStr = (n: number) => `${Math.floor(n / 12)}-${String((n % 12) + 1).padStart(2, '0')}`;
const label = (v?: string) => { const n = toNum(v); return n === null ? '' : `${MONTHS[n % 12]} ${Math.floor(n / 12)}`; };
const now = () => { const d = new Date(); return d.getFullYear() * 12 + d.getMonth(); };

function duration(months: number) {
  const y = Math.floor(months / 12), m = months % 12;
  return [y ? `${y} yr${y > 1 ? 's' : ''}` : '', m ? `${m} mo${m > 1 ? 's' : ''}` : ''].filter(Boolean).join(' ') || '1 mo';
}

function MonthPicker({ value, onChange, min, max, placeholder, disabled, ariaLabel }: {
  value?: string; onChange: (v: string) => void; min?: number | null; max: number; placeholder: string; disabled?: boolean; ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [years, setYears] = useState(false);
  const selected = toNum(value);
  const [year, setYear] = useState(() => Math.floor((selected ?? now()) / 12));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open) { setYear(Math.floor((toNum(value) ?? Math.min(now(), max)) / 12)); setYears(false); } }, [open, value, max]);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    document.addEventListener('mousedown', away);
    document.addEventListener('keydown', esc, true);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc, true); };
  }, [open]);

  const maxYear = Math.floor(max / 12);
  const minYear = min != null ? Math.floor(min / 12) : maxYear - 40;
  const today = now();

  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} onClick={() => setOpen(o => !o)} aria-label={ariaLabel} aria-expanded={open}
        className={`flex h-[42px] w-full items-center gap-2.5 rounded-xl border bg-white px-3.5 text-left text-[14px] transition-colors disabled:cursor-not-allowed disabled:bg-[#fafafa] ${open ? 'border-[#242424] ring-1 ring-[#242424]' : 'border-[#e6e6e6] hover:border-[#c4c4c4]'}`}>
        <CalendarDays className="h-4 w-4 shrink-0 text-[#9b9b9b]" />
        <span className={`min-w-0 flex-1 truncate ${value ? 'font-medium text-[#242424]' : 'text-[#b3b3b3]'}`}>{label(value) || placeholder}</span>
        {!disabled && <ChevronDown className={`h-4 w-4 shrink-0 text-[#9b9b9b] transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>

      {open && (
        <div role="dialog" aria-label={ariaLabel} className="absolute left-0 z-40 mt-2 w-[280px] animate-[menu-in_120ms_ease-out] rounded-2xl border border-[#ececec] bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.14)]">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setYear(y => Math.max(minYear, y - 1))} disabled={year <= minYear || years} aria-label="Previous year" className="flex h-8 w-8 items-center justify-center rounded-full text-[#6b6b6b] hover:bg-[#f2f2f2] disabled:opacity-25"><ChevronLeft className="h-4 w-4" /></button>
            <button type="button" onClick={() => setYears(v => !v)} className="flex items-center gap-1 rounded-full px-3 py-1 text-[15px] font-semibold tabular-nums text-[#242424] hover:bg-[#f2f2f2]">
              {year} <ChevronDown className={`h-3.5 w-3.5 text-[#9b9b9b] transition-transform ${years ? 'rotate-180' : ''}`} />
            </button>
            <button type="button" onClick={() => setYear(y => Math.min(maxYear, y + 1))} disabled={year >= maxYear || years} aria-label="Next year" className="flex h-8 w-8 items-center justify-center rounded-full text-[#6b6b6b] hover:bg-[#f2f2f2] disabled:opacity-25"><ChevronRight className="h-4 w-4" /></button>
          </div>

          {years ? (
            <div className="thin-scroll mt-2 grid max-h-[192px] grid-cols-4 gap-1 overflow-y-auto">
              {Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i).map(y => (
                <button key={y} type="button" onClick={() => { setYear(y); setYears(false); }}
                  className={`rounded-lg py-2 text-[13px] tabular-nums ${y === year ? 'bg-[#242424] font-semibold text-white' : 'text-[#242424] hover:bg-[#f2f2f2]'}`}>{y}</button>
              ))}
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-3 gap-1">
              {MONTHS.map((m, i) => {
                const n = year * 12 + i;
                const off = n > max || (min != null && n < min);
                const isSel = n === selected;
                return (
                  <button key={m} type="button" disabled={off} onClick={() => { onChange(toStr(n)); setOpen(false); }}
                    className={`relative rounded-xl py-2.5 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-25 ${isSel ? 'bg-[#242424] font-semibold text-white' : 'text-[#242424] hover:bg-[#f2f2f2]'} ${n === today && !isSel ? 'ring-1 ring-inset ring-[#1a8917]' : ''}`}>
                    {m}
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-[#f2f2f2] pt-2 text-[12px]">
            <span className="flex items-center gap-1.5 text-[#9b9b9b]"><span className="h-2 w-2 rounded-full ring-1 ring-[#1a8917]" /> This month</span>
            {today <= max && (min == null || today >= min) && (
              <button type="button" onClick={() => { onChange(toStr(today)); setOpen(false); }} className="rounded-full px-2.5 py-1 font-medium text-[#1a8917] hover:bg-[#eef7ee]">This month</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function PeriodField({ start, end, onChange, currentLabel = 'I currently work here' }: {
  start?: string; end?: string; onChange: (start: string | undefined, end: string) => void; currentLabel?: string;
}) {
  const s = toNum(start), e = toNum(end);
  const current = !end;
  const [lastEnd, setLastEnd] = useState(end || '');
  useEffect(() => { if (end) setLastEnd(end); }, [end]);
  const today = now();
  const span = s !== null ? (current ? today : e ?? today) - s + 1 : null;
  const invalid = s !== null && e !== null && e < s;

  return (
    <div className="rounded-2xl border border-[#ececec] bg-[#fcfcfc] p-4">
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div>
          <p className="mb-1.5 text-[12px] font-medium uppercase tracking-[0.08em] text-[#9b9b9b]">Started</p>
          <MonthPicker value={start} onChange={v => onChange(v, end ?? '')} max={e ?? today} placeholder="Pick a month" ariaLabel="Start month" />
        </div>
        <svg viewBox="0 0 40 12" className="mb-[15px] hidden h-3 w-10 text-[#c4c4c4] sm:block" fill="none" aria-hidden>
          <path d="M1 6h32" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M33 2l5 4-5 4" stroke={current ? '#1a8917' : 'currentColor'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <p className="mb-1.5 text-[12px] font-medium uppercase tracking-[0.08em] text-[#9b9b9b]">Ended</p>
          {current ? (
            <div className="flex h-[42px] items-center gap-2 rounded-xl border border-[#dcefdc] bg-[#f3faf3] px-3.5 text-[14px] font-medium text-[#1a6b17]">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1a8917] opacity-50" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#1a8917]" /></span>
              Present
            </div>
          ) : (
            <MonthPicker value={end} onChange={v => onChange(start, v)} min={s} max={today} placeholder="Pick a month" ariaLabel="End month" />
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-[#242424]">
          <button type="button" role="switch" aria-checked={current}
            onClick={() => onChange(start, current ? (lastEnd && (s === null || toNum(lastEnd)! >= s) ? lastEnd : toStr(today)) : '')}
            className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${current ? 'bg-[#1a8917]' : 'bg-[#d4d4d4]'}`}>
            <span className={`absolute left-0 top-0.5 h-5 w-5 rounded-full bg-[#ffffff] shadow transition-transform ${current ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
          </button>
          {currentLabel}
        </label>
        {s !== null && (
          <span className={`rounded-full px-3 py-1 text-[13px] ${invalid ? 'bg-[#fdf1f1] text-[#c94a4a]' : 'bg-[#f2f2f2] text-[#242424]'}`}>
            {invalid ? 'Ends before it starts' : <>{label(start)} – {current ? 'Present' : label(end)} <span className="text-[#6b6b6b]">· {duration(span ?? 1)}</span></>}
          </span>
        )}
      </div>
    </div>
  );
}
