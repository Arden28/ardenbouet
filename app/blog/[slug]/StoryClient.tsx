'use client';
// Interactive pieces of a story page: shared per-story state, claps, save, listen, share,
// reader highlights (selection popover) and the floating table of contents.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, Share, Link2, Play, Square, Highlighter, MessageSquareQuote } from 'lucide-react';
import { useBlog, useReader } from '../_components/ReaderProvider';
import { ClapIcon } from '../_components/PostList';
import { SaveButton } from '../_components/SaveButton';
import { fmtCount } from '@/lib/blog/strings';
import type { TocEntry } from '@/lib/blog/doc';

type StoryState = {
  claps: number;
  myClaps: number;
  bookmarked: boolean;
  myHighlights: { id: string; quote: string }[];
  topHighlight: { quote: string; count: number } | null;
  responses: number;
};

type Ctx = {
  slug: string;
  title: string;
  url: string;
  state: StoryState;
  setState: React.Dispatch<React.SetStateAction<StoryState>>;
  respondTo: (quote: string) => void;
  pendingQuote: string | null;
  clearQuote: () => void;
  interactive: boolean;
};

const StoryCtx = createContext<Ctx | null>(null);
export const useStory = () => {
  const c = useContext(StoryCtx);
  if (!c) throw new Error('useStory outside StoryProvider');
  return c;
};

export function StoryProvider({ slug, title, url, responses, interactive, children }: {
  slug: string; title: string; url: string; responses: number; interactive: boolean; children: ReactNode;
}) {
  const { reader } = useReader();
  const [state, setState] = useState<StoryState>({
    claps: 0, myClaps: 0, bookmarked: false, myHighlights: [], topHighlight: null, responses,
  });
  const [pendingQuote, setPendingQuote] = useState<string | null>(null);

  useEffect(() => {
    if (!interactive) return;
    let alive = true;
    fetch(`/api/blog/posts/${encodeURIComponent(slug)}/state`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (alive && d) setState(s => ({ ...s, ...d })); })
      .catch(() => {});
    return () => { alive = false; };
  }, [slug, interactive, reader?.id]);

  // Count one view per story per browser session, after the reader has stayed 10 s.
  useEffect(() => {
    if (!interactive) return;
    const key = `ab_viewed_${slug}`;
    try { if (sessionStorage.getItem(key)) return; } catch { /* storage blocked */ }
    const id = setTimeout(() => {
      try { sessionStorage.setItem(key, '1'); } catch { /* ignore */ }
      fetch(`/api/blog/posts/${encodeURIComponent(slug)}/view`, { method: 'POST' }).catch(() => {});
    }, 10_000);
    return () => clearTimeout(id);
  }, [slug, interactive]);

  const respondTo = useCallback((quote: string) => {
    setPendingQuote(quote);
    document.getElementById('responses')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <StoryCtx.Provider value={{ slug, title, url, state, setState, respondTo, pendingQuote, clearQuote: () => setPendingQuote(null), interactive }}>
      {children}
    </StoryCtx.Provider>
  );
}

// ─── Clap ─────────────────────────────────────────────────────────────────────

