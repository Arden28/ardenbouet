'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();               // must be inside Suspense
  const next = search?.get('next') || '/admin';

  const [username, setUser] = useState('');
  const [password, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);     // 👈 NEW
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErr(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        setErr('Invalid credentials');
        setLoading(false);
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setErr('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4">
      <div className="w-full rounded-2xl border border-zinc-200/70 bg-white/90 p-6 shadow-lg backdrop-blur dark:border-zinc-700/50 dark:bg-zinc-900/80">
        <div className="mb-4">
          <h1 className="text-2xl font-extrabold">
            <span className="bg-gradient-to-r from-black to-[color:var(--brand)] bg-clip-text text-transparent dark:from-white dark:to-[color:var(--brand)]">
              Admin Console
            </span>
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Sign in to manage site content.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Username
            </label>
            <input
              name="username"
              autoComplete="username"
              className="mt-1 w-full rounded-lg border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm text-zinc-800 shadow-sm backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] dark:border-zinc-700/50 dark:bg-zinc-900/70 dark:text-zinc-200"
              value={username}
              onChange={(e) => setUser(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Password
            </label>

            {/* Input + show/hide button */}
            <div className="mt-1 relative">
              <input
                name="password"
                type={showPass ? 'text' : 'password'}  // 👈 NEW
                autoComplete="current-password"
                className="w-full rounded-lg border border-zinc-200/70 bg-white/80 px-3 py-2 pr-10 text-sm text-zinc-800 shadow-sm backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)] dark:border-zinc-700/50 dark:bg-zinc-900/70 dark:text-zinc-200"
                value={password}
                onChange={(e) => setPass(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                aria-pressed={showPass}
                aria-label={showPass ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 mr-2 my-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {err && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-md px-4 py-2 text-sm font-semibold text-white transition ${
              loading ? 'bg-zinc-400' : 'bg-[color:var(--brand)] hover:opacity-95'
            }`}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="pointer-events-none mt-6 h-1 w-full overflow-hidden rounded-full bg-zinc-200/60 dark:bg-zinc-700/50">
          <div className="h-full w-1/3 animate-marquee bg-[color:var(--brand)]/30" />
        </div>
      </div>
    </section>
  );
}

export default function AdminLoginPage() {
  // Wrap the component that calls useSearchParams in Suspense
  return (
    <Suspense
      fallback={
        <section className="mx-auto flex min-h-[70vh] max-w-md items-center px-4">
          <div className="w-full rounded-2xl border border-zinc-200/70 bg-white/90 p-6 shadow-lg backdrop-blur dark:border-zinc-700/50 dark:bg-zinc-900/80">
            <div className="h-6 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-6 h-8 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </section>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
