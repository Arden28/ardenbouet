'use client';
// Single-series bar chart (SVG): thin rounded bars on a baseline, recessive grid, hover tooltip,
// and a table view for accessibility. One hue → no legend (the card title names the series).
import { useMemo, useState } from 'react';

export function BarChart({ data, format, label, unit }: {
  data: { key: string; value: number }[];
  format: (n: number) => string;
  label: string;
  unit: 'day' | 'month';
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const W = 640, H = 200, PAD_L = 44, PAD_B = 22, PAD_T = 12;
  const max = Math.max(1, ...data.map(d => d.value));
  const nice = useMemo(() => {
    const p = Math.pow(10, Math.floor(Math.log10(max)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * p).find(s => max / s <= 4) ?? p * 10;
    return { top: Math.ceil(max / step) * step, step };
  }, [max]);
  const plotW = W - PAD_L, plotH = H - PAD_B - PAD_T;
  const slot = plotW / Math.max(1, data.length);
  const barW = Math.max(2, Math.min(28, slot - 2)); // 2px gap between bars
  const fmtKey = (k: string) => {
    const d = new Date(unit === 'day' ? `${k}T12:00:00Z` : `${k}-01T12:00:00Z`);
    return d.toLocaleDateString(undefined, unit === 'day' ? { month: 'short', day: 'numeric' } : { month: 'short', year: '2-digit' });
  };
  const ticks = Array.from({ length: Math.round(nice.top / nice.step) + 1 }, (_, i) => i * nice.step);
  const labelEvery = Math.ceil(data.length / 7);

  if (table) {
    return (
      <div>
        <div className="max-h-[220px] overflow-y-auto">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-white text-left text-[11px] uppercase tracking-[0.06em] text-[#9b9b9b]"><tr><th className="py-1.5 font-medium">{unit === 'day' ? 'Day' : 'Month'}</th><th className="py-1.5 text-right font-medium">{label}</th></tr></thead>
            <tbody>{data.map(d => <tr key={d.key} className="border-t border-[#f6f6f6]"><td className="py-1.5 text-[#6b6b6b]">{fmtKey(d.key)}</td><td className="py-1.5 text-right tabular-nums text-[#242424]">{format(d.value)}</td></tr>)}</tbody>
          </table>
        </div>
        <button type="button" onClick={() => setTable(false)} className="mt-2 text-[12px] text-[#6b6b6b] underline">Show chart</button>
      </div>
    );
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[200px] w-full" role="img" aria-label={`${label} by ${unit}`} onMouseLeave={() => setHover(null)}>
        {ticks.map(t => {
          const y = PAD_T + plotH - (t / nice.top) * plotH;
          return (
            <g key={t}>
              <line x1={PAD_L} x2={W} y1={y} y2={y} stroke="#f0f0f0" strokeWidth={1} />
              <text x={PAD_L - 8} y={y + 4} textAnchor="end" fontSize={11} fill="#9b9b9b">{format(t)}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.value / nice.top) * plotH;
          const x = PAD_L + i * slot + (slot - barW) / 2;
          const y = PAD_T + plotH - h;
          const r = Math.min(4, barW / 2, h);
          return (
            <g key={d.key} onMouseEnter={() => setHover(i)}>
              <rect x={PAD_L + i * slot} y={PAD_T} width={slot} height={plotH} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + barW - r} Q${x + barW},${y} ${x + barW},${y + r} V${y + h} Z`}
                  fill="#1a8917" opacity={hover === null || hover === i ? 1 : 0.45}
                />
              )}
              {i % labelEvery === 0 && <text x={PAD_L + i * slot + slot / 2} y={H - 4} textAnchor="middle" fontSize={11} fill="#9b9b9b">{fmtKey(d.key)}</text>}
            </g>
          );
        })}
        <line x1={PAD_L} x2={W} y1={PAD_T + plotH} y2={PAD_T + plotH} stroke="#d4d4d4" strokeWidth={1} />
      </svg>
      {hover !== null && data[hover] && (
        <div className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg bg-[#242424] px-3 py-2 text-[12px] text-white shadow-lg"
          style={{ left: `${((PAD_L + hover * slot + slot / 2) / W) * 100}%` }}>
          <p className="text-white/60">{fmtKey(data[hover].key)}</p>
          <p className="font-semibold tabular-nums">{format(data[hover].value)}</p>
        </div>
      )}
      <button type="button" onClick={() => setTable(true)} className="absolute right-0 top-0 text-[11px] text-[#9b9b9b] underline hover:text-[#242424]">Table</button>
    </div>
  );
}
