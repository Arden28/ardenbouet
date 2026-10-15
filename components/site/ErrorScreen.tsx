// Shared layout for error pages (404, 500, 403, 503): words on the left, an animated illustration on the right.
// Server-safe (no hooks); interactive bits are passed in as `actions`.
import type { ReactNode } from 'react';

export type ErrorKind = 404 | 500 | 403 | 503;

const DOT: Record<ErrorKind, string> = { 404: 'bg-[#2467ac]', 500: 'bg-[#c94a4a]', 403: 'bg-[#e3a008]', 503: 'bg-[#1a8917]' };

export function ErrorScreen({ code, eyebrow, title, body, actions, children }: {
  code: ErrorKind; eyebrow: string; title: string; body: string; actions?: ReactNode; children?: ReactNode;
}) {
  return (
    <main className="blog-ui err-grid relative overflow-hidden">
      <div className="mx-auto grid min-h-[calc(100vh-140px)] max-w-[1120px] items-center gap-8 px-6 py-12 sm:py-16 lg:gap-12 lg:grid-cols-[minmax(0,1fr)_460px] lg:gap-16">
        <div className="err-rise max-w-[560px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ececec] bg-white px-3 py-1 text-[13px] font-medium text-[#6b6b6b]">
            <span className={`h-2 w-2 rounded-full ${DOT[code]} ${code === 500 || code === 503 ? 'animate-pulse' : ''}`} />
            {eyebrow}
          </span>
          <h1 className="mt-6 font-story text-[44px] font-semibold leading-[1.04] tracking-[-0.02em] text-[#242424] sm:text-[58px]">{title}</h1>
          <p className="mt-5 max-w-[480px] text-[18px] leading-[1.6] text-[#6b6b6b]">{body}</p>
          {actions && <div className="mt-9 flex flex-wrap items-center gap-3">{actions}</div>}
          {children}
        </div>
        <div className="err-rise relative order-first mx-auto w-full max-w-[300px] [animation-delay:120ms] sm:max-w-[380px] lg:order-none lg:max-w-[460px]" aria-hidden>
          <span className="pointer-events-none absolute inset-0 flex select-none items-center justify-center font-story text-[200px] font-bold leading-none tracking-[-0.06em] text-[#f4f4f4] sm:text-[240px]">{code}</span>
          <div className="relative">
            {code === 404 ? <LostRoute /> : code === 500 ? <BrokenRack /> : code === 403 ? <LockedDoor /> : <Maintenance />}
          </div>
        </div>
      </div>
    </main>
  );
}

export const errBtnPrimary = 'inline-flex items-center gap-2 rounded-full bg-[#242424] px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-black';
export const errBtnGhost = 'inline-flex items-center gap-2 rounded-full border border-[#d4d4d4] px-5 py-2.5 text-[15px] text-[#242424] transition-colors hover:border-[#242424]';

// ─── Illustrations ───────────────────────────────────────────────────────────
// Strokes use currentColor (text-[#242424] → light in dark mode); fills use palette classes covered by dark.css.

/** 404 — a route drawn across a city map that runs off the edge, with the destination pin nowhere to be found. */
function LostRoute() {
  return (
    <svg viewBox="0 0 400 320" className="w-full text-[#242424]" fill="none">
      <rect x="20" y="20" width="360" height="280" rx="28" className="fill-[#fafafa] stroke-[#ececec]" strokeWidth="2" />
      {/* city blocks */}
      {[[50, 50, 70, 50], [140, 50, 90, 50], [250, 50, 100, 70], [50, 120, 60, 80], [130, 125, 80, 45], [230, 140, 50, 60], [300, 140, 50, 60], [50, 220, 110, 50], [180, 215, 70, 55], [270, 225, 80, 45]].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx="8" className="fill-[#f2f2f2]" />
      ))}
      {/* the route */}
      <path d="M70 250 C 70 200, 120 200, 120 180 S 170 110, 220 112 S 290 120, 300 100 S 340 60, 392 40"
        stroke="#2467ac" strokeWidth="5" strokeLinecap="round" className="err-route" />
      <path d="M70 250 C 70 200, 120 200, 120 180 S 170 110, 220 112 S 290 120, 300 100 S 340 60, 392 40"
        stroke="#2467ac" strokeWidth="14" strokeLinecap="round" opacity="0.12" className="err-route" />
      {/* start */}
      <circle cx="70" cy="250" r="10" fill="#1a8917" />
      <circle cx="70" cy="250" r="10" fill="#1a8917" className="err-ping" />
      <circle cx="70" cy="250" r="4" fill="#ffffff" />
      {/* where the destination should be */}
      <g className="err-float">
        <path d="M200 205c0-14 11-25 25-25s25 11 25 25c0 18-25 40-25 40s-25-22-25-40z" className="fill-[#fcfcfc]" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 6" />
        <text x="225" y="214" textAnchor="middle" fontSize="22" fontWeight="700" fill="currentColor" fontFamily="Georgia, serif">?</text>
      </g>
      <ellipse cx="225" cy="268" rx="16" ry="4" className="fill-[#e6e6e6] err-shadow" />
    </svg>
  );
}

