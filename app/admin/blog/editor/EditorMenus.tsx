'use client';
// Medium-style contextual menus: selection bubble, "+" inserter on empty lines, table controls.
import { useEffect, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus';
import { useEditorState } from '@tiptap/react';
import {
  Bold, Italic, Underline, Strikethrough, Code, Highlighter, Link2, Quote, AlignLeft, AlignCenter, Plus, X, Check, Unlink,
  Heading2, Heading3, Search,
} from 'lucide-react';
import { CommandMenu, filterCommands, type CommandMenuHandle } from './commands';

function Btn({ on, active, title, children }: { on: () => void; active?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={e => { e.preventDefault(); on(); }}
      className={`flex h-9 w-9 items-center justify-center rounded transition-colors ${active ? 'text-[#7ed37a]' : 'text-white hover:text-[#bdebb9]'}`}
    >
      {children}
    </button>
  );
}
const Sep = () => <span className="mx-1 h-5 w-px bg-white/25" />;

// ─── Selection bubble ────────────────────────────────────────────────────────

export function SelectionBubble({ editor }: { editor: Editor }) {
  const [linkMode, setLinkMode] = useState(false);
  const [href, setHref] = useState('');
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'), italic: e.isActive('italic'), underline: e.isActive('underline'), strike: e.isActive('strike'),
      code: e.isActive('code'), highlight: e.isActive('highlight'), link: e.isActive('link'),
      h2: e.isActive('heading', { level: 2 }), h3: e.isActive('heading', { level: 3 }), quote: e.isActive('blockquote'),
      center: e.isActive({ textAlign: 'center' }),
      href: (e.getAttributes('link').href as string | undefined) ?? '',
    }),
  });

  useEffect(() => { if (!linkMode) setHref(s.href); }, [s.href, linkMode]);

  const applyLink = () => {
    const url = href.trim();
    if (!url) editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: /^(https?:|mailto:|\/|#)/i.test(url) ? url : `https://${url}` }).run();
    setLinkMode(false);
  };

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: 'top', offset: 10 }}
      shouldShow={({ editor: e, state }) => {
        const { selection } = state;
        if (selection.empty || selection instanceof NodeSelection) return false;
        if (e.isActive('codeBlock') || e.isActive('figure') || e.isActive('contentCard')) return false;
        return state.doc.textBetween(selection.from, selection.to).trim().length > 0;
      }}
      className="z-50 flex items-center rounded-md bg-[#242424] px-1 shadow-lg"
    >
      {linkMode ? (
        <form className="flex items-center" onSubmit={e => { e.preventDefault(); applyLink(); }}>
          <input
            autoFocus
            value={href}
            onChange={e => setHref(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); setLinkMode(false); editor.commands.focus(); } }}
            placeholder="Paste or type a link…"
            className="w-64 bg-transparent px-3 py-2 font-sans text-[14px] text-white outline-none placeholder:text-white/50"
          />
          {s.link && <Btn title="Remove link" on={() => { editor.chain().focus().extendMarkRange('link').unsetLink().run(); setLinkMode(false); }}><Unlink className="h-4 w-4" /></Btn>}
          <Btn title="Apply" on={applyLink}><Check className="h-4 w-4" /></Btn>
          <Btn title="Cancel" on={() => setLinkMode(false)}><X className="h-4 w-4" /></Btn>
        </form>
      ) : (
        <>
          <Btn title="Bold (⌘B)" active={s.bold} on={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" strokeWidth={2.5} /></Btn>
          <Btn title="Italic (⌘I)" active={s.italic} on={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Btn>
          <Btn title="Underline (⌘U)" active={s.underline} on={() => editor.chain().focus().toggleUnderline().run()}><Underline className="h-4 w-4" /></Btn>
          <Btn title="Strikethrough" active={s.strike} on={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Btn>
          <Btn title="Link (⌘K)" active={s.link} on={() => setLinkMode(true)}><Link2 className="h-4 w-4" /></Btn>
          <Sep />
          <Btn title="Heading" active={s.h2} on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-[18px] w-[18px]" /></Btn>
          <Btn title="Subheading" active={s.h3} on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-[18px] w-[18px]" /></Btn>
          <Btn title="Quote" active={s.quote} on={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Btn>
          <Sep />
          <Btn title="Highlight" active={s.highlight} on={() => editor.chain().focus().toggleHighlight().run()}><Highlighter className="h-4 w-4" /></Btn>
          <Btn title="Inline code" active={s.code} on={() => editor.chain().focus().toggleCode().run()}><Code className="h-4 w-4" /></Btn>
          <Btn
            title={s.center ? 'Align left' : 'Center'}
            active={s.center}
            on={() => editor.chain().focus().setTextAlign(s.center ? 'left' : 'center').run()}
          >
            {s.center ? <AlignLeft className="h-4 w-4" /> : <AlignCenter className="h-4 w-4" />}
          </Btn>
        </>
      )}
    </BubbleMenu>
  );
}

// ─── "+" inserter ────────────────────────────────────────────────────────────

export function BlockInserter({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const menuRef = useRef<CommandMenuHandle>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  useEffect(() => { if (!open) setQ(''); }, [open]);

  return (
    <FloatingMenu
      editor={editor}
      options={{ placement: 'left', offset: 18 }}
      shouldShow={({ editor: e, state }) => {
        const { $from, empty } = state.selection;
        if (!empty || !e.isEditable) return false;
        const node = $from.parent;
        return node.type.name === 'paragraph' && node.content.size === 0 && $from.depth === 1;
      }}
      className="z-40"
    >
      <div ref={wrapRef} className="relative font-sans">
        <button
          type="button"
          aria-label="Insert block"
          aria-expanded={open}
          onMouseDown={e => { e.preventDefault(); setOpen(o => !o); }}
          className={`flex h-8 w-8 items-center justify-center rounded-full border text-[#6b6b6b] transition-transform duration-200 hover:border-[#242424] hover:text-[#242424] ${open ? 'rotate-45 border-[#242424] text-[#242424]' : 'border-[#9b9b9b]'}`}
        >
          <Plus className="h-5 w-5" strokeWidth={1.5} />
        </button>
        {open && (
          <div className="absolute left-0 top-10 z-50">
            <div className="mb-1 flex w-72 items-center gap-2 rounded-lg border border-[#e6e6e6] bg-white px-3 py-2 shadow-sm">
              <Search className="h-4 w-4 text-[#9b9b9b]" />
              <input
                autoFocus
                value={q}
                onChange={e => setQ(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') { setOpen(false); editor.commands.focus(); return; }
                  if (menuRef.current?.onKeyDown(e.nativeEvent)) e.preventDefault();
                }}
                placeholder="Search blocks…"
                className="min-w-0 flex-1 bg-transparent text-[14px] outline-none"
              />
            </div>
            <CommandMenu
              ref={menuRef}
              items={filterCommands(q)}
              onSelect={c => { setOpen(false); c.run(editor); }}
            />
          </div>
        )}
      </div>
    </FloatingMenu>
  );
}

// ─── Table controls ──────────────────────────────────────────────────────────

export function TableMenu({ editor }: { editor: Editor }) {
  const T = ({ label, on, danger }: { label: string; on: () => void; danger?: boolean }) => (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); on(); }}
      className={`rounded px-2 py-1.5 font-sans text-[12px] ${danger ? 'text-[#ff9b9b] hover:bg-white/10' : 'text-white hover:bg-white/10'}`}
    >
      {label}
    </button>
  );
  return (
    <BubbleMenu
      editor={editor}
      pluginKey="tableMenu"
      options={{ placement: 'top', offset: 8 }}
      shouldShow={({ editor: e, state }) => e.isActive('table') && state.selection.empty}
      className="z-50 flex flex-wrap items-center gap-0.5 rounded-md bg-[#242424] p-1 shadow-lg"
    >
      <T label="+ Row" on={() => editor.chain().focus().addRowAfter().run()} />
      <T label="+ Column" on={() => editor.chain().focus().addColumnAfter().run()} />
      <T label="− Row" on={() => editor.chain().focus().deleteRow().run()} />
      <T label="− Column" on={() => editor.chain().focus().deleteColumn().run()} />
      <T label="Header row" on={() => editor.chain().focus().toggleHeaderRow().run()} />
      <T label="Merge / split" on={() => editor.chain().focus().mergeOrSplit().run()} />
      <T label="Delete table" danger on={() => editor.chain().focus().deleteTable().run()} />
    </BubbleMenu>
  );
}
