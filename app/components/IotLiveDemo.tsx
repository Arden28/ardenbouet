'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

type SensorPoint = { t: number; v: number };

export default function IotLiveDemo() {
  // Keep a short rolling window (e.g., last 45 samples)
  const WINDOW = 45;
  const [data, setData] = useState<SensorPoint[]>([]);
  const [status, setStatus] = useState<'streaming' | 'paused'>('streaming');
  const intervalRef = useRef<NodeJS.Timer | null>(null);

  // Seed with a smooth baseline to avoid a blank chart on first render
  useEffect(() => {
    const now = Date.now();
    const seed: SensorPoint[] = Array.from({ length: WINDOW }, (_, i) => {
      const t = now - (WINDOW - i) * 1200;
      const base = 24.0; // e.g., ambient temperature
      const noise = Math.sin(i / 3) * 0.35 + (Math.random() - 0.5) * 0.2;
      return { t, v: +(base + noise).toFixed(2) };
    });
    setData(seed);
  }, []);

  // Simulate sensor stream
  const start = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setData(prev => {
        const next = prev.slice(-WINDOW + 1);
        const t = Date.now();
        const last = prev[prev.length - 1]?.v ?? 24;
        // drift slightly, bounded
        const step = (Math.random() - 0.5) * 0.5 + Math.sin(t / 3000) * 0.1;
        const v = Math.max(18, Math.min(32, +(last + step).toFixed(2)));
        next.push({ t, v });
        return next;
      });
    }, 1200);
  };

  const stop = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  useEffect(() => {
    start();
    setStatus('streaming');

    const onVisibility = () => {
      if (document.hidden) {
        stop();
        setStatus('paused');
      } else {
        start();
        setStatus('streaming');
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Build sparkline path
  const { path, min, max, latest } = useMemo(() => {
    if (data.length === 0) return { path: '', min: 0, max: 0, latest: 0 };
    const values = data.map(d => d.v);
    const min = Math.min(...values) - 0.5;
    const max = Math.max(...values) + 0.5;
    const range = Math.max(1, max - min);
    const w = 360, h = 80, padding = 4;
    const dx = (w - padding * 2) / Math.max(1, data.length - 1);

    const y = (v: number) =>
      h - padding - ((v - min) / range) * (h - padding * 2);

    let d = '';
    data.forEach((p, i) => {
      const x = padding + i * dx;
      const yy = y(p.v);
      d += i === 0 ? `M ${x} ${yy}` : ` L ${x} ${yy}`;
    });

    return { path: d, min, max, latest: values[values.length - 1] };
  }, [data]);

  return (
    <div
      className="group relative w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-700/60 dark:bg-zinc-900"
      aria-label="Live IoT sensor demo"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Sensor: Temp · Node A
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`inline-block h-2.5 w-2.5 rounded-full ${
              status === 'streaming' ? 'bg-emerald-500' : 'bg-zinc-400'
            }`}
            aria-hidden
          />
          <span className="text-zinc-600 dark:text-zinc-400">
            {status === 'streaming' ? 'Streaming' : 'Paused'}
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-white">
          {latest.toFixed(2)}°C
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          Range {min.toFixed(1)} – {max.toFixed(1)} °C (last {data.length})
        </div>
      </div>

      <svg
        viewBox="0 0 360 80"
        className="mt-2 w-full overflow-visible"
        role="img"
        aria-label="Live temperature sparkline"
      >
        <path
          d={path}
          className="stroke-sky-500"
          fill="none"
          strokeWidth="2"
        />
      </svg>

      {/* footer actions (mock) */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
        <span className="rounded-md bg-sky-500/10 px-2 py-1 font-medium text-sky-700 dark:text-sky-300">
          MQTT
        </span>
        <span className="rounded-md bg-violet-500/10 px-2 py-1 font-medium text-violet-700 dark:text-violet-300">
          WebSocket
        </span>
        <span className="rounded-md bg-emerald-500/10 px-2 py-1 font-medium text-emerald-700 dark:text-emerald-300">
          Realtime
        </span>
      </div>
    </div>
  );
}