export function ClapButton({ showCount = true }: { showCount?: boolean }) {
  const { slug, state, setState, interactive } = useStory();
  const { t } = useBlog();
  const [bubble, setBubble] = useState<{ n: number; key: number } | null>(null);
  const [pop, setPop] = useState(0);
  const pending = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const holdTimer = useRef<ReturnType<typeof setInterval>>();
  const sessionAdds = useRef(0);

  const flush = useCallback(async () => {
    const add = pending.current;
    pending.current = 0;
    if (!add) return;
    try {
      const res = await fetch(`/api/blog/posts/${encodeURIComponent(slug)}/clap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ add }),
      });
      if (res.ok) {
        const d = await res.json();
        setState(s => ({ ...s, claps: d.claps, myClaps: d.myClaps }));
      }
    } catch { /* optimistic count stays */ }
  }, [slug, setState]);

  const mineRef = useRef(state.myClaps);
  mineRef.current = state.myClaps;

  const clap = useCallback(() => {
    if (!interactive || mineRef.current >= 50) return;
    mineRef.current += 1;
    pending.current += 1;
    sessionAdds.current += 1;
    setBubble({ n: sessionAdds.current, key: Date.now() });
    setPop(p => p + 1);
    setState(s => ({ ...s, claps: s.claps + 1, myClaps: s.myClaps + 1 }));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { flush(); sessionAdds.current = 0; }, 900);
  }, [interactive, setState, flush]);

  const startHold = () => {
    clap();
    holdTimer.current = setInterval(clap, 140);
  };
  const endHold = () => clearInterval(holdTimer.current);
  useEffect(() => () => { clearInterval(holdTimer.current); clearTimeout(timer.current); }, []);

  const mine = state.myClaps > 0;
  return (
    <div className="relative flex items-center gap-1">
      <button
        type="button"
        onPointerDown={startHold}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clap(); } }}
        aria-label={t('clap')}
        title={state.myClaps >= 50 ? '50 / 50' : t('clap')}
        className={`relative rounded-full p-1 transition-colors ${mine ? 'text-[#242424]' : 'text-[#6b6b6b] hover:text-[#242424]'}`}
      >
        <span key={pop} className={pop ? 'clap-pop inline-block' : 'inline-block'}>
          <ClapIcon className="h-6 w-6" filled={mine} />
        </span>
        {bubble && (
          <span
            key={bubble.key}
            className="clap-bubble pointer-events-none absolute left-1/2 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#242424] text-[13px] font-medium text-white"
            onAnimationEnd={() => setBubble(null)}
          >
            +{bubble.n}
          </span>
        )}
      </button>
      {showCount && state.claps > 0 && <span className="text-[13px] text-[#6b6b6b]">{fmtCount(state.claps)}</span>}
    </div>
  );
}

// ─── Share / listen ──────────────────────────────────────────────────────────

function ShareMenu() {
  const { t } = useBlog();
  const { url, title } = useStory();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const onClick = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator && window.matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share({ title, url }); return; } catch { /* fall back to menu */ }
    }
    setOpen(o => !o);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* ignore */ }
  };

  const enc = encodeURIComponent;
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={onClick} aria-label={t('share')} title={t('share')} className="rounded p-1 text-[#6b6b6b] hover:text-[#242424]">
        <Share className="h-[22px] w-[22px]" strokeWidth={1.3} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-30 w-56 rounded-md border border-[#f2f2f2] bg-white py-2 text-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.12)]">
          <button type="button" onClick={copy} className="flex w-full items-center gap-3 px-4 py-2 text-left text-[#6b6b6b] hover:text-[#242424]">
            <Link2 className="h-4 w-4" /> {copied ? t('copied') : t('copyLink')}
          </button>
          <a href={`https://x.com/intent/post?text=${enc(title)}&url=${enc(url)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2 text-[#6b6b6b] hover:text-[#242424]">
            <span className="w-4 text-center font-bold">𝕏</span> {t('shareOnX')}
          </a>
          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2 text-[#6b6b6b] hover:text-[#242424]">
            <span className="w-4 text-center text-[12px] font-bold">in</span> {t('shareOnLinkedIn')}
          </a>
        </div>
      )}
    </div>
  );
}

function ListenButton() {
  const { t } = useBlog();
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    setSupported('speechSynthesis' in window);
    return () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };
  }, []);
  if (!supported) return null;

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (speaking) { synth.cancel(); setSpeaking(false); return; }
    const article = document.querySelector('article.story');
    const text = [document.querySelector('h1')?.textContent, article?.textContent].filter(Boolean).join('. ');
    const u = new SpeechSynthesisUtterance(text);
    u.lang = document.documentElement.lang === 'fr' ? 'fr-FR' : 'en-US';
    u.rate = 1.02;
    u.onend = () => setSpeaking(false);
    synth.cancel();
    synth.speak(u);
    setSpeaking(true);
  };
  return (
    <button type="button" onClick={toggle} aria-label={speaking ? t('stop') : t('listen')} title={speaking ? t('stop') : t('listen')} className="rounded p-1 text-[#6b6b6b] hover:text-[#242424]">
      {speaking ? <Square className="h-[20px] w-[20px]" strokeWidth={1.3} /> : <Play className="h-[22px] w-[22px]" strokeWidth={1.3} />}
    </button>
  );
}

export function StoryActionBar({ position }: { position: 'top' | 'bottom' }) {
  const { t } = useBlog();
  const { slug, state, interactive } = useStory();
  return (
    <div className={`flex items-center justify-between px-2 py-[3px] ${position === 'top' ? 'border-y border-[#f2f2f2]' : ''}`}>
      <div className="flex items-center gap-5">
        <ClapButton />
        <a href="#responses" className="flex items-center gap-1 rounded p-1 text-[#6b6b6b] hover:text-[#242424]" aria-label={t('responses')}>
          <MessageCircle className="h-[22px] w-[22px]" strokeWidth={1.3} />
          {state.responses > 0 && <span className="text-[13px]">{state.responses}</span>}
        </a>
      </div>
      <div className="flex items-center gap-4">
        {interactive && <SaveButton slug={slug} size="md" />}
        <ListenButton />
        <ShareMenu />
      </div>
    </div>
  );
}

