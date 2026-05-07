'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import hljs from 'highlight.js';
// Dark theme — code blocks are always dark (consistent with #0A0A0A motif in Footer/CaseModal)
import 'highlight.js/styles/atom-one-dark.css';

// ─── Motion ──────────────────────────────────────────────────────────────────
const EXPO = [0.16, 1, 0.3, 1] as const;

// ─── Shared line input classes ────────────────────────────────────────────────
// Same pattern as Contact.tsx — line-only underline, no box
const lineBase =
  'w-full bg-transparent border-b py-2.5 text-sm text-zinc-900 dark:text-zinc-100 ' +
  'placeholder:text-zinc-400 dark:placeholder:text-zinc-600 ' +
  'focus:outline-none transition-colors duration-150';
const lineNormal = 'border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-100';

// ─── Shared action button class ───────────────────────────────────────────────
const actionBtn =
  'border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 ' +
  'font-mono text-[10px] uppercase tracking-widest ' +
  'text-zinc-500 dark:text-zinc-400 ' +
  'hover:border-zinc-900 hover:text-zinc-900 ' +
  'dark:hover:border-zinc-100 dark:hover:text-zinc-100 ' +
  'transition-colors duration-150 focus-visible:outline-none';

// ─── Design primitives ───────────────────────────────────────────────────────
function Rule({ className = '' }: { className?: string }) {
  return <div className={`h-px w-full bg-zinc-200 dark:bg-zinc-800 ${className}`} />;
}

// ────────────────────────────────────────────────────────────────────────────
// SCROLL PROGRESS
// Uses #2467AC to match the Header's scroll progress bar — design loop.
// ────────────────────────────────────────────────────────────────────────────
export function ScrollProgress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el  = document.scrollingElement ?? document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setPct(max > 0 ? (el.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] bg-transparent"
    >
      <div
        className="h-full bg-[#2467AC]"
        style={{ width: `${pct}%`, transition: 'width 0.15s linear' }}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// RICH BODY
// All DOM manipulation logic preserved exactly.
// Prose overrides for the dark code block aesthetic applied via className.
// ────────────────────────────────────────────────────────────────────────────
export function RichBody({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    /* 1) Syntax highlighting */
    hljs.highlightAll();

    /* 2) Headings → ids + copyable anchor */
    const headings = root.querySelectorAll<HTMLElement>('h2, h3');
    headings.forEach(h => {
      if (!h.id) {
        h.id = (h.textContent ?? '')
          .toLowerCase()
          .normalize('NFKD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-') || Math.random().toString(36).slice(2, 8);
      }
      if (!h.querySelector('.heading-anchor-btn')) {
        const btn = document.createElement('button');
        btn.type      = 'button';
        btn.className = 'heading-anchor-btn ml-2 inline-flex items-center rounded px-1 text-xs opacity-0 transition hover:opacity-100 text-zinc-400';
        btn.textContent = '#';
        btn.title     = 'Copy section link';
        btn.addEventListener('click', async e => {
          e.stopPropagation();
          const url = `${location.origin}${location.pathname}#${h.id}`;
          try {
            await navigator.clipboard.writeText(url);
            btn.textContent = '✓';
            setTimeout(() => (btn.textContent = '#'), 1000);
          } catch {}
        });
        const wrap = document.createElement('span');
        wrap.className = 'align-middle';
        wrap.appendChild(btn);
        h.appendChild(wrap);
        h.classList.add('group');
        btn.classList.add('group-hover:opacity-100');
      }
    });

    /* 3) Code blocks → copy button */
    root.querySelectorAll<HTMLPreElement>('pre.hljs, pre').forEach(pre => {
      if (pre.querySelector('.code-copy-btn')) return;
      pre.classList.add('relative');
      const btn = document.createElement('button');
      btn.type      = 'button';
      btn.className =
        'code-copy-btn absolute right-2 top-2 border border-zinc-700 bg-zinc-900 ' +
        'px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-zinc-400 ' +
        'hover:border-zinc-400 hover:text-zinc-100 transition-colors duration-150';
      btn.textContent = 'Copy';
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        const code = pre.querySelector('code');
        const text = code ? code.textContent ?? '' : pre.textContent ?? '';
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = 'Copied ✓';
          setTimeout(() => (btn.textContent = 'Copy'), 1200);
        } catch {}
      });
      pre.appendChild(btn);
    });

    /* 4) External links → open safely */
    root.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(a => {
      const href = a.getAttribute('href') ?? '';
      const isExternal = /^https?:\/\//i.test(href) && !href.includes(location.host.replace(/^www\./, ''));
      if (isExternal) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    });

    /* 5) Callouts — server-built + blockquote fallback (logic unchanged) */
    root.querySelectorAll<HTMLDivElement>('.callout').forEach(div => {
      if (div.querySelector('.callout-label')) return;
      const m    = div.className.match(/callout-(note|tip|warning|danger)/i);
      const kind = (m?.[1] ?? 'note').toLowerCase();
      const label = document.createElement('div');
      label.className   = 'callout-label mb-2 font-mono text-[9px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400';
      label.textContent = kind[0].toUpperCase() + kind.slice(1);
      div.insertBefore(label, div.firstChild);
    });

    root.querySelectorAll('blockquote').forEach(bq => {
      if (bq.closest('.callout')) return;
      const raw = (bq.firstElementChild?.textContent ?? bq.textContent ?? '').trim();
      const m   = raw.match(/^\[\!(NOTE|TIP|WARNING|DANGER|IMPORTANT)\]\s*/i);
      if (!m) return;
      const kind = (m[1] ?? 'NOTE').toLowerCase().replace('important', 'warning');
      const div  = document.createElement('div');
      div.className = `callout callout-${kind}`;
      const label = document.createElement('div');
      label.className   = 'callout-label mb-2 font-mono text-[9px] uppercase tracking-widest text-zinc-500 dark:text-zinc-400';
      label.textContent = kind[0].toUpperCase() + kind.slice(1);
      div.appendChild(label);
      const content = bq.cloneNode(true) as HTMLElement;
      content.innerHTML = content.innerHTML.replace(/^\s*<p>\s*\[\!.*?\]\s*/i, '<p>');
      div.appendChild(content);
      bq.replaceWith(div);
    });
  }, [html]);

  return (
    <div
      ref={ref}
      dangerouslySetInnerHTML={{ __html: html }} // already sanitized on server
    />
  );
}

