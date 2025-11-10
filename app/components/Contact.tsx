'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

type Chip = 'SaaS build' | 'API integration' | 'IoT/Telemetry' | 'UI/Frontend' | 'Consultation';

function MailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" {...props}>
      <path fill="currentColor" d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm2 0 7 4 7-4H5Z" />
    </svg>
  );
}
function LinkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" {...props}>
      <path fill="currentColor" d="M10.59 13.41a1 1 0 0 0 1.41 1.41l4.59-4.59a3 3 0 1 0-4.24-4.24L10 7.34a1 1 0 1 0 1.41 1.41l2-2a1 1 0 0 1 1.41 1.41l-4.59 4.59Zm2.82-2.82a1 1 0 0 0-1.41-1.41L7 13.17a3 3 0 0 0 4.24 4.24l2.35-2.35a1 1 0 1 0-1.41-1.41l-2.35 2.35A1 1 0 1 1 7 13.17l6.41-6.58Z"/>
    </svg>
  );
}

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" {...props}>
      <path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48l-.01-1.69c-2.78.61-3.37-1.2-3.37-1.2-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.04 1.53 1.04.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.1.63-1.36-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .85-.27 2.8 1.02a9.7 9.7 0 0 1 5.1 0c1.95-1.29 2.8-1.02 2.8-1.02.54 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.69-4.57 4.94.36.31.68.92.68 1.86l-.01 2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/>
    </svg>
  );
}

function LinkedInIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" {...props}>
      <path fill="currentColor" d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8.98h5V24H0zM8.98 8.98H14v2.05h.07c.7-1.33 2.4-2.73 4.93-2.73 5.27 0 6.24 3.47 6.24 7.99V24h-5v-6.66c0-1.59-.03-3.64-2.22-3.64-2.22 0-2.56 1.73-2.56 3.52V24h-5V8.98z"/>
    </svg>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4" {...props}>
      <path fill="currentColor" d="M9 16.17 4.83 12 3.41 13.41 9 19l12-12-1.41-1.41z"/>
    </svg>
  );
}

