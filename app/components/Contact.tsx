'use client';

import { useRef, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { Mail, Phone, Github, Linkedin, Copy, Check, Loader2, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────
type Chip = 'SaaS build' | 'API integration' | 'IoT/Telemetry' | 'UI/Frontend' | 'Consultation';

// ─── Motion ──────────────────────────────────────────────────────────────────
const EXPO = [0.16, 1, 0.3, 1] as const;

// "Curtain reveal" — text slides up from below a clipped container.
// Each line is separate so they stagger independently.
const lineVariants = {
  hidden: { y: '115%' },
  show:   (i: number) => ({
    y: '0%',
    transition: { duration: 0.85, ease: EXPO, delay: i * 0.13 },
  }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.65, ease: EXPO, delay: i * 0.1 },
  }),
};

// ─── Design primitives ───────────────────────────────────────────────────────
function Rule({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}

// ─── Magnetic social link ─────────────────────────────────────────────────────
/*
  On hover, the inner icon/content pulls gently toward the cursor.
  The outer border/container stays fixed — only the child translates.
*/
function MagneticLink({
  href,
  label,
  external = true,
  children,
}: {
  href: string;
  label: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 240, damping: 22 });
  const sy = useSpring(y, { stiffness: 240, damping: 22 });

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.38);
    y.set((e.clientY - r.top - r.height / 2) * 0.38);
  };
  const onMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <div
      ref={wrapRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative"
    >
      <Link
        href={href}
        aria-label={label}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className={[
          'inline-flex h-10 w-10 items-center justify-center',
          'border border-zinc-200 dark:border-zinc-800',
          'text-zinc-500 dark:text-zinc-400',
          'hover:border-zinc-900 hover:text-zinc-900',
          'dark:hover:border-zinc-100 dark:hover:text-zinc-100',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-900',
        ].join(' ')}
      >
        <motion.span
          style={{ x: sx, y: sy }}
          className="inline-flex items-center justify-center"
        >
          {children}
        </motion.span>
      </Link>
    </div>
  );
}

