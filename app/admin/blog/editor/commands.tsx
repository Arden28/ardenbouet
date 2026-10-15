'use client';
// The block command registry — shared by the "/" slash menu and the "+" inserter.
import { Extension, type Editor, type Range } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion, { type SuggestionKeyDownProps, type SuggestionProps } from '@tiptap/suggestion';
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import {
  Type, Heading2, Heading3, Heading4, List, ListOrdered, ListChecks, Quote, MessageSquareQuote, Info, Code2, Minus,
  Image as ImageIcon, Images, Clapperboard, Table2, ShoppingBag, FolderKanban, Briefcase, FileText, MousePointerClick, Link2,
} from 'lucide-react';
import { pickFiles, uploadToR2 } from './upload';

export type BlockCommand = {
  id: string;
  title: string;
  hint: string;
  group: 'Basic' | 'Media' | 'Site content' | 'Advanced';
  keywords: string;
  icon: typeof Type;
  run: (editor: Editor, range?: Range) => void;
};

const chain = (editor: Editor, range?: Range) => (range ? editor.chain().focus().deleteRange(range) : editor.chain().focus());

/** Inserts an image placeholder immediately, then swaps in the uploaded URL. */
export async function insertUploadedImages(editor: Editor, files: File[], at?: number) {
  for (const file of files.filter(f => f.type.startsWith('image/'))) {
    const blobUrl = URL.createObjectURL(file);
    const content = { type: 'figure', attrs: { src: blobUrl, uploading: true } };
    if (at !== undefined) editor.chain().focus().insertContentAt(at, content).run();
    else editor.chain().focus().insertContent(content).run();
    try {
      const url = await uploadToR2(file);
      replaceFigureSrc(editor, blobUrl, { src: url, uploading: false });
    } catch (e) {
      replaceFigureSrc(editor, blobUrl, null);
      alert(`Image upload failed: ${(e as Error).message}`);
    }
  }
}

function replaceFigureSrc(editor: Editor, blobUrl: string, attrs: Record<string, unknown> | null) {
  const { state } = editor;
  let tr = state.tr;
  let found = false;
  state.doc.descendants((node, pos) => {
    if (found || node.type.name !== 'figure' || node.attrs.src !== blobUrl) return;
    found = true;
    tr = attrs ? tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs }) : tr.delete(pos, pos + node.nodeSize);
  });
  if (found) editor.view.dispatch(tr);
  URL.revokeObjectURL(blobUrl);
}

