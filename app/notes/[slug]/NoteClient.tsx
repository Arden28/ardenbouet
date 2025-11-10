"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ─────────────────  Scroll progress  ───────────────── */
export function ScrollProgress() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.scrollingElement || document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setPct(max > 0 ? (el.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1 bg-transparent">
      <div className="h-1 bg-[color:var(--brand)] transition-[width]" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ─────────────────  Rich body (anchors, copy, callouts)  ───────────────── */
export function RichBody({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    // Headings → ids + copyable anchor
    const headings = root.querySelectorAll<HTMLElement>("h2, h3");
    headings.forEach((h) => {
      if (!h.id) {
        const slug =
          (h.textContent || "")
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-") || Math.random().toString(36).slice(2, 8);
        h.id = slug;
      }
      if (!h.querySelector(".heading-anchor-btn")) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className =
          "heading-anchor-btn ml-2 inline-flex items-center rounded px-1 text-xs opacity-0 transition hover:opacity-100";
        btn.textContent = "#";
        btn.title = "Copy section link";
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const url = `${location.origin}${location.pathname}#${h.id}`;
          try {
            await navigator.clipboard.writeText(url);
            btn.textContent = "✓";
            setTimeout(() => (btn.textContent = "#"), 1000);
          } catch {}
        });
        const wrap = document.createElement("span");
        wrap.className = "align-middle";
        wrap.appendChild(btn);
        h.appendChild(wrap);
        h.classList.add("group");
        btn.classList.add("group-hover:opacity-100");
      }
    });

    // Code blocks → copy button
    const pres = root.querySelectorAll<HTMLPreElement>("pre");
    pres.forEach((pre) => {
      if (pre.querySelector(".code-copy-btn")) return;
      pre.classList.add("relative");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "code-copy-btn absolute right-2 top-2 rounded-md border border-zinc-200/70 bg-white/80 px-2 py-1 text-xs shadow-sm backdrop-blur hover:bg-white dark:border-zinc-700/50 dark:bg-zinc-900/70 dark:hover:bg-zinc-900";
      btn.textContent = "Copy";
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const code = pre.querySelector("code");
        const text = code ? code.textContent || "" : pre.textContent || "";
        try {
          await navigator.clipboard.writeText(text);
          btn.textContent = "Copied!";
          setTimeout(() => (btn.textContent = "Copy"), 1200);
        } catch {}
      });
      pre.appendChild(btn);
    });

    // Callouts: > [!NOTE]|[!TIP]|[!WARNING]|[!IMPORTANT]
    const bqs = root.querySelectorAll("blockquote");
    bqs.forEach((bq) => {
      const first = bq.firstElementChild;
      if (!first) return;
      const txt = (first.textContent || "").trim();
      const m = txt.match(/^\[\!(NOTE|TIP|WARNING|IMPORTANT)\]\s*/i);
      if (!m) return;
      const kind = m[1].toUpperCase() as "NOTE" | "TIP" | "WARNING" | "IMPORTANT";
      first.textContent = (first.textContent || "").replace(m[0], "");

      const base = "not-prose my-4 rounded-xl border p-4 shadow-sm";
      const light = {
        NOTE: "border-zinc-200/70 bg-white/70",
        TIP: "border-emerald-200/70 bg-emerald-50/70",
        WARNING: "border-amber-200/70 bg-amber-50/70",
        IMPORTANT: "border-sky-200/70 bg-sky-50/70",
      } as const;
      const dark = {
        NOTE: "dark:border-zinc-700/50 dark:bg-zinc-900/70",
        TIP: "dark:border-emerald-700/40 dark:bg-emerald-950/30",
        WARNING: "dark:border-amber-700/40 dark:bg-amber-950/30",
        IMPORTANT: "dark:border-sky-700/40 dark:bg-sky-950/30",
      } as const;

      bq.className = `${base} ${light[kind]} ${dark[kind]}`;
      const label = document.createElement("div");
      label.className =
        "mb-2 inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-semibold tracking-wide text-zinc-700 dark:text-zinc-200";
      label.textContent = kind[0] + kind.slice(1).toLowerCase();
      bq.insertBefore(label, bq.firstChild);
    });
  }, [html]);

  return (
    <div
      ref={ref}
      className="prose-headings:scroll-mt-24"
      dangerouslySetInnerHTML={{ __html: html }} // supply sanitized HTML from your API
    />
  );
}