export const Contact = () => {
  // ---- state ----
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [chips, setChips] = useState<Chip[]>([]);
  const [timeframe, setTimeframe] = useState<'soon'|'this quarter'|'flexible'>('flexible');
  const [budget, setBudget] = useState(3); // 1..5
  const [copied, setCopied] = useState(false);

  // ---- derived ----
  const budgetLabel = useMemo(() => ['< $1k', '$1–3k', '$3–8k', '$8–20k', '$20k+'][budget-1], [budget]);
  const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  const canSend = !!(name.trim() && isEmailValid && message.trim());
  const messageCount = message.length;
  const messageLimit = 1200;

  const toggleChip = (c: Chip) =>
    setChips(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  // ---- submit ----
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    const subj = encodeURIComponent(`New inquiry from ${name} (${timeframe}, ${budgetLabel})`);
    const body = encodeURIComponent(
`Hi Arden,

${message}

— Project chips: ${chips.join(', ') || '—'}
— Timeframe: ${timeframe}
— Budget: ${budgetLabel}

From: ${name}
Email: ${email}`
    );
    window.location.href = `mailto:laudbouetoumoussa@koverae.com?subject=${subj}&body=${body}`;
  };

  // ---- copy email ----
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('laudbouetoumoussa@koverae.com');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  // ---- soft reveal on scroll ----
  const sectionRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>('.reveal'));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => { if (en.isIntersecting) en.target.classList.add('in'); });
      },
      { threshold: 0.08 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section id="contact" ref={sectionRef} className="mx-auto mt-20 max-w-6xl px-4 pb-20 sm:pb-24">
      <h2 className="reveal text-left text-2xl font-extrabold">
        <span className="bg-gradient-to-r from-black to-[color:var(--brand)] bg-clip-text text-transparent dark:from-white dark:to-[color:var(--brand)]">
          Let’s build something reliable
        </span>
      </h2>
      <p className="reveal mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
        Tell me the problem, constraints, and desired outcomes—I'll propose a pragmatic path to production.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-5">
        {/* Left: Contact methods / pitch */}
        <aside className="reveal md:col-span-2 engineer-grid scanline p-4 sm:p-5">
          {/* animated nodes (softer) */}
          <div className="node node-soft" style={{ left: '10%', top: '20%' }} />
          <div className="node node-soft" style={{ right: '10%', top: '40%' }} />
          <div className="node node-soft" style={{ left: '16%', bottom: '22%' }} />
          <div className="node node-soft" style={{ right: '16%', bottom: '12%' }} />

          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            Direct lines
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <div className="flex items-stretch gap-2">
                <a
                  href="mailto:laudbouetoumoussa@koverae.com"
                  className="group inline-flex flex-1 items-center gap-2 rounded-md border border-zinc-200/70 bg-white px-3 py-2 text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700/50 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/60"
                >
                  <MailIcon className="text-[color:var(--brand)] h-[20px]" />
                  laudbouetoumoussa@koverae.com
                </a>
                <button
                  onClick={copyEmail}
                  type="button"
                  className="inline-flex items-center rounded-md border border-zinc-200/70 bg-white px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700/50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
                  aria-label="Copy email"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </li>
            <li>
              <Link
                href="https://www.linkedin.com/in/arden-bouet/"
                target="_blank"
                className="group inline-flex items-center gap-2 rounded-md border border-zinc-200/70 bg-white px-3 py-2 text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700/50 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/60"
              >
                <LinkedInIcon className="text-[color:var(--brand)] h-[20px]" />
                LinkedIn
              </Link>
            </li>
            <li>
              <Link
                href="https://github.com/arden28"
                target="_blank"
                className="group inline-flex items-center gap-2 rounded-md border border-zinc-200/70 bg-white px-3 py-2 text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700/50 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/60"
              >
                <GithubIcon className="text-[color:var(--brand)] h-[20px]" />
                GitHub
              </Link>
            </li>
          </ul>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Good fits</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                'Production web apps (Laravel, Next.js, React)',
                'APIs, billing, auth, multi-tenant',
                'IoT telemetry, dashboards, alerts',
              ].map((txt) => (
                <span
                  key={txt}
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-200/70 bg-white px-3 py-1.5 text-xs text-zinc-800 dark:border-zinc-700/50 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  <CheckIcon className="text-[color:var(--brand)] h-[20px]" />
                  {txt}
                </span>
              ))}
            </div>
          </div>
        </aside>

        {/* Right: Form */}
        <div className="reveal md:col-span-3 engineer-grid scanline p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Your name</label>
                <input
                  className="input mt-1"
                  value={name}
                  onChange={e=>setName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Email</label>
                <input
                  type="email"
                  className={`input mt-1 ${email && !isEmailValid ? 'ring-2 ring-red-400' : ''}`}
                  value={email}
                  onChange={e=>setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  aria-invalid={!!(email && !isEmailValid)}
                  required
                />
                {email && !isEmailValid && (
                  <p className="mt-1 text-xs text-red-500">Enter a valid email.</p>
                )}
              </div>
            </div>

            {/* chips */}
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">I’m looking for</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(['SaaS build','API integration','IoT/Telemetry','UI/Frontend','Consultation'] as Chip[]).map(c => {
                  const pressed = chips.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={()=>toggleChip(c)}
                      aria-pressed={pressed}
                      className="chip-btn transition"
                    >
                      {pressed && <CheckIcon className="text-[color:var(--brand)] h-[20px]" />}
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* timeframe + budget */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Timeframe</label>
                <select
                  className="input mt-1"
                  value={timeframe}
                  onChange={e=>setTimeframe(e.target.value as any)}
                >
                  <option value="soon">ASAP / this month</option>
                  <option value="this quarter">This quarter</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
              <div>
                <label className="flex items-center justify-between text-xs font-medium text-zinc-600 dark:text-zinc-400">
                  <span>Budget (rough)</span>
                  <span className="rounded-full bg-[color:var(--brand-soft)] px-2 py-[2px] text-[11px] text-zinc-800 dark:text-zinc-200">
                    {budgetLabel}
                  </span>
                </label>
                <input
                  type="range" min={1} max={5} step={1}
                  value={budget}
                  onChange={e=>setBudget(parseInt(e.target.value))}
                  className="mt-3 w-full accent-[color:var(--brand)]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Tell me about the problem</label>
              <textarea
                className="input mt-1 min-h-[140px]"
                value={message}
                onChange={e=>setMessage(e.target.value.slice(0, messageLimit))}
                placeholder="What are we building? Who’s it for? Any constraints (time, budget, stack)?"
                required
              />
              <div className="mt-1 text-right text-[11px] text-zinc-500 dark:text-zinc-400">
                {messageCount}/{messageLimit}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Your email client will open with the message prefilled. No spam, ever.
              </p>
              <button
                type="submit"
                disabled={!canSend}
                className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold text-white transition ${canSend ? 'bg-[color:var(--brand)] hover:opacity-95' : 'bg-zinc-400 cursor-not-allowed'}`}
              >
                Send message
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

// Optional named alias if you prefer named import
export const ContactSection = Contact;