/** 500 — a three-unit server rack; the bottom unit blinks red and smokes. */
function BrokenRack() {
  return (
    <svg viewBox="0 0 400 320" className="w-full text-[#242424]" fill="none">
      <ellipse cx="200" cy="292" rx="120" ry="10" className="fill-[#f2f2f2]" />
      {[0, 1, 2].map(i => {
        const y = 70 + i * 70;
        const bad = i === 2;
        return (
          <g key={i} className={bad ? 'err-shake' : ''}>
            <rect x="90" y={y} width="220" height="58" rx="14" className="fill-[#fcfcfc]" stroke="currentColor" strokeWidth="3" />
            {[0, 1, 2, 3].map(j => <rect key={j} x={112 + j * 16} y={y + 22} width="8" height="14" rx="3" className="fill-[#ececec]" />)}
            <circle cx="262" cy={y + 29} r="6" fill={bad ? '#c94a4a' : '#1a8917'} className={bad ? 'err-blink-fast' : 'err-blink'} style={{ animationDelay: `${i * 0.4}s` }} />
            <circle cx="284" cy={y + 29} r="6" fill={bad ? '#c94a4a' : '#1a8917'} className={bad ? 'err-blink-fast' : 'err-blink'} style={{ animationDelay: `${i * 0.4 + 0.7}s` }} />
          </g>
        );
      })}
      {/* crack + smoke from the bad unit */}
      <path d="M190 210 l10 12 -8 8 12 14" stroke="#c94a4a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {[0, 1, 2].map(i => <circle key={i} cx={300 + i * 6} cy="200" r={10 + i * 4} className="fill-[#e6e6e6] err-smoke" style={{ animationDelay: `${i * 0.9}s` }} />)}
    </svg>
  );
}

/** 403 — a closed door with a swinging padlock. */
function LockedDoor() {
  return (
    <svg viewBox="0 0 400 320" className="w-full text-[#242424]" fill="none">
      <ellipse cx="200" cy="296" rx="130" ry="9" className="fill-[#f2f2f2]" />
      <rect x="120" y="30" width="160" height="262" rx="10" className="fill-[#fafafa]" stroke="currentColor" strokeWidth="3" />
      <rect x="138" y="48" width="124" height="104" rx="6" className="stroke-[#e6e6e6]" strokeWidth="3" />
      <rect x="138" y="168" width="124" height="104" rx="6" className="stroke-[#e6e6e6]" strokeWidth="3" />
      <circle cx="250" cy="165" r="7" fill="currentColor" />
      {/* padlock hanging from the handle */}
      <g className="err-swing" style={{ transformOrigin: '250px 165px' }}>
        <path d="M236 192v-12a14 14 0 0128 0v12" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <rect x="224" y="190" width="52" height="44" rx="10" fill="#e3a008" />
        <circle cx="250" cy="207" r="5" fill="#ffffff" />
        <rect x="248" y="208" width="4" height="12" rx="2" fill="#ffffff" />
      </g>
    </svg>
  );
}

/** 503 — a turning gear behind a striped barrier and a traffic cone. */
function Maintenance() {
  const teeth = Array.from({ length: 10 }, (_, i) => i * 36);
  return (
    <svg viewBox="0 0 400 320" className="w-full text-[#242424]" fill="none">
      <ellipse cx="200" cy="292" rx="140" ry="10" className="fill-[#f2f2f2]" />
      <g className="err-spin" style={{ transformOrigin: '250px 120px' }}>
        {teeth.map(a => <rect key={a} x="242" y="52" width="16" height="22" rx="4" className="fill-[#ececec]" transform={`rotate(${a} 250 120)`} />)}
        <circle cx="250" cy="120" r="52" className="fill-[#ececec]" />
        <circle cx="250" cy="120" r="20" className="fill-[#fcfcfc]" stroke="currentColor" strokeWidth="3" />
      </g>
      {/* barrier */}
      <rect x="60" y="180" width="240" height="40" rx="8" className="fill-[#fcfcfc]" stroke="currentColor" strokeWidth="3" />
      <clipPath id="bar"><rect x="62" y="182" width="236" height="36" rx="6" /></clipPath>
      <g clipPath="url(#bar)">{Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${50 + i * 32} 230 l30 -60 h16 l-30 60z`} fill="#e3a008" />)}</g>
      <path d="M90 220v70M270 220v70" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      {/* cone */}
      <path d="M330 288l-22-110h-8l-22 110z" fill="#e3a008" />
      <path d="M296 220h32M292 250h40" stroke="#ffffff" strokeWidth="9" />
      <rect x="268" y="284" width="72" height="10" rx="4" fill="currentColor" />
    </svg>
  );
}
