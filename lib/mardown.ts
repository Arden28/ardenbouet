// lib/markdown.ts
/* eslint-disable @typescript-eslint/no-var-requires */

/** Minimal instance shape we actually use */
type MarkdownItInstance = {
  render: (src: string, env?: any) => string;
  utils: { escapeHtml: (s: string) => string };
  use: (plugin: any, ...params: any[]) => MarkdownItInstance;
};

import type { Token } from "markdown-it"; // uses your module augmentation (or @types)

/** Plugins & helpers */
import anchor from "markdown-it-anchor";
import container from "markdown-it-container";
import taskLists from "markdown-it-task-lists";
import hljs from "highlight.js";
import sanitizeHtml from "sanitize-html";

/** Get a constructable runtime without relying on `default` typings */
const MarkdownItCtor =
  require("markdown-it") as unknown as new (opts?: any) => MarkdownItInstance;

/** Local escapeHtml (so we don’t self-reference md during init) */
const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Create the MarkdownIt instance with syntax highlighting + plugins */
const md: MarkdownItInstance = new MarkdownItCtor({
  html: false,
  linkify: true,
  breaks: true,
  highlight(code: string, lang: string): string {
    try {
      if (lang && hljs.getLanguage(lang)) {
        const out = hljs.highlight(code, { language: lang }).value;
        return `<pre class="hljs"><code class="language-${lang}">${out}</code></pre>`;
      }
      const out = hljs.highlightAuto(code).value;
      return `<pre class="hljs"><code>${out}</code></pre>`;
    } catch {
      return `<pre class="hljs"><code>${escapeHtml(code)}</code></pre>`;
    }
  },
})
  .use(anchor, {
    slugify: (s: string) =>
      (s || "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 80),
    permalink: anchor.permalink.ariaHidden({ symbol: "#", placement: "before" }),
  })
  .use(taskLists, { enabled: true })
  .use(container, "callout", {
    render(tokens: Token[], idx: number): string {
      return tokens[idx].nesting === 1 ? '<div class="callout">' : "</div>";
    },
  });

/** Public helper: Markdown -> sanitized HTML */
export function mdToSafeHtml(src: string): string {
  // Convert GitHub-style callouts `> [!NOTE] ...` to styled blocks before sanitize
  const normalized = (src || "").replace(
    /^\s*>\s*\[!(NOTE|TIP|WARNING|DANGER)\](.*)$/gim,
    (_m: string, kind: string, rest: string) =>
      `\n<div class="callout callout-${String(kind).toLowerCase()}">${(rest ?? "").trim()}</div>`
  );

  const rendered = md.render(normalized);

  return sanitizeHtml(rendered, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "span",
      "pre",
      "code",
      "div",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "blockquote",
      "hr",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      code: ["class"],
      pre: ["class"],
      span: ["class"],
      div: ["class"],
      table: ["class"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
      h1: ["id"],
      h2: ["id"],
      h3: ["id"],
      h4: ["id"],
      h5: ["id"],
      h6: ["id"],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
      table: sanitizeHtml.simpleTransform("table", { class: "table" }),
    },
  });
}