// ─── Highlights ───────────────────────────────────────────────────────────────

/** Wraps the first occurrence of `quote` inside `root` with <mark class=…>. Returns cleanup. */
function markQuote(root: HTMLElement, quote: string, className: string): (() => void) | null {
  const target = quote.replace(/\s+/g, ' ').trim();
  if (target.length < 3) return null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let full = '';
  const starts: number[] = [];
  while (walker.nextNode()) {
    const n = walker.currentNode as Text;
    if (n.parentElement?.closest('pre, .code-block, figure, iframe')) continue;
    starts.push(full.length);
    nodes.push(n);
    full += n.data.replace(/\s+/g, ' ');
  }
  const at = full.indexOf(target);
  if (at < 0) return null;
  const end = at + target.length;
  const marks: HTMLElement[] = [];
  nodes.forEach((n, i) => {
    const s = starts[i];
    const e = s + n.data.replace(/\s+/g, ' ').length;
    if (e <= at || s >= end) return;
    const from = Math.max(0, at - s);
    const to = Math.min(n.data.length, end - s);
    const range = document.createRange();
    range.setStart(n, from);
    range.setEnd(n, to);
    const mark = document.createElement('mark');
    mark.className = className;
    try { range.surroundContents(mark); marks.push(mark); } catch { /* crosses element boundary */ }
  });
  return () => marks.forEach(m => m.replaceWith(...Array.from(m.childNodes)));
}