export const BLOCK_COMMANDS: BlockCommand[] = [
  { id: 'text', title: 'Text', hint: 'Plain paragraph', group: 'Basic', keywords: 'paragraph p body', icon: Type, run: (e, r) => chain(e, r).setParagraph().run() },
  { id: 'h2', title: 'Heading', hint: 'Big section heading', group: 'Basic', keywords: 'h2 title section', icon: Heading2, run: (e, r) => chain(e, r).setHeading({ level: 2 }).run() },
  { id: 'h3', title: 'Subheading', hint: 'Medium heading', group: 'Basic', keywords: 'h3 subtitle', icon: Heading3, run: (e, r) => chain(e, r).setHeading({ level: 3 }).run() },
  { id: 'h4', title: 'Small heading', hint: 'Minor heading', group: 'Basic', keywords: 'h4', icon: Heading4, run: (e, r) => chain(e, r).setHeading({ level: 4 }).run() },
  { id: 'ul', title: 'Bulleted list', hint: 'Simple list', group: 'Basic', keywords: 'ul bullet unordered', icon: List, run: (e, r) => chain(e, r).toggleBulletList().run() },
  { id: 'ol', title: 'Numbered list', hint: 'Ordered list', group: 'Basic', keywords: 'ol ordered number', icon: ListOrdered, run: (e, r) => chain(e, r).toggleOrderedList().run() },
  { id: 'todo', title: 'Checklist', hint: 'Tasks with checkboxes', group: 'Basic', keywords: 'todo task check', icon: ListChecks, run: (e, r) => chain(e, r).toggleTaskList().run() },
  { id: 'quote', title: 'Quote', hint: 'Indented quote', group: 'Basic', keywords: 'blockquote citation', icon: Quote, run: (e, r) => chain(e, r).toggleBlockquote().run() },
  { id: 'pull', title: 'Pull quote', hint: 'Large centered quote', group: 'Basic', keywords: 'pullquote big emphasis', icon: MessageSquareQuote, run: (e, r) => chain(e, r).setPullQuote().run() },
  { id: 'divider', title: 'Separator', hint: 'Three-dot section break', group: 'Basic', keywords: 'hr divider rule break', icon: Minus, run: (e, r) => chain(e, r).setHorizontalRule().run() },

  { id: 'image', title: 'Image', hint: 'Upload from your computer', group: 'Media', keywords: 'photo picture upload img', icon: ImageIcon,
    run: async (e, r) => { if (r) e.chain().focus().deleteRange(r).run(); const files = await pickFiles('image/*', true); if (files.length) await insertUploadedImages(e, files); } },
  { id: 'image-url', title: 'Image from URL', hint: 'Paste an image link', group: 'Media', keywords: 'photo link remote', icon: Link2,
    run: (e, r) => { const src = window.prompt('Image URL'); if (src) chain(e, r).setFigure({ src }).run(); else if (r) e.chain().focus().deleteRange(r).run(); } },
  { id: 'gallery', title: 'Gallery', hint: 'Grid of 2–8 images', group: 'Media', keywords: 'grid images photos', icon: Images,
    run: async (e, r) => {
      if (r) e.chain().focus().deleteRange(r).run();
      const files = await pickFiles('image/*', true);
      if (!files.length) return;
      e.chain().focus().setGallery({ images: [] }).run();
      const urls = await Promise.all(files.slice(0, 8).map(f => uploadToR2(f).catch(() => null)));
      const images = urls.filter(Boolean).map(src => ({ src: src as string, alt: '' }));
      const { state } = e;
      let pos = -1;
      state.doc.descendants((n, p) => { if (n.type.name === 'gallery' && !n.attrs.images.length) pos = p; });
      if (pos >= 0) e.view.dispatch(state.tr.setNodeMarkup(pos, undefined, { images, caption: '' }));
    } },
  { id: 'embed', title: 'Embed', hint: 'YouTube, Vimeo, Loom, CodePen, Figma…', group: 'Media', keywords: 'video youtube vimeo loom codepen sandbox figma spotify iframe link', icon: Clapperboard,
    run: (e, r) => chain(e, r).setEmbed({ url: '' }).run() },

  { id: 'product', title: 'Product', hint: 'Card from your shop', group: 'Site content', keywords: 'shop buy sell product card', icon: ShoppingBag, run: (e, r) => chain(e, r).setContentCard({ kind: 'product', refIds: [] }).run() },
  { id: 'project', title: 'Project', hint: 'Card from your portfolio', group: 'Site content', keywords: 'portfolio case work project card', icon: FolderKanban, run: (e, r) => chain(e, r).setContentCard({ kind: 'project', refIds: [] }).run() },
  { id: 'experience', title: 'Experience', hint: 'A role from your career', group: 'Site content', keywords: 'job role career experience', icon: Briefcase, run: (e, r) => chain(e, r).setContentCard({ kind: 'experience', refIds: [] }).run() },
  { id: 'story', title: 'Story link', hint: 'Card linking another story', group: 'Site content', keywords: 'post article blog related link', icon: FileText, run: (e, r) => chain(e, r).setContentCard({ kind: 'post', refIds: [] }).run() },

  { id: 'callout', title: 'Callout', hint: 'Highlighted note / tip / warning', group: 'Advanced', keywords: 'note info tip warning alert aside', icon: Info, run: (e, r) => chain(e, r).setParagraph().setCallout({ variant: 'info' }).run() },
  { id: 'code', title: 'Code block', hint: 'Syntax-highlighted code', group: 'Advanced', keywords: 'code snippet pre program', icon: Code2, run: (e, r) => chain(e, r).toggleCodeBlock().run() },
  { id: 'table', title: 'Table', hint: '3 × 3 table', group: 'Advanced', keywords: 'grid rows columns table', icon: Table2, run: (e, r) => chain(e, r).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { id: 'button', title: 'Button', hint: 'Call-to-action link', group: 'Advanced', keywords: 'cta button link action', icon: MousePointerClick, run: (e, r) => chain(e, r).setStoryButton({ label: 'Learn more', href: '' }).run() },
];

export function filterCommands(query: string): BlockCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return BLOCK_COMMANDS;
  return BLOCK_COMMANDS.filter(c => `${c.title} ${c.keywords}`.toLowerCase().includes(q));
}