/* ─────────────────  TOC  ───────────────── */
export function Toc() {
  const [links, setLinks] = useState<{ id: string; text: string; level: number }[]>([]);
  const [active, setActive] = useState("");

  useEffect(() => {
    const article = document.querySelector("article");
    if (!article) return;
    const hs = Array.from(article.querySelectorAll("h2, h3")) as HTMLElement[];
    setLinks(hs.map((h) => ({ id: h.id, text: h.innerText, level: h.tagName === "H2" ? 2 : 3 })));

    const io = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((en) => en.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (top && (top.target as HTMLElement).id) setActive((top.target as HTMLElement).id);
      },
      { rootMargin: "0px 0px -70% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    hs.forEach((h) => io.observe(h));
    return () => io.disconnect();
  }, []);

  if (!links.length) return <p className="text-xs text-zinc-500 dark:text-zinc-400">No sections</p>;

  return (
    <nav className="text-sm">
      <ul className="space-y-1">
        {links.map((l) => (
          <li key={l.id} className={l.level === 3 ? "pl-3" : ""}>
            <a
              href={`#${l.id}`}
              className={`inline-block rounded px-1 py-0.5 hover:underline ${
                active === l.id
                  ? "bg-[color:var(--brand-soft)] text-[color:var(--brand)]"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {l.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ─────────────────  Share & Copy  ───────────────── */
export function ShareRow({ title, url }: { title: string; url: string }) {
  const enc = useMemo(() => ({ t: encodeURIComponent(title), u: encodeURIComponent(url) }), [title, url]);
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`https://twitter.com/intent/tweet?text=${enc.t}&url=${enc.u}`}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg border border-zinc-200/70 bg-white/70 px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-white dark:border-zinc-700/50 dark:bg-zinc-900/70 dark:hover:bg-zinc-900"
      >
        Post on X
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${enc.u}`}
        target="_blank"
        rel="noreferrer"
        className="rounded-lg border border-zinc-200/70 bg-white/70 px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-white dark:border-zinc-700/50 dark:bg-zinc-900/70 dark:hover:bg-zinc-900"
      >
        Share on LinkedIn
      </a>
      <CopyButton text={url}>Copy link</CopyButton>
    </div>
  );
}

export function CopyButton({ text, children }: { text: string; children?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1200);
        } catch {}
      }}
      className="rounded-lg border border-zinc-200/70 bg-white/70 px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-white dark:border-zinc-700/50 dark:bg-zinc-900/70 dark:hover:bg-zinc-900"
    >
      {ok ? "Copied!" : children ?? "Copy"}
    </button>
  );
}

export function Copyable({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setOk(true);
          setTimeout(() => setOk(false), 1200);
        } catch {}
      }}
      className="truncate align-top text-left underline-offset-2 hover:underline"
      title={text}
    >
      {ok ? "Copied!" : text}
    </button>
  );
}

/* ─────────────────  Article actions  ───────────────── */
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
        onClick={async () => {
          const el = document.querySelector(articleSelector);
          const text = el ? (el as HTMLElement).innerText : "";
          try {
            await navigator.clipboard.writeText(text.trim());
            setCopied((s) => ({ ...s, body: true }));
            setTimeout(() => setCopied((s) => ({ ...s, body: false })), 1200);
          } catch {}
        }}
        className="rounded-lg border border-zinc-200/70 bg-white/70 px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-white dark:border-zinc-700/50 dark:bg-zinc-900/70 dark:hover:bg-zinc-900"
      >
        {copied.body ? "Article copied!" : "Copy article"}
      </button>

      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(permalink);
            setCopied((s) => ({ ...s, url: true }));
            setTimeout(() => setCopied((s) => ({ ...s, url: false })), 1200);
          } catch {}
        }}
        className="rounded-lg border border-zinc-200/70 bg-white/70 px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-white dark:border-zinc-700/50 dark:bg-zinc-900/70 dark:hover:bg-zinc-900"
      >
        {copied.url ? "Link copied!" : "Copy URL"}
      </button>

      <button
        onClick={() => window.print()}
        className="rounded-lg border border-zinc-200/70 bg-white/70 px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-white dark:border-zinc-700/50 dark:bg-zinc-900/70 dark:hover:bg-zinc-900"
      >
        Print
      </button>
    </div>
  );
}
