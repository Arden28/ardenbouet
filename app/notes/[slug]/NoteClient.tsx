"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import hljs from "highlight.js";
import "highlight.js/styles/github.css";

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

/* ─────────────────  Rich body  ───────────────── */
export function RichBody({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    /* 1) Syntax highlighting (safe & idempotent) */
    hljs.highlightAll();

    /* 2) Headings → ids + copyable anchor (only if missing) */
    const headings = root.querySelectorAll<HTMLElement>("h2, h3");
    headings.forEach((h) => {
      if (!h.id) {
        const slug =
          (h.textContent || "")
            .toLowerCase()
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
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

    /* 3) Code blocks → copy button (idempotent) */
    const pres = root.querySelectorAll<HTMLPreElement>("pre.hljs, pre");
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

    /* 4) External links → open safely */
    const links = root.querySelectorAll<HTMLAnchorElement>("a[href]");
    links.forEach((a) => {
      const href = a.getAttribute("href") || "";
      const isExternal =
        /^https?:\/\//i.test(href) && !href.includes(location.host.replace(/^www\./, ""));
      if (isExternal) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
    });

    /* 5) Callouts
       - Preferred server form: <div class="callout callout-note|tip|warning|danger">…</div>
       - Fallback client form:  blockquotes starting with > [!NOTE] … (transform them) */
    // (A) Style server-built callouts (ensure label exists)
    const callouts = root.querySelectorAll<HTMLDivElement>(".callout");
    callouts.forEach((div) => {
      if (div.querySelector(".callout-label")) return;
      const m = div.className.match(/callout-(note|tip|warning|danger)/i);
      const kind = (m?.[1] || "note").toLowerCase();
      const label = document.createElement("div");
      label.className =
        "callout-label mb-2 inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-semibold tracking-wide text-zinc-700 dark:text-zinc-200";
      label.textContent = kind[0].toUpperCase() + kind.slice(1);
      div.insertBefore(label, div.firstChild);
    });

    // (B) Fallback: convert markdown blockquotes with [!NOTE] into styled divs
    const bqs = root.querySelectorAll("blockquote");
    bqs.forEach((bq) => {
      // skip if already converted
      if (bq.closest(".callout")) return;
      const first = bq.firstElementChild || bq.firstChild;
      const raw = (first?.textContent || bq.textContent || "").trim();
      const m = raw.match(/^\[\!(NOTE|TIP|WARNING|DANGER|IMPORTANT)\]\s*/i);
      if (!m) return;
      const kind = (m[1] || "NOTE").toLowerCase().replace("important", "warning"); // map IMPORTANT→warning
      const div = document.createElement("div");
      div.className = `callout callout-${kind}`;
      // label
      const label = document.createElement("div");
      label.className =
        "callout-label mb-2 inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-semibold tracking-wide text-zinc-700 dark:text-zinc-200";
      label.textContent = kind[0].toUpperCase() + kind.slice(1);
      div.appendChild(label);
      // content (without the [!KIND] token)
      const content = bq.cloneNode(true) as HTMLElement;
      content.innerHTML = content.innerHTML.replace(/^\s*<p>\s*\[\!.*?\]\s*/i, "<p>");
      div.appendChild(content);
      bq.replaceWith(div);
    });

  }, [html]);

  return (
    <div
      ref={ref}
      className={[
        "prose prose-zinc max-w-none dark:prose-invert",
        // nice defaults
        "prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:border prose-pre:border-zinc-200/60 dark:prose-pre:border-zinc-700/50",
        "prose-img:rounded-xl prose-img:border prose-img:border-zinc-200/60 dark:prose-img:border-zinc-700/50",
        "prose-table:overflow-hidden",
        "prose-headings:scroll-mt-24",
      ].join(" ")}
      dangerouslySetInnerHTML={{ __html: html }} // already sanitized on server
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
