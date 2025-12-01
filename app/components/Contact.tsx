'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Phone, // Added Phone icon
  Github, 
  Linkedin, 
  Copy, 
  Check, 
  ArrowRight, 
  Send, 
  Loader2, 
  Terminal, 
  Clock, 
  DollarSign 
} from 'lucide-react';
import { cn } from '@/lib/utils'; 

type Chip = 'SaaS build' | 'API integration' | 'IoT/Telemetry' | 'UI/Frontend' | 'Consultation';

export const Contact = () => {
  // ── form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [chips, setChips] = useState<Chip[]>([]);
  const [timeframe, setTimeframe] = useState<'soon'|'this quarter'|'flexible'>('flexible');
  const [budget, setBudget] = useState(3); // 1..5
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<{email?: boolean; name?: boolean; message?: boolean}>({});
  
  // ── copy states
  const [emailCopied, setEmailCopied] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);

  // ── derived
  const budgetLabel = useMemo(() => ['<$500','$500–2k','$2–8k','$8–20k','$20k+'][budget-1], [budget]);
  const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()), [email]);
  const canSend = !!(name.trim() && isEmailValid && message.trim());
  const messageLimit = 1200;

  const toggleChip = (c: Chip) =>
    setChips(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

  // ── submit (mailto)
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
      window.location.href = `mailto:laudbouetoumoussa@koverae.com?subject=${subj}&body=${body}`;
      setSubmitting(false);
    }, 800);
  };

  // ── copy handlers
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText('laudbouetoumoussa@koverae.com');
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch {}
  };

  const copyPhone = async () => {
    try {
      // Replace with your actual phone number
      await navigator.clipboard.writeText('+254 700 000 000'); 
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 2000);
    } catch {}
  };

  return (
    <section id="contact" className="relative mx-auto mt-24 max-w-6xl px-4 pb-24 sm:pb-32">
        
      {/* Header */}
      <div className="mb-12 md:mb-16">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 mb-4"
        >
            <div className="h-px w-8 bg-[color:var(--brand)]" />
            <span className="text-xs font-bold uppercase tracking-widest text-[color:var(--brand)]">Get in touch</span>
        </motion.div>
        
        <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-black tracking-tight sm:text-4xl md:text-4xl"
        >
            {/* Restored the gradient from black/white to Brand Color */}
            <span className="bg-gradient-to-r from-black to-[color:var(--brand)] bg-clip-text text-transparent dark:from-white dark:to-[color:var(--brand)]">
                Let's build something <br className="hidden sm:block" /> reliable together.
            </span>
        </motion.h2>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* --- LEFT COLUMN: CONTACT CARD --- */}
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-4 space-y-6"
        >
            {/* Main Contact Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                        <Terminal className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Direct Line</h3>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Available for new projects</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* 1. Email Copy Component */}
                    <div className="group relative overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between px-3 py-2">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <Mail className="h-4 w-4 shrink-0 text-zinc-400" />
                                <span className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    laudbouetoumoussa...
                                </span>
                            </div>
                            <button 
                                onClick={copyEmail}
                                className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm transition-all hover:scale-105 hover:text-[color:var(--brand)] dark:bg-zinc-800 dark:text-zinc-400"
                                aria-label="Copy email address"
                            >
                                <AnimatePresence mode='wait'>
                                    {emailCopied ? (
                                        <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                            <Check className="h-4 w-4 text-emerald-500" />
                                        </motion.div>
                                    ) : (
                                        <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                            <Copy className="h-4 w-4" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>
                    </div>

                    {/* 2. Phone Copy Component (New) */}
                    <div className="group relative overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
                        <div className="flex items-center justify-between px-3 py-2">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <Phone className="h-4 w-4 shrink-0 text-zinc-400" />
                                <span className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    +254 745 908 026 {/* Replace with actual number */}
                                </span>
                            </div>
                            <button 
                                onClick={copyPhone}
                                className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm transition-all hover:scale-105 hover:text-[color:var(--brand)] dark:bg-zinc-800 dark:text-zinc-400"
                                aria-label="Copy phone number"
                            >
                                <AnimatePresence mode='wait'>
                                    {phoneCopied ? (
                                        <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                            <Check className="h-4 w-4 text-emerald-500" />
                                        </motion.div>
                                    ) : (
                                        <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                            <Copy className="h-4 w-4" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>
                    </div>

                    {/* Socials */}
                    <div className="grid grid-cols-2 gap-3">
                        <Link 
                            href="https://github.com/arden28" 
                            target="_blank"
                            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                            <Github className="h-4 w-4" /> GitHub
                        </Link>
                        <Link 
                            href="https://www.linkedin.com/in/arden-bouet/" 
                            target="_blank"
                            className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                            <Linkedin className="h-4 w-4" /> LinkedIn
                        </Link>
                    </div>
                </div>
            </div>

            {/* "Good Fits" Panel */}
            <div className="p-6">
                <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-zinc-500">I specialize in</h4>
                <ul className="space-y-3">
                    {[
                        'Production-grade Web Apps',
                        'Complex API Integrations',
                        'IoT & Real-time Dashboards',
                        'SaaS MVP Development'
                    ].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <Check className="h-3 w-3" />
                            </div>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
        </motion.div>

        {/* --- RIGHT COLUMN: THE FORM --- */}
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-8"
        >
            <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 sm:p-10">
                {/* Decorative background grid */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                
                <div className="relative space-y-8">
                    
                    {/* 1. Identity */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Name</label>
                            <input 
                                id="name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                onBlur={() => setTouched(s => ({...s, name: true}))}
                                placeholder="Jane Doe"
                                className={cn(
                                    "w-full rounded-lg border bg-zinc-50 px-4 py-3 text-sm outline-none transition-all focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)] dark:bg-zinc-900 dark:text-zinc-100",
                                    touched.name && !name.trim() ? "border-red-300 focus:border-red-400 focus:ring-red-400" : "border-zinc-200 dark:border-zinc-800"
                                )}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Email</label>
                            <input 
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onBlur={() => setTouched(s => ({...s, email: true}))}
                                placeholder="jane@company.com"
                                className={cn(
                                    "w-full rounded-lg border bg-zinc-50 px-4 py-3 text-sm outline-none transition-all focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)] dark:bg-zinc-900 dark:text-zinc-100",
                                    email && !isEmailValid ? "border-red-300 focus:border-red-400 focus:ring-red-400" : "border-zinc-200 dark:border-zinc-800"
                                )}
                            />
                        </div>
                    </div>

                    {/* 2. Services (Chips) */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">I need help with</label>
                        <div className="flex flex-wrap gap-2">
                            {(['SaaS build','API integration','IoT/Telemetry','UI/Frontend','Consultation'] as Chip[]).map(c => {
                                const active = chips.includes(c);
                                return (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => toggleChip(c)}
                                        className={cn(
                                            "relative flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all",
                                            active 
                                              ? "border-[color:var(--brand)] bg-[color:var(--brand)]/5 text-[color:var(--brand)]" 
                                              : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                                        )}
                                    >
                                        {c}
                                        {active && <motion.span initial={{scale:0}} animate={{scale:1}}><Check className="h-3.5 w-3.5" /></motion.span>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 3. Specs (Time & Budget) */}
                    <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/30">
                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                            {/* Timeframe */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                                    <Clock className="h-3 w-3" /> Timeframe
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['soon', 'this quarter', 'flexible'].map((opt) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => setTimeframe(opt as any)}
                                            className={cn(
                                                "rounded-md py-2 text-xs font-medium capitalize transition-all",
                                                timeframe === opt 
                                                    ? "bg-white shadow-sm ring-1 ring-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:ring-zinc-700 dark:text-zinc-100" 
                                                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                                            )}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Budget */}
                            <div className="space-y-3">
                                <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
                                    <span className="flex items-center gap-2"><DollarSign className="h-3 w-3" /> Budget</span>
                                    <span className="text-[color:var(--brand)]">{budgetLabel}</span>
                                </label>
                                <input
                                    type="range" min={1} max={5} step={1}
                                    value={budget}
                                    onChange={e => setBudget(parseInt(e.target.value))}
                                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 accent-[color:var(--brand)] outline-none dark:bg-zinc-700"
                                />
                                <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                                    <span>min</span>
                                    <span>max</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Message */}
                    <div className="space-y-2">
                        <label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Project Details</label>
                        <textarea 
                            id="message"
                            value={message}
                            onChange={e => setMessage(e.target.value.slice(0, messageLimit))}
                            onBlur={() => setTouched(s => ({...s, message: true}))}
                            rows={4}
                            placeholder="Tell me about the problem you're trying to solve..."
                            className={cn(
                                "w-full resize-none rounded-lg border bg-zinc-50 px-4 py-3 text-sm outline-none transition-all focus:border-[color:var(--brand)] focus:ring-1 focus:ring-[color:var(--brand)] dark:bg-zinc-900 dark:text-zinc-100",
                                touched.message && !message.trim() ? "border-red-300" : "border-zinc-200 dark:border-zinc-800"
                            )}
                        />
                        <div className="flex justify-end text-[10px] text-zinc-400">
                            {message.length}/{messageLimit}
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={!canSend || submitting}
                            className={cn(
                                "group flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold text-white transition-all",
                                canSend && !submitting 
                                    ? "bg-[color:var(--brand)] hover:opacity-90 shadow-lg shadow-[color:var(--brand)]/20" 
                                    : "bg-zinc-200 text-zinc-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-600"
                            )}
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Send Inquiry <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>
                        <p className="mt-3 text-center text-[10px] text-zinc-400">
                            Starts a secure mailto link in your default email client.
                        </p>
                    </div>

                </div>
            </form>
        </motion.div>
      </div>
    </section>
  );
};