// ─── Inline copy button ───────────────────────────────────────────────────────
function CopyButton({
  onCopy,
  copied,
  label,
}: {
  onCopy: () => void;
  copied: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={label}
      className={[
        'inline-flex h-7 w-7 items-center justify-center shrink-0',
        'border border-zinc-200 dark:border-zinc-800',
        'text-zinc-400 dark:text-zinc-500',
        'hover:border-zinc-900 hover:text-zinc-900',
        'dark:hover:border-zinc-100 dark:hover:text-zinc-100',
        'transition-colors duration-150',
      ].join(' ')}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Check className="h-3 w-3 text-[#2467AC]" />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Copy className="h-3 w-3" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// ─── Shared line-input class ──────────────────────────────────────────────────
// Replaces all boxed inputs with a clean underline-only style.
const lineInputBase =
  'w-full bg-transparent border-b py-3 text-sm text-zinc-900 dark:text-zinc-100 ' +
  'placeholder:text-zinc-400 dark:placeholder:text-zinc-600 ' +
  'focus:outline-none transition-colors duration-150';

const lineInputNormal = 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100';
const lineInputError   = 'border-red-400 dark:border-red-500';

// ─── Main component ───────────────────────────────────────────────────────────
export const Contact = () => {
  // ── Form state (unchanged) ─────────────────────────────────────────────────
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [message, setMessage]     = useState('');
  const [chips, setChips]         = useState<Chip[]>([]);
  const [timeframe, setTimeframe] = useState<'soon' | 'this quarter' | 'flexible'>('flexible');
  const [budget, setBudget]       = useState(3);
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched]     = useState<{ email?: boolean; name?: boolean; message?: boolean }>({});

  const [emailCopied, setEmailCopied] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);

  const budgetLabel = useMemo(
    () => ['< $500', '$500 – 2k', '$2 – 8k', '$8 – 20k', '$20k +'][budget - 1],
    [budget]
  );
  const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  const canSend      = !!(name.trim() && isEmailValid && message.trim());
  const messageLimit = 1200;

  const toggleChip = (c: Chip) =>
    setChips(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  // ── Submit (mailto — unchanged) ────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend || submitting) return;
    setSubmitting(true);

    const subj = encodeURIComponent(`Project Inquiry: ${name}`);
    const body = encodeURIComponent(
`Hi Arden,

${message}

-----------------------------------
DETAILS
-----------------------------------
• Services: ${chips.join(', ') || 'N/A'}
• Timeframe: ${timeframe}
• Budget Range: ${budgetLabel}
• Contact: ${name} (${email})
`
    );
    setTimeout(() => {
      window.location.href = `mailto:laudbouetoumoussa@gmail.com?subject=${subj}&body=${body}`;
      setSubmitting(false);
    }, 800);
  };

  // ── Copy handlers (unchanged) ──────────────────────────────────────────────
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('laudbouetoumoussa@gmail.com');
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch {}
  };
  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText('+254 745 908 026');
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 2000);
    } catch {}
  };

  return (
    <section id="contact" className="relative mx-auto mt-24 max-w-6xl px-4 pb-24 sm:pb-32">

      {/* ── Section rule ─────────────────────────────────────────────── */}
      <Rule />

      {/* ── Billboard headline — two-line clipped curtain reveal ──────── */}
      {/*
        Each line is wrapped in overflow-hidden so the upward slide creates
        a clean "theatre curtain" effect. Stagger: line 1, then line 2.
      */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="py-6 sm:py-8"
      >
        <div className="overflow-hidden">
          <motion.p
            custom={0}
            variants={lineVariants}
            className={[
              'font-heading font-black uppercase tracking-tighter leading-[0.88]',
              'text-[3rem] sm:text-[3.5rem] lg:text-[4.5rem] xl:text-[5.5rem]',
              'text-zinc-900 dark:text-zinc-50',
            ].join(' ')}
          >
            Let&apos;s Build
          </motion.p>
        </div>
        <div className="overflow-hidden">
          <motion.p
            custom={1}
            variants={lineVariants}
            className={[
              'font-heading font-black uppercase tracking-tighter leading-[0.88]',
              'text-[3rem] sm:text-[4.5rem] lg:text-[5.5rem] xl:text-[6.5rem]',
              'text-zinc-900 dark:text-zinc-50',
            ].join(' ')}
          >
            Something Reliable.
          </motion.p>
        </div>
      </motion.div>

      <Rule />

      {/* ── Body grid ────────────────────────────────────────────────── */}
      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[300px_1fr] lg:gap-16 xl:grid-cols-[340px_1fr]">

        {/* ── LEFT: Contact details ──────────────────────────────────── */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="flex flex-col gap-6"
        >
          {/* Availability status */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2467AC] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2467AC]" />
            </span>
            <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Available for new projects
            </p>
          </div>

          {/* Contact details */}
          <div className="space-y-4">
            {/* Email */}
            <div>
              <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
                Email
              </p>
              <div className="flex items-center gap-2.5">
                <Mail className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-600" aria-hidden />
                <span className="flex-1 truncate font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                  laudbouetoumoussa@gmail.com
                </span>
                <CopyButton onCopy={copyEmail} copied={emailCopied} label="Copy email" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
                Phone
              </p>
              <div className="flex items-center gap-2.5">
                <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-600" aria-hidden />
                <span className="flex-1 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                  +254 745 908 026
                </span>
                <CopyButton onCopy={copyPhone} copied={phoneCopied} label="Copy phone" />
              </div>
            </div>
          </div>

          <Rule />

          {/* Social links — magnetic */}
          <div>
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
              Find me on
            </p>
            <div className="flex items-center gap-2">
              <MagneticLink href="https://github.com/arden28" label="GitHub">
                <Github className="h-4 w-4" />
              </MagneticLink>
              <MagneticLink href="https://www.linkedin.com/in/arden-bouet/" label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </MagneticLink>
              <MagneticLink href="https://www.upwork.com/freelancers/~01b718c179049bbd70" label="Upwork">
                <img src="/images/upwork.svg" alt="" className="h-4 w-4 opacity-70" />
              </MagneticLink>
            </div>
          </div>

          <Rule />

          {/* Specialisms — dash prefixed, lime accent */}
          <div>
            <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
              I specialize in
            </p>
            <ul className="space-y-2">
              {[
                'Production-grade Web Apps',
                'Complex API Integrations',
                'IoT & Real-time Systems',
                'SaaS MVP Development',
              ].map(item => (
                <li key={item} className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="text-[#2467AC] leading-none">—</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* ── RIGHT: Form ────────────────────────────────────────────── */}
        <motion.form
          custom={1}
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="flex flex-col gap-8"
          noValidate
        >

          {/* 1. Identity — line inputs */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div>
              <label
                htmlFor="contact-name"
                className="block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 mb-1"
              >
                Name
              </label>
              <input
                id="contact-name"
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={() => setTouched(s => ({ ...s, name: true }))}
                placeholder="Brian Mwangi"
                className={cn(
                  lineInputBase,
                  touched.name && !name.trim() ? lineInputError : lineInputNormal
                )}
              />
            </div>
            <div>
              <label
                htmlFor="contact-email"
                className="block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 mb-1"
              >
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => setTouched(s => ({ ...s, email: true }))}
                placeholder="brian@company.com"
                className={cn(
                  lineInputBase,
                  email && !isEmailValid ? lineInputError : lineInputNormal
                )}
              />
            </div>
          </div>

          {/* 2. Services — sharp bordered chips, lime fill when active */}
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 mb-3">
              I need help with
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                ['SaaS build', 'API integration', 'IoT/Telemetry', 'UI/Frontend', 'Consultation'] as Chip[]
              ).map(c => {
                const active = chips.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleChip(c)}
                    aria-pressed={active}
                    className={cn(
                      'border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest',
                      'transition-colors duration-150 focus-visible:outline-none',
                      active
                        ? 'border-[#2467AC] bg-[#2467AC] text-zinc-900'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-500 hover:border-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                    )}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Timeframe + Budget */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Timeframe — text toggles, no box */}
            <div>
              <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 mb-3">
                <Clock className="h-3 w-3" aria-hidden /> Timeframe
              </p>
              <div className="flex items-center gap-5">
                {(['soon', 'this quarter', 'flexible'] as const).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setTimeframe(opt)}
                    className={cn(
                      'font-mono text-[10px] uppercase tracking-widest capitalize',
                      'transition-colors duration-150 focus-visible:outline-none',
                      timeframe === opt
                        ? 'text-zinc-900 dark:text-zinc-100 underline underline-offset-4 decoration-[#2467AC]'
                        : 'text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300'
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
                  <DollarSign className="h-3 w-3" aria-hidden /> Budget
                </p>
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-700 dark:text-zinc-300">
                  {budgetLabel}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={budget}
                onChange={e => setBudget(parseInt(e.target.value))}
                className="h-px w-full cursor-pointer appearance-none bg-zinc-200 dark:bg-zinc-800 accent-[#2467AC] outline-none"
                aria-label={`Budget: ${budgetLabel}`}
              />
              <div className="mt-1.5 flex justify-between font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                <span>Min</span>
                <span>Max</span>
              </div>
            </div>
          </div>

          {/* 4. Message — line textarea */}
          <div>
            <label
              htmlFor="contact-message"
              className="block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 mb-1"
            >
              Project Details
            </label>
            <textarea
              id="contact-message"
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, messageLimit))}
              onBlur={() => setTouched(s => ({ ...s, message: true }))}
              rows={5}
              placeholder="Tell me about the problem you're trying to solve…"
              className={cn(
                lineInputBase,
                'resize-none',
                touched.message && !message.trim() ? lineInputError : lineInputNormal
              )}
            />
            <div className="mt-1 flex justify-end font-mono text-[9px] text-zinc-400 dark:text-zinc-600">
              {message.length}/{messageLimit}
            </div>
          </div>

          {/* 5. Submit */}
          <div>
            <button
              type="submit"
              disabled={!canSend || submitting}
              className={cn(
                'w-full py-4',
                'font-mono text-[11px] uppercase tracking-widest',
                'transition-colors duration-150 focus-visible:outline-none',
                canSend && !submitting
                  ? [
                      'border border-zinc-900 dark:border-zinc-100',
                      'bg-zinc-900 dark:bg-zinc-50',
                      'text-white dark:text-zinc-900',
                      'hover:bg-zinc-700 dark:hover:bg-zinc-200',
                    ].join(' ')
                  : [
                      'border border-zinc-200 dark:border-zinc-800',
                      'bg-zinc-100 dark:bg-zinc-900',
                      'text-zinc-400 dark:text-zinc-600',
                      'cursor-not-allowed',
                    ].join(' ')
              )}
            >
              {submitting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </span>
              ) : (
                'Send Inquiry →'
              )}
            </button>
            <p className="mt-3 text-center font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
              Opens your default email client
            </p>
          </div>
        </motion.form>
      </div>
    </section>
  );
};