'use client';
// app/admin/login/page.tsx (or app/login/page.tsx — adjust to your route)
// No <Header /> or <Footer /> — this is a self-contained entry experience.

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Motion ──────────────────────────────────────────────────────────────────
const EXPO = [0.16, 1, 0.3, 1] as const;

// ─── Types ───────────────────────────────────────────────────────────────────
type AuthMode = 'password' | 'magic-link';

// ─── Line input tokens (same as Contact.tsx) ─────────────────────────────────
const lineBase =
  'w-full bg-transparent border-b py-3 text-sm text-zinc-900 dark:text-zinc-100 ' +
  'placeholder:text-zinc-400 dark:placeholder:text-zinc-600 ' +
  'focus:outline-none transition-colors duration-150 autofill:bg-transparent';
const lineNormal = 'border-zinc-300 dark:border-zinc-700 focus:border-zinc-900 dark:focus:border-zinc-100';
const lineError  = 'border-red-400 dark:border-red-500';

// ─── Live EAT clock ───────────────────────────────────────────────────────────
// Nairobi is UTC+3, no DST. Same implementation as Footer.tsx.
function EATClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const eat = new Date(Date.now() + 3 * 60 * 60 * 1000);
      const hh  = eat.getUTCHours().toString().padStart(2, '0');
      const mm  = eat.getUTCMinutes().toString().padStart(2, '0');
      const ss  = eat.getUTCSeconds().toString().padStart(2, '0');
      setTime(`${hh}:${mm}:${ss}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono tabular-nums text-sm tracking-wider text-zinc-500">
      {time || '--:--:--'}
    </span>
  );
}

// ─── Rotating brand statements ────────────────────────────────────────────────
// Cycle through these on the left panel every 4 seconds.
const STATEMENTS = [
  'Access is intentional.',
  'Content flows from here.',
  'Built with precision.',
  'The dashboard behind the work.',
];

function RotatingStatement() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setIdx(i => (i + 1) % STATEMENTS.length),
      4000
    );
    return () => clearInterval(id);
  }, []);
  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={idx}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, ease: EXPO }}
        className="font-mono text-[11px] italic text-zinc-500"
      >
        &ldquo;{STATEMENTS[idx]}&rdquo;
      </motion.p>
    </AnimatePresence>
  );
}

// ─── Left brand panel ─────────────────────────────────────────────────────────
/*
  Dark (#0A0A0A) — visible on desktop only.
  Contains: AB monogram, large "Admin Console" billboard type,
  rotating statement, live EAT clock with lime dot.
  Consistent with Footer's dark panel and colophon type treatment.
*/
function BrandPanel() {
  return (
    <div
      aria-hidden
      className="relative hidden h-full flex-col justify-between bg-[#0A0A0A] p-10 lg:flex"
    >
      {/* Top: monogram */}
      <div
        className={[
          'inline-flex h-10 w-10 items-center justify-center self-start',
          'border border-zinc-700',
          'font-heading text-[11px] font-black text-zinc-100',
        ].join(' ')}
      >
        AB
      </div>

      {/* Center: billboard type */}
      <div>
        <div className="mb-8 h-px w-full bg-zinc-800" />
        <p
          className={[
            'font-heading font-black uppercase tracking-tighter leading-[0.85]',
            'text-[4rem] text-zinc-100',
          ].join(' ')}
        >
          Admin<br />Console
        </p>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          Arden BOUET · Portfolio CMS
        </p>
        <div className="mt-6">
          <RotatingStatement />
        </div>
      </div>

      {/* Bottom: EAT clock */}
      <div className="flex items-center gap-2">
        {/* Lime availability dot — same as Hero and Footer */}
        <span className="h-1.5 w-1.5 rounded-full bg-[#CBFF4D]" />
        <EATClock />
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-700">
          EAT
        </span>
      </div>
    </div>
  );
}

// ─── Mode tab ─────────────────────────────────────────────────────────────────
// Same active-indicator pattern as NoteClient's Toc: lime underline on active.
function ModeTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'font-mono text-[10px] uppercase tracking-widest',
        'pb-1.5 border-b-2 transition-colors duration-150 focus-visible:outline-none',
        active
          ? 'border-[#CBFF4D] text-zinc-900 dark:text-zinc-50'
          : 'border-transparent text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

// ─── Client-side rate limiter ─────────────────────────────────────────────────
/*
  Tracks failed attempts in React state (resets on page reload — intentional,
  prevents persistent local lockout while still providing friction).
  Server-side rate limiting must be implemented separately in the API route.
*/
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS   = 60_000; // 60 seconds

function useRateLimit() {
  const [attempts,    setAttempts]  = useState(0);
  const [lockedUntil, setLocked]    = useState(0);
  // Use a ticking `now` so the remaining countdown re-renders every second
  const [now, setNow]               = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const isLocked  = now > 0 && now < lockedUntil;
  const remaining = Math.max(0, Math.ceil((lockedUntil - now) / 1000));

  const recordFailure = () => {
    const next = attempts + 1;
    setAttempts(next);
    if (next >= MAX_ATTEMPTS) {
      setLocked(Date.now() + LOCKOUT_MS);
    }
  };

  const reset = () => { setAttempts(0); setLocked(0); };

  return { isLocked, remaining, recordFailure, reset, attempts };
}

// ─── Thin SVG spinner ─────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
    >
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M7 1.5a5.5 5.5 0 0 1 5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── LoginForm ────────────────────────────────────────────────────────────────
// Must be inside <Suspense> because it uses useSearchParams.
function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next   = search?.get('next') ?? '/admin';

  const [mode,      setMode]      = useState<AuthMode>('password');
  const [username,  setUser]      = useState('');
  const [password,  setPass]      = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [err,       setErr]       = useState<string | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [shake,     setShake]     = useState(false);

  const rl = useRateLimit();

  // Trigger shake + set error — used for all failure paths
  const fail = (msg: string) => {
    setErr(msg);
    setShake(true);
    rl.recordFailure();
    setTimeout(() => setShake(false), 500);
  };

  // ── Password submit ───────────────────────────────────────────────────────
  async function onPasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || rl.isLocked) return;

    // Client-side validation — fail fast before network call
    if (!username.trim()) { fail('Username is required.'); return; }
    if (!password)         { fail('Password is required.'); return; }

    setLoading(true);
    setErr(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!res.ok) {
        /*
          Generic message: never reveal whether the username or password
          was incorrect — that would confirm account existence.
        */
        fail('Invalid credentials. Please try again.');
        setLoading(false);
        return;
      }

      // Success — reset limiter, redirect immediately
      rl.reset();
      router.push(next);
      router.refresh();
    } catch {
      fail('Network error. Please try again.');
      setLoading(false);
    }
  }

  // ── Magic link submit ─────────────────────────────────────────────────────
  async function onMagicSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || rl.isLocked) return;

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!username.trim() || !emailRe.test(username.trim())) {
      fail('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      await fetch('/api/admin/magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: username.trim() }),
      });
      /*
        Always show success — never reveal whether the email exists
        in the system. The API should apply the same principle server-side.
      */
      setMagicSent(true);
    } catch {
      fail('Failed to send. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Lockout screen ────────────────────────────────────────────────────────
  if (rl.isLocked) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="border border-zinc-300 dark:border-zinc-700 p-5"
      >
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 mb-1">
          Form locked
        </p>
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Too many failed attempts. Try again in{' '}
          <strong className="tabular-nums">{rl.remaining}s</strong>.
        </p>
      </motion.div>
    );
  }

  // ── Magic link success ────────────────────────────────────────────────────
  if (magicSent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EXPO }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 mb-5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#CBFF4D]" aria-hidden />
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            Link sent
          </p>
        </div>
        <p className="font-heading text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Check your inbox.
        </p>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          A magic link was sent to{' '}
          <strong className="text-zinc-900 dark:text-zinc-50">{username}</strong>.
          Click it to sign in — it expires in 15 minutes.
        </p>
        <button
          type="button"
          onClick={() => { setMagicSent(false); setUser(''); }}
          className="mt-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150"
        >
          ← Try a different email
        </button>
      </motion.div>
    );
  }

  return (
    <div>
      {/* ── Mode toggle ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-5 mb-8">
        <ModeTab
          active={mode === 'password'}
          label="Password"
          onClick={() => { setMode('password'); setErr(null); }}
        />
        <ModeTab
          active={mode === 'magic-link'}
          label="Magic Link"
          onClick={() => { setMode('magic-link'); setErr(null); }}
        />
      </div>

      {/* ── Form — AnimatePresence for mode switch, motion.div for shake ─ */}
      <AnimatePresence mode="wait">
        <motion.form
          key={mode}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.22, ease: EXPO }}
          onSubmit={mode === 'password' ? onPasswordSubmit : onMagicSubmit}
          className="space-y-6"
          noValidate
        >
          {/*
            Shake wrapper: `animate` only fires when shake=true.
            The array of x values creates a back-and-forth tremor effect.
          */}
          <motion.div
            animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="space-y-6"
          >
            {/* Username / Email */}
            <div>
              <label
                htmlFor="auth-user"
                className="block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 mb-1"
              >
                {mode === 'magic-link' ? 'Email address' : 'Username'}
              </label>
              <input
                id="auth-user"
                type={mode === 'magic-link' ? 'email' : 'text'}
                name={mode === 'magic-link' ? 'email' : 'username'}
                autoComplete={mode === 'magic-link' ? 'email' : 'username'}
                value={username}
                onChange={e => setUser(e.target.value)}
                placeholder={mode === 'magic-link' ? 'you@example.com' : 'admin'}
                required
                className={`${lineBase} ${err && !username.trim() ? lineError : lineNormal}`}
              />
            </div>

            {/* Password field — only in password mode, animated in/out */}
            <AnimatePresence>
              {mode === 'password' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.25, ease: EXPO }}
                >
                  <label
                    htmlFor="auth-pass"
                    className="block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="auth-pass"
                      type={showPass ? 'text' : 'password'}
                      name="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={e => setPass(e.target.value)}
                      required
                      className={`${lineBase} pr-10 ${err && !password ? lineError : lineNormal}`}
                    />

                    {/* Show/hide toggle — square bordered icon, consistent with system */}
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      aria-pressed={showPass}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                      className={[
                        'absolute bottom-2 right-0',
                        'inline-flex h-7 w-7 items-center justify-center',
                        'border border-zinc-200 dark:border-zinc-800',
                        'text-zinc-400 dark:text-zinc-500',
                        'hover:border-zinc-900 hover:text-zinc-900',
                        'dark:hover:border-zinc-100 dark:hover:text-zinc-100',
                        'transition-colors duration-150 focus-visible:outline-none',
                      ].join(' ')}
                    >
                      {showPass ? (
                        /* Eye-slash — hide */
                        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                          <path d="M2.22 2.22a.75.75 0 0 0-1.06 1.06l1.76 1.76C1.54 6.23.75 7.2.75 8c0 .6 1.19 2.4 3.25 3.54l-1.78 1.78a.75.75 0 1 0 1.06 1.06l12-12a.75.75 0 0 0-1.06-1.06L12.1 3.44A8.1 8.1 0 0 0 8 2.5C4.25 2.5 1.25 5.5.75 8zm4.06 4.06 3.46 3.46A2.25 2.25 0 0 1 6.28 6.28zm8.46 5.66a.75.75 0 0 0-.08-1.05C13.09 9.8 11.82 9 10.5 8.5a.75.75 0 0 0-.56 1.39c.97.4 1.97 1.04 2.75 1.8a.75.75 0 0 0 1.05-.08z" />
                        </svg>
                      ) : (
                        /* Eye — show */
                        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                          <path d="M8 3C4.25 3 1.25 6 .75 8c.5 2 3.5 5 7.25 5S14.75 10 15.25 8C14.75 6 11.75 3 8 3zm0 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0-5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error — monospace, fades in */}
            <AnimatePresence>
              {err && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  role="alert"
                  className="font-mono text-[10px] uppercase tracking-widest text-red-500 dark:text-red-400"
                >
                  {err}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || rl.isLocked}
            className={[
              'w-full py-3.5',
              'font-mono text-[11px] uppercase tracking-widest',
              'transition-colors duration-150 focus-visible:outline-none',
              loading || rl.isLocked
                ? [
                    'border border-zinc-200 dark:border-zinc-800',
                    'bg-zinc-100 dark:bg-zinc-900',
                    'text-zinc-400 dark:text-zinc-600',
                    'cursor-not-allowed',
                  ].join(' ')
                : [
                    'border border-zinc-900 dark:border-zinc-100',
                    'bg-zinc-900 dark:bg-zinc-50',
                    'text-white dark:text-zinc-900',
                    'hover:bg-zinc-700 dark:hover:bg-zinc-200',
                  ].join(' '),
            ].join(' ')}
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Spinner />
                {mode === 'magic-link' ? 'Sending…' : 'Signing in…'}
              </span>
            ) : mode === 'magic-link' ? (
              'Send magic link →'
            ) : (
              'Sign in →'
            )}
          </button>

          {/* Attempt counter — only shown after 2 failures */}
          <AnimatePresence>
            {rl.attempts >= 2 && !rl.isLocked && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600"
              >
                {MAX_ATTEMPTS - rl.attempts} attempt
                {MAX_ATTEMPTS - rl.attempts !== 1 ? 's' : ''} remaining
              </motion.p>
            )}
          </AnimatePresence>
        </motion.form>
      </AnimatePresence>
    </div>
  );
}

// ─── Full page layout ─────────────────────────────────────────────────────────
// Wrapped in Suspense because LoginForm calls useSearchParams.
function AdminLoginContent() {
  return (
    /*
      Full-screen split:
        Left  (lg:50%): dark brand panel — hidden on mobile
        Right (lg:50%): form on warm paper bg

      Mobile: full-viewport right panel only, with mobile-only monogram.
    */
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

      {/* ── LEFT: Brand panel (desktop only) ─────────────────────────── */}
      <BrandPanel />

      {/* ── RIGHT: Form panel ────────────────────────────────────────── */}
      <div
        className={[
          'flex items-center justify-center',
          'bg-[#F5F4F0] dark:bg-zinc-950',
          'px-8 py-16 lg:px-14',
        ].join(' ')}
      >
        <div className="w-full max-w-sm">

          {/* Mobile monogram — only visible when left panel is hidden */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div
              className={[
                'inline-flex h-8 w-8 items-center justify-center',
                'border border-zinc-900 dark:border-zinc-100',
                'font-heading text-[10px] font-black text-zinc-900 dark:text-zinc-50',
              ].join(' ')}
            >
              AB
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Admin Console
            </span>
          </div>

          {/* Section header — ruled lines (same as Hero/Projects/Journey) */}
          <div className="mb-8">
            <div className="h-px w-full bg-zinc-300 dark:bg-zinc-700" />
            <div className="flex items-baseline justify-between py-4">
              <h1 className="font-heading text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
                Sign In
              </h1>
              <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                Authorized only
              </p>
            </div>
            <div className="h-px w-full bg-zinc-300 dark:bg-zinc-700" />
          </div>

          {/* Form — inside Suspense because of useSearchParams */}
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

// ─── Default export ───────────────────────────────────────────────────────────
export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        /* Skeleton that matches the final layout exactly — no layout shift */
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
          <div className="hidden lg:block bg-[#0A0A0A]" aria-hidden />
          <div className="flex items-center justify-center bg-[#F5F4F0] dark:bg-zinc-950 px-8 py-16 lg:px-14">
            <div className="w-full max-w-sm space-y-4 animate-pulse">
              <div className="h-px w-full bg-zinc-300" />
              <div className="h-6 w-20 bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-px w-full bg-zinc-300" />
              <div className="mt-8 h-8 w-28 bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 mt-4" />
              <div className="h-12 w-full bg-zinc-200 dark:bg-zinc-800 mt-6" />
            </div>
          </div>
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}