export function HighlightLayer({ children }: { children: ReactNode }) {
  const { t, openSignIn } = useBlog();
  const { reader } = useReader();
  const { slug, state, setState, respondTo, interactive } = useStory();
  const rootRef = useRef<HTMLDivElement>(null);
  const [pop, setPop] = useState<{ x: number; y: number; quote: string } | null>(null);

  // Paint reader + top highlights.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const cleanups: (() => void)[] = [];
    if (state.topHighlight && !state.myHighlights.some(h => h.quote === state.topHighlight!.quote)) {
      const c = markQuote(root, state.topHighlight.quote, 'top-hl');
      if (c) cleanups.push(c);
    }
    for (const h of state.myHighlights) {
      const c = markQuote(root, h.quote, 'reader-hl');
      if (c) cleanups.push(c);
    }
    return () => cleanups.reverse().forEach(c => c());
  }, [state.myHighlights, state.topHighlight]);

  useEffect(() => {
    if (!interactive) return;
    const onUp = () => {
      setTimeout(() => {
        const sel = window.getSelection();
        const root = rootRef.current;
        if (!sel || sel.isCollapsed || !root || !sel.rangeCount) { setPop(null); return; }
        const range = sel.getRangeAt(0);
        if (!root.contains(range.commonAncestorContainer)) { setPop(null); return; }
        const quote = sel.toString().replace(/\s+/g, ' ').trim();
        if (quote.length < 3 || quote.length > 1000) { setPop(null); return; }
        const rect = range.getBoundingClientRect();
        setPop({ x: rect.left + rect.width / 2, y: rect.top + window.scrollY, quote });
      }, 0);
    };
    const onDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-hl-pop]')) return;
      setPop(null);
    };
    document.addEventListener('mouseup', onUp);
    document.addEventListener('keyup', onUp);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('keyup', onUp);
      document.removeEventListener('mousedown', onDown);
    };
  }, [interactive]);

  const existing = pop ? state.myHighlights.find(h => h.quote === pop.quote) : undefined;

  const toggleHighlight = async () => {
    if (!pop) return;
    if (!reader) { openSignIn(); return; }
    const quote = pop.quote;
    setPop(null);
    window.getSelection()?.removeAllRanges();
    if (existing) {
      setState(s => ({ ...s, myHighlights: s.myHighlights.filter(h => h.id !== existing.id) }));
      await fetch(`/api/blog/posts/${encodeURIComponent(slug)}/highlights`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: existing.id }),
      }).catch(() => {});
      return;
    }
    const res = await fetch(`/api/blog/posts/${encodeURIComponent(slug)}/highlights`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quote }),
    }).catch(() => null);
    if (res?.ok) {
      const h = await res.json();
      setState(s => ({ ...s, myHighlights: [...s.myHighlights.filter(x => x.id !== h.id), h] }));
    }
  };

  const respond = () => {
    if (!pop) return;
    const quote = pop.quote;
    setPop(null);
    if (!reader) { openSignIn(); return; }
    respondTo(quote);
  };

  const shareX = () => {
    if (!pop) return;
    const text = `“${pop.quote.slice(0, 200)}”`;
    window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href.split('#')[0])}`, '_blank', 'noopener');
    setPop(null);
  };

  return (
    <div ref={rootRef}>
      {children}
      {pop && typeof document !== 'undefined' && createPortal(
        <div
          data-hl-pop
          className="absolute z-50 flex -translate-x-1/2 -translate-y-full items-center rounded-md bg-[#242424] px-1 text-white shadow-lg"
          style={{ left: pop.x, top: pop.y - 10 }}
          onMouseDown={e => e.preventDefault()}
        >
          <button type="button" onClick={toggleHighlight} className="flex items-center gap-1.5 px-3 py-2 text-[13px] hover:text-[#def4dd]" title={t('highlight')}>
            <Highlighter className="h-4 w-4" /> {existing ? t('highlighted') : t('highlight')}
          </button>
          <span className="h-4 w-px bg-white/20" />
          <button type="button" onClick={respond} className="flex items-center gap-1.5 px-3 py-2 text-[13px] hover:text-[#def4dd]" title={t('respond')}>
            <MessageSquareQuote className="h-4 w-4" /> {t('respond')}
          </button>
          <span className="h-4 w-px bg-white/20" />
          <button type="button" onClick={shareX} className="px-3 py-2 text-[14px] font-bold hover:text-[#def4dd]" title={t('shareOnX')}>𝕏</button>
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-x-[7px] border-t-[7px] border-x-transparent border-t-[#242424]" />
        </div>,
        document.body,
      )}
    </div>
  );
}

// ─── Table of contents (wide screens) ────────────────────────────────────────

// ─── Table of contents (wide screens) ────────────────────────────────────────

export function TocRail({
  entries,
  headerOffset = 96,
}: {
  entries: TocEntry[];
  headerOffset?: number;
}) {
  const { t } = useBlog();
  const [active, setActive] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [barVisible, setBarVisible] = useState(true);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const els = entries.map(e => document.getElementById(e.id)).filter(Boolean) as HTMLElement[];
    const article = document.querySelector('article.story') as HTMLElement | null;

    const update = () => {
      // Active heading (triggers slightly below headerOffset so clicked headings activate immediately)
      const spyThreshold = headerOffset + 32;
      let cur: string | null = null;
      for (const el of els) {
        if (el.getBoundingClientRect().top <= spyThreshold) cur = el.id;
      }
      setActive(cur);

      if (!article) {
        setBarVisible(false);
        setProgress(0);
        return;
      }

      const r = article.getBoundingClientRect();
      const naturalTop = 160; // matches top-40

      if (navRef.current) {
        const navHeight = navRef.current.offsetHeight || 280;
        const maxTop = Math.max(r.top, r.bottom - navHeight);
        const clampedTop = Math.min(Math.max(naturalTop, r.top), maxTop);
        navRef.current.style.top = `${clampedTop}px`;
      }

      setBarVisible(r.bottom > 60);
      setProgress(
        Math.min(1, Math.max(0, (window.innerHeight - r.top) / (r.height + window.innerHeight * 0.4)))
      );
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);

    const t1 = setTimeout(update, 300);
    const t2 = setTimeout(update, 1000);

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [entries, headerOffset]);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    // Allow modified clicks (Cmd/Ctrl/Shift/middle-click) to work normally
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    const target = document.getElementById(id);
    if (!target) return;

    e.preventDefault();
    setActive(id);

    const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: 'smooth',
    });

    // Update the URL hash without triggering an instant browser jump
    window.history.pushState(null, '', `#${id}`);
  };

  return (
    <>
      {/* Top reading progress bar – fades once the story finishes */}
      <div
        className={`fixed left-0 top-0 z-[60] h-[2px] bg-[#242424] transition-all duration-300 ease-out ${
          barVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ width: `${progress * 100}%` }}
        aria-hidden
      />

      {entries.length >= 3 && (
        <nav
          ref={navRef}
          aria-label={t('contents')}
          className="fixed left-6 z-40 hidden w-[200px] 2xl:block"
          style={{ top: '160px' }}
        >
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.08em] text-[#9b9b9b]">
            {t('contents')}
          </p>
          <ul className="space-y-2 border-l border-[#f2f2f2]">
            {entries.map(e => (
              <li key={e.id} style={{ paddingLeft: (e.level - 2) * 12 + 14 }}>
                <a
                  href={`#${e.id}`}
                  onClick={ev => handleLinkClick(ev, e.id)}
                  className={`-ml-px block border-l py-0.5 pl-3 text-[13px] leading-5 transition-colors line-clamp-2 ${
                    active === e.id
                      ? 'border-[#242424] text-[#242424]'
                      : 'border-transparent text-[#9b9b9b] hover:text-[#242424]'
                  }`}
                  style={{ marginLeft: -((e.level - 2) * 12 + 14) }}
                >
                  {e.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  );
}