// ────────────────────────────────────────────────────────────────────────────
// TABLE OF CONTENTS
// Redesigned: lime left-border for active item, font-mono labels.
// IntersectionObserver logic unchanged.
// ────────────────────────────────────────────────────────────────────────────
export function Toc() {
  const [links, setLinks] = useState<{ id: string; text: string; level: number }[]>([]);
  const [active, setActive] = useState('');

  useEffect(() => {
    const article = document.querySelector('article');
    if (!article) return;

    const hs = Array.from(article.querySelectorAll('h2, h3')) as HTMLElement[];
    setLinks(hs.map(h => ({
      id:    h.id,
      text:  h.innerText.replace(/#$/, '').trim(),
      level: h.tagName === 'H2' ? 2 : 3,
    })));

    const io = new IntersectionObserver(
      entries => {
        const top = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (top && (top.target as HTMLElement).id) {
          setActive((top.target as HTMLElement).id);
        }
      },
      { rootMargin: '0px 0px -70% 0px', threshold: [0, 0.25, 0.5, 1] }
    );
    hs.forEach(h => io.observe(h));
    return () => io.disconnect();
  }, []);

  if (!links.length) {
    return (
      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
        No sections
      </p>
    );
  }

  return (
    <nav aria-label="Table of contents">
      <ul className="space-y-0">
        {links.map(l => {
          const isActive = active === l.id;
          return (
            <li key={l.id} className={l.level === 3 ? 'pl-3' : ''}>
              <a
                href={`#${l.id}`}
                className={[
                  'block py-1.5 pl-2.5 text-left',
                  'font-mono text-[10px] uppercase tracking-widest',
                  'transition-colors duration-150 focus-visible:outline-none',
                  'border-l-2',
                  isActive
                    ? 'border-[#2467AC] text-zinc-900 dark:text-zinc-50'
                    : 'border-transparent text-zinc-400 dark:text-zinc-600 hover:text-zinc-700 dark:hover:text-zinc-300',
                ].join(' ')}
              >
                {l.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// SHARE ROW
// Sharp bordered buttons — no rounded-lg.
// ────────────────────────────────────────────────────────────────────────────
export function ShareRow({ title, url }: { title: string; url: string }) {
  const enc = useMemo(() => ({
    t: encodeURIComponent(title),
    u: encodeURIComponent(url),
  }), [title, url]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <p className="mr-1 font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
        Share
      </p>
      <a
        href={`https://twitter.com/intent/tweet?text=${enc.t}&url=${enc.u}`}
        target="_blank"
        rel="noreferrer"
        className={actionBtn}
      >
        Post on X
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc.u}`}
        target="_blank"
        rel="noreferrer"
        className={actionBtn}
      >
        LinkedIn
      </a>
      <CopyButton text={url}>Copy link</CopyButton>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// COPY BUTTON
// ────────────────────────────────────────────────────────────────────────────
export function CopyButton({ text, children }: { text: string; children?: string }) {
  const [ok, setOk] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1200);
        } catch {}
      }}
      className={actionBtn}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={ok ? 'ok' : 'idle'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {ok ? 'Copied ✓' : (children ?? 'Copy')}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// COPYABLE (inline text trigger)
// ────────────────────────────────────────────────────────────────────────────
export function Copyable({ text }: { text: string }) {
  const [ok, setOk] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1200);
        } catch {}
      }}
      className="truncate align-top text-left underline-offset-2 hover:underline font-mono text-[11px]"
      title={text}
    >
      {ok ? 'Copied!' : text}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// ARTICLE ACTIONS
// ────────────────────────────────────────────────────────────────────────────
export function ArticleActions({
  articleSelector,
  permalink,
  className,
}: {
  articleSelector: string;
  permalink: string;
  className?: string;
}) {
  const [copied, setCopied] = useState<{ body?: boolean; url?: boolean }>({});

  return (
    <div className={className}>
      <button
        type="button"
        onClick={async () => {
          const el   = document.querySelector(articleSelector);
          const text = el ? (el as HTMLElement).innerText : '';
          try {
            await navigator.clipboard.writeText(text.trim());
            setCopied(s => ({ ...s, body: true }));
            setTimeout(() => setCopied(s => ({ ...s, body: false })), 1200);
          } catch {}
        }}
        className={actionBtn}
      >
        {copied.body ? 'Copied ✓' : 'Copy article'}
      </button>

      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(permalink);
            setCopied(s => ({ ...s, url: true }));
            setTimeout(() => setCopied(s => ({ ...s, url: false })), 1200);
          } catch {}
        }}
        className={actionBtn}
      >
        {copied.url ? 'Copied ✓' : 'Copy URL'}
      </button>

      <button
        type="button"
        onClick={() => window.print()}
        className={actionBtn}
      >
        Print
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// COMMENT SECTION (new)
// Matches Contact.tsx's line-input aesthetic exactly.
// Uses mailto so there's no backend dependency.
// The UI communicates "high-quality community space" through restraint.
// ────────────────────────────────────────────────────────────────────────────
export function CommentSection({
  slug,
  noteTitle,
}: {
  slug: string;
  noteTitle: string;
}) {
  const [name, setName]   = useState('');
  const [body, setBody]   = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const canSubmit = name.trim() && body.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || status === 'sending') return;
    setStatus('sending');

    const subject = encodeURIComponent(`Comment on "${noteTitle}"`);
    const bodyText = encodeURIComponent(
`From: ${name}

${body}

---
Note: /notes/${slug}`
    );

    setTimeout(() => {
      window.location.href = `mailto:laudbouetoumoussa@gmail.com?subject=${subject}&body=${bodyText}`;
      setStatus('sent');
    }, 600);
  };

  return (
    <section className="mt-12 pb-12">

      {/* Section header */}
      <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600">
        Discussion
      </p>
      <Rule />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, ease: EXPO }}
        className="mt-6 max-w-lg"
      >
        <p className="mb-6 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Have a question, a correction, or just want to say something? I read everything.
        </p>

        <AnimatePresence mode="wait">
          {status === 'sent' ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-zinc-200 dark:border-zinc-800 p-6"
            >
              <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400">
                Comment sent — thank you, {name}.
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="space-y-6"
              noValidate
            >
              {/* Name */}
              <div>
                <label
                  htmlFor="comment-name"
                  className="block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 mb-1"
                >
                  Name
                </label>
                <input
                  id="comment-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className={`${lineBase} ${lineNormal}`}
                />
              </div>

              {/* Comment */}
              <div>
                <label
                  htmlFor="comment-body"
                  className="block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600 mb-1"
                >
                  Comment
                </label>
                <textarea
                  id="comment-body"
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={4}
                  required
                  placeholder="What's on your mind…"
                  className={`${lineBase} resize-none ${lineNormal}`}
                />
              </div>

              {/* Submit */}
              <div>
                <button
                  type="submit"
                  disabled={!canSubmit || status === 'sending'}
                  className={[
                    'py-3 px-6',
                    'font-mono text-[11px] uppercase tracking-widest',
                    'transition-colors duration-150 focus-visible:outline-none',
                    canSubmit && status !== 'sending'
                      ? 'border border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200'
                      : 'border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 cursor-not-allowed',
                  ].join(' ')}
                >
                  {status === 'sending' ? 'Sending…' : 'Send Comment →'}
                </button>
                <p className="mt-2 font-mono text-[9px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                  Opens your email client
                </p>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}