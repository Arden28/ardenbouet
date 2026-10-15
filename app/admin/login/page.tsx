'use client';
// /admin/login — owner sign-in (separate from reader social sign-in).
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';
import '@/app/blog/story.css';

function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const next = (params.get('next') || '/admin').startsWith('/admin') ? params.get('next') || '/admin' : '/admin';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [failures, setFailures] = useState(0);
  const locked = failures >= 5;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || locked) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!res.ok) {
        setFailures(f => f + 1);
        // A 500 means the server is missing ADMIN_USER / ADMIN_PASS — not a wrong password.
        setError(res.status === 500 ? 'Admin login is not configured on this server (set ADMIN_USER and ADMIN_PASS).' : 'Invalid username or password.');
        setBusy(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setBusy(false);
    }
  };

  return (
    <main className="blog-ui flex min-h-screen items-center justify-center bg-[#fafafa] px-6">
      <div className="w-full max-w-[400px]">
        <p className="text-center font-story text-[34px] font-bold tracking-[-0.02em] text-[#242424]">Arden</p>
        <form onSubmit={submit} className="mt-8 rounded-2xl border border-[#ececec] bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <h1 className="flex items-center gap-2 text-[18px] font-semibold text-[#242424]"><Lock className="h-4 w-4" /> Admin sign in</h1>
          <label className="mt-6 block">
            <span className="text-[13px] font-medium text-[#242424]">Username</span>
            <input autoFocus autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required
              className="mt-1.5 w-full rounded-lg border border-[#e6e6e6] px-3 py-2.5 text-[15px] outline-none focus:border-[#242424]" />
          </label>
          <label className="mt-4 block">
            <span className="text-[13px] font-medium text-[#242424]">Password</span>
            <input type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required
              className="mt-1.5 w-full rounded-lg border border-[#e6e6e6] px-3 py-2.5 text-[15px] outline-none focus:border-[#242424]" />
          </label>
          {error && <p className="mt-4 text-[13px] text-[#c94a4a]" role="alert">{error}</p>}
          {locked && <p className="mt-2 text-[13px] text-[#c94a4a]">Too many attempts. Reload the page to try again.</p>}
          <button type="submit" disabled={busy || locked} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#242424] py-3 text-[15px] font-medium text-white hover:bg-black disabled:opacity-50">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
          </button>
        </form>
        <p className="mt-6 text-center text-[13px] text-[#9b9b9b]"><a href="/" className="hover:text-[#242424]">← Back to the site</a></p>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return <Suspense><Login /></Suspense>;
}
