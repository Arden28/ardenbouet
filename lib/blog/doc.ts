// lib/blog/doc.ts — helpers over the TipTap/ProseMirror JSON stored in Post.content.
// Pure (no DOM / server-only imports) so the editor and the server renderer share it.

export type PMMark = { type: string; attrs?: Record<string, any> };
export type PMNode = {
  type: string;
  attrs?: Record<string, any>;
  content?: PMNode[];
  marks?: PMMark[];
  text?: string;
};

export type ContentCardKind = 'product' | 'project' | 'experience' | 'post';

export const BLOCK_SEPARATOR_TYPES = new Set([
  'paragraph', 'heading', 'blockquote', 'pullQuote', 'listItem', 'taskItem',
  'codeBlock', 'callout', 'tableCell', 'tableHeader',
]);

export function isDoc(v: unknown): v is PMNode {
  return !!v && typeof v === 'object' && (v as PMNode).type === 'doc';
}

/** Plain text of a node tree; blocks are separated by newlines. */
export function nodeText(node: PMNode | undefined | null): string {
  if (!node) return '';
  if (node.type === 'text') return node.text ?? '';
  if (node.type === 'hardBreak') return '\n';
  const inner = (node.content ?? []).map(nodeText).join(BLOCK_SEPARATOR_TYPES.has(node.type) ? '' : '\n');
  return BLOCK_SEPARATOR_TYPES.has(node.type) ? `${inner}\n` : inner;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Medium counts ~265 wpm plus ~12 s per image. */
export function readingMinutes(words: number, images = 0): number {
  return Math.max(1, Math.round(words / 265 + (images * 12) / 60));
}

export function countImages(node: PMNode | undefined | null): number {
  if (!node) return 0;
  const own = node.type === 'figure' ? 1 : node.type === 'gallery' ? (node.attrs?.images?.length ?? 0) : 0;
  return own + (node.content ?? []).reduce((n, c) => n + countImages(c), 0);
}

export function slugify(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
}

export type TocEntry = { id: string; text: string; level: number };

/**
 * Walks headings in document order and assigns stable, unique ids.
 * The renderer calls this too, so TOC links and heading ids always agree.
 */
export function collectHeadings(doc: PMNode | undefined | null): TocEntry[] {
  const out: TocEntry[] = [];
  const seen = new Map<string, number>();
  const walk = (n: PMNode) => {
    if (n.type === 'heading') {
      const text = nodeText(n).trim();
      if (text) {
        const base = slugify(text) || 'section';
        const k = seen.get(base) ?? 0;
        seen.set(base, k + 1);
        out.push({ id: k ? `${base}-${k}` : base, text, level: n.attrs?.level ?? 2 });
      }
    }
    n.content?.forEach(walk);
  };
  if (doc) walk(doc);
  return out;
}

export type ContentRef = { kind: ContentCardKind; id: string };

/** Every product/project/experience/post referenced by contentCard nodes. */
export function collectContentRefs(doc: PMNode | undefined | null): ContentRef[] {
  const out: ContentRef[] = [];
  const walk = (n: PMNode) => {
    if (n.type === 'contentCard' && n.attrs?.kind && Array.isArray(n.attrs.refIds)) {
      for (const id of n.attrs.refIds) if (typeof id === 'string') out.push({ kind: n.attrs.kind, id });
    }
    n.content?.forEach(walk);
  };
  if (doc) walk(doc);
  return out;
}

/** First non-empty paragraph, trimmed — used as an excerpt fallback. */
export function firstParagraph(doc: PMNode | undefined | null, max = 200): string {
  let found = '';
  const walk = (n: PMNode) => {
    if (found) return;
    if (n.type === 'paragraph') {
      const t = nodeText(n).trim();
      if (t) { found = t; return; }
    }
    n.content?.forEach(walk);
  };
  if (doc) walk(doc);
  return found.length > max ? `${found.slice(0, max - 1).trimEnd()}…` : found;
}

/** First figure/gallery image in the doc — used as a cover fallback. */
export function firstImage(doc: PMNode | undefined | null): string | undefined {
  let src: string | undefined;
  const walk = (n: PMNode) => {
    if (src) return;
    if (n.type === 'figure' && n.attrs?.src) { src = n.attrs.src; return; }
    if (n.type === 'gallery' && n.attrs?.images?.[0]?.src) { src = n.attrs.images[0].src; return; }
    n.content?.forEach(walk);
  };
  if (doc) walk(doc);
  return src;
}

export function docStats(doc: PMNode | undefined | null) {
  const words = countWords(nodeText(doc));
  return { wordCount: words, readingMinutes: readingMinutes(words, countImages(doc)) };
}