// ─── Menu UI ─────────────────────────────────────────────────────────────────

export type CommandMenuHandle = { onKeyDown: (e: KeyboardEvent) => boolean };

export const CommandMenu = forwardRef<CommandMenuHandle, { items: BlockCommand[]; onSelect: (c: BlockCommand) => void }>(
  function CommandMenu({ items, onSelect }, ref) {
    const [index, setIndex] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);
    useEffect(() => setIndex(0), [items]);
    useLayoutEffect(() => {
      listRef.current?.querySelector(`[data-idx="${index}"]`)?.scrollIntoView({ block: 'nearest' });
    }, [index]);

    useImperativeHandle(ref, () => ({
      onKeyDown: (e: KeyboardEvent) => {
        if (!items.length) return false;
        if (e.key === 'ArrowDown') { setIndex(i => (i + 1) % items.length); return true; }
        if (e.key === 'ArrowUp') { setIndex(i => (i - 1 + items.length) % items.length); return true; }
        if (e.key === 'Enter' || e.key === 'Tab') { onSelect(items[index]); return true; }
        return false;
      },
    }));

    if (!items.length) {
      return <div className="w-72 rounded-lg border border-[#e6e6e6] bg-white px-4 py-3 font-sans text-[13px] text-[#9b9b9b] shadow-xl">No matching blocks</div>;
    }
    let lastGroup = '';
    return (
      <div ref={listRef} className="max-h-[360px] w-72 overflow-y-auto rounded-lg border border-[#e6e6e6] bg-white py-1.5 font-sans shadow-xl">
        {items.map((c, i) => {
          const header = c.group !== lastGroup ? (lastGroup = c.group) : null;
          return (
            <div key={c.id}>
              {header && <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9b9b9b]">{header}</p>}
              <button
                type="button"
                data-idx={i}
                onMouseEnter={() => setIndex(i)}
                onMouseDown={e => { e.preventDefault(); onSelect(c); }}
                className={`flex w-full items-center gap-3 px-3 py-1.5 text-left ${i === index ? 'bg-[#f2f2f2]' : ''}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#e6e6e6] bg-white text-[#242424]">
                  <c.icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14px] text-[#242424]">{c.title}</span>
                  <span className="block truncate text-[12px] text-[#9b9b9b]">{c.hint}</span>
                </span>
              </button>
            </div>
          );
        })}
      </div>
    );
  },
);

// ─── Slash extension ─────────────────────────────────────────────────────────

export const SlashCommands = Extension.create({
  name: 'slashCommands',
  addProseMirrorPlugins() {
    return [
      Suggestion<BlockCommand>({
        editor: this.editor,
        char: '/',
        startOfLine: false,
        allowSpaces: false,
        // Only trigger in plain text blocks, never inside code.
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          return $from.parent.type.name !== 'codeBlock';
        },
        items: ({ query }) => filterCommands(query),
        command: ({ editor, range, props }) => props.run(editor, range),
        render: () => {
          let renderer: ReactRenderer<CommandMenuHandle> | null = null;
          let el: HTMLDivElement | null = null;
          const place = (props: SuggestionProps<BlockCommand>) => {
            const rect = props.clientRect?.();
            if (!rect || !el) return;
            const below = window.innerHeight - rect.bottom > 380;
            el.style.left = `${Math.min(rect.left, window.innerWidth - 300)}px`;
            el.style.top = below ? `${rect.bottom + 8}px` : `${Math.max(8, rect.top - 380)}px`;
          };
          return {
            onStart: props => {
              renderer = new ReactRenderer(CommandMenu, {
                props: { items: props.items, onSelect: (c: BlockCommand) => props.command(c) },
                editor: props.editor,
              });
              el = document.createElement('div');
              el.style.position = 'fixed';
              el.style.zIndex = '150';
              el.appendChild(renderer.element);
              document.body.appendChild(el);
              place(props);
            },
            onUpdate: props => {
              renderer?.updateProps({ items: props.items, onSelect: (c: BlockCommand) => props.command(c) });
              place(props);
            },
            onKeyDown: (props: SuggestionKeyDownProps) => {
              if (props.event.key === 'Escape') { el?.remove(); return true; }
              return renderer?.ref?.onKeyDown(props.event) ?? false;
            },
            onExit: () => { renderer?.destroy(); el?.remove(); renderer = null; el = null; },
          };
        },
      }),
    ];
  },
});
