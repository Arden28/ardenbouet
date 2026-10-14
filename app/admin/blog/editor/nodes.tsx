'use client';
// Custom TipTap nodes for stories. Each JSON shape here must stay in sync with lib/blog/render.tsx.
import { Node, mergeAttributes, type CommandProps } from '@tiptap/core';
import { NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { useEffect, useState } from 'react';
import {
  AlignCenter, Maximize2, Columns2, Trash2, ImagePlus, Loader2, Link2, Info, Lightbulb, AlertTriangle,
  CheckCircle2, LayoutGrid, Rows3, Pencil, ExternalLink,
} from 'lucide-react';
import { resolveEmbed, displayHost } from '@/lib/blog/embeds';
import type { ContentCardKind } from '@/lib/blog/doc';
import { getMedia } from './media';
import { useEmbeddables } from './embeddables';
import { ContentPickerDialog } from './ContentPicker';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    storyNodes: {
      setFigure: (attrs: { src: string; alt?: string; caption?: string; layout?: string; uploading?: boolean }) => ReturnType;
      setGallery: (attrs: { images: { src: string; alt?: string }[]; caption?: string }) => ReturnType;
      setEmbed: (attrs: { url: string; caption?: string; title?: string; description?: string }) => ReturnType;
      setCallout: (attrs?: { variant?: string }) => ReturnType;
      setPullQuote: () => ReturnType;
      setContentCard: (attrs: { kind: ContentCardKind; refIds: string[]; layout?: 'card' | 'compact' }) => ReturnType;
      setStoryButton: (attrs: { label: string; href: string; variant?: 'solid' | 'outline' }) => ReturnType;
    };
  }
}

// ─── Shared toolbar used by atom node views ─────────────────────────────────

function NodeToolbar({ children }: { children: React.ReactNode }) {
  return (
    <div
      contentEditable={false}
      className="absolute -top-11 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-md bg-[#242424] p-1 text-white shadow-lg"
    >
      {children}
    </div>
  );
}

function TBtn({ on, active, title, children }: { on: () => void; active?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={e => { e.preventDefault(); on(); }}
      className={`flex h-8 min-w-8 items-center justify-center rounded px-1.5 text-[13px] ${active ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
    >
      {children}
    </button>
  );
}

function CaptionInput({ value, onChange, placeholder = 'Type caption for image (optional)' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-2.5 w-full bg-transparent text-center font-sans text-[14px] text-[#6b6b6b] outline-none placeholder:text-[#c4c4c4]"
      onKeyDown={e => e.stopPropagation()}
    />
  );
}

// ─── Figure ──────────────────────────────────────────────────────────────────

function FigureView({ node, updateAttributes, deleteNode, selected, editor }: NodeViewProps) {
  const { src, alt, caption, layout, uploading } = node.attrs as { src: string; alt: string; caption: string; layout: string; uploading?: boolean };
  const [editAlt, setEditAlt] = useState(false);

  const replace = async () => {
    const [url] = await getMedia(editor).pickImages(false).catch(e => { alert((e as Error).message); return []; });
    if (url) updateAttributes({ src: url, uploading: false });
  };

  return (
    <NodeViewWrapper as="figure" data-layout={layout} className={`figure figure-${layout} relative`} data-drag-handle>
      {selected && (
        <NodeToolbar>
          <TBtn title="Inset" active={layout === 'inset'} on={() => updateAttributes({ layout: 'inset' })}><AlignCenter className="h-4 w-4" /></TBtn>
          <TBtn title="Wide" active={layout === 'wide'} on={() => updateAttributes({ layout: 'wide' })}><Columns2 className="h-4 w-4" /></TBtn>
          <TBtn title="Full width" active={layout === 'full'} on={() => updateAttributes({ layout: 'full' })}><Maximize2 className="h-4 w-4" /></TBtn>
          <span className="mx-1 h-5 w-px bg-white/20" />
          <TBtn title="Alt text" active={editAlt} on={() => setEditAlt(v => !v)}>ALT</TBtn>
          <TBtn title="Replace image" on={replace}><ImagePlus className="h-4 w-4" /></TBtn>
          <TBtn title="Remove" on={deleteNode}><Trash2 className="h-4 w-4" /></TBtn>
        </NodeToolbar>
      )}
      <div className={`relative ${selected ? 'outline outline-[3px] outline-[#1a8917]' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className={uploading ? 'opacity-50' : ''} draggable={false} />
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#242424]" /></span>
        )}
      </div>
      {editAlt && (
        <input
          value={alt}
          onChange={e => updateAttributes({ alt: e.target.value })}
          placeholder="Describe the image for screen readers"
          className="mt-2 w-full rounded border border-[#e6e6e6] px-3 py-1.5 font-sans text-[14px] outline-none focus:border-[#242424]"
          onKeyDown={e => e.stopPropagation()}
        />
      )}
      <CaptionInput value={caption} onChange={v => updateAttributes({ caption: v })} />
    </NodeViewWrapper>
  );
}

export const Figure = Node.create({
  name: 'figure',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      src: { default: '' },
      alt: { default: '' },
      caption: { default: '' },
      layout: { default: 'inset' },
      uploading: { default: false, rendered: false },
    };
  },
  parseHTML() {
    return [
      { tag: 'figure[data-type="figure"]' },
      { tag: 'img[src]', getAttrs: el => ({ src: (el as HTMLElement).getAttribute('src'), alt: (el as HTMLElement).getAttribute('alt') ?? '' }) },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['figure', mergeAttributes({ 'data-type': 'figure' }), ['img', { src: HTMLAttributes.src, alt: HTMLAttributes.alt }]];
  },
  addNodeView() { return ReactNodeViewRenderer(FigureView); },
  addCommands() {
    return { setFigure: attrs => ({ commands }: CommandProps) => commands.insertContent({ type: this.name, attrs }) };
  },
});

// ─── Gallery ─────────────────────────────────────────────────────────────────

function GalleryView({ node, updateAttributes, deleteNode, selected, editor }: NodeViewProps) {
  const images = (node.attrs.images ?? []) as { src: string; alt?: string }[];
  const [busy, setBusy] = useState(false);

  const add = async () => {
    setBusy(true);
    try {
      const urls = await getMedia(editor).pickImages(true);
      updateAttributes({ images: [...images, ...urls.map(src => ({ src, alt: '' }))].slice(0, 8) });
    } catch (e) { alert((e as Error).message); }
    setBusy(false);
  };
  const remove = (i: number) => updateAttributes({ images: images.filter((_, j) => j !== i) });

  return (
    <NodeViewWrapper as="figure" className="gallery relative" data-count={Math.min(images.length, 4)} data-drag-handle>
      {selected && (
        <NodeToolbar>
          <TBtn title="Add images" on={add}><ImagePlus className="h-4 w-4" /></TBtn>
          <TBtn title="Remove gallery" on={deleteNode}><Trash2 className="h-4 w-4" /></TBtn>
        </NodeToolbar>
      )}
      <div className={`gallery-grid ${selected ? 'outline outline-[3px] outline-[#1a8917]' : ''}`}>
        {images.map((im, i) => (
          <div key={i} className="group relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={im.src} alt={im.alt ?? ''} draggable={false} />
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); remove(i); }}
              className="absolute right-2 top-2 hidden rounded-full bg-black/70 p-1.5 text-white group-hover:block"
              title="Remove image"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {images.length < 8 && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); add(); }}
            className="flex aspect-[4/3] items-center justify-center border-2 border-dashed border-[#e6e6e6] font-sans text-[14px] text-[#6b6b6b] hover:border-[#c4c4c4]"
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="flex items-center gap-2"><ImagePlus className="h-5 w-5" /> Add images</span>}
          </button>
        )}
      </div>
      <CaptionInput value={node.attrs.caption} onChange={v => updateAttributes({ caption: v })} placeholder="Type caption for gallery (optional)" />
    </NodeViewWrapper>
  );
}

export const Gallery = Node.create({
  name: 'gallery',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() { return { images: { default: [] }, caption: { default: '' } }; },
  parseHTML() { return [{ tag: 'figure[data-type="gallery"]' }]; },
  renderHTML() { return ['figure', { 'data-type': 'gallery' }]; },
  addNodeView() { return ReactNodeViewRenderer(GalleryView); },
  addCommands() {
    return { setGallery: attrs => ({ commands }: CommandProps) => commands.insertContent({ type: this.name, attrs }) };
  },
});

// ─── Embed (video / code / design / link card) ───────────────────────────────

function EmbedView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const { url, caption, title, description } = node.attrs as Record<string, string>;
  const resolved = resolveEmbed(url);
  const [editing, setEditing] = useState(!url);
  const [draft, setDraft] = useState(url);

  return (
    <NodeViewWrapper as="figure" className={`relative ${resolved ? 'embed figure-wide' : ''}`} data-drag-handle>
      {selected && !editing && (
        <NodeToolbar>
          <TBtn title="Change URL" on={() => setEditing(true)}><Pencil className="h-4 w-4" /></TBtn>
          <TBtn title="Open" on={() => window.open(url, '_blank', 'noopener')}><ExternalLink className="h-4 w-4" /></TBtn>
          <TBtn title="Remove" on={deleteNode}><Trash2 className="h-4 w-4" /></TBtn>
        </NodeToolbar>
      )}
      {editing ? (
        <form
          className="flex items-center gap-2 rounded-md border border-[#e6e6e6] p-2 font-sans"
          onSubmit={e => { e.preventDefault(); updateAttributes({ url: draft.trim() }); setEditing(false); }}
        >
          <Link2 className="ml-1 h-5 w-5 text-[#9b9b9b]" />
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.stopPropagation()}
            placeholder="Paste a YouTube, Vimeo, Loom, CodePen, CodeSandbox, Figma, Spotify or any link…"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
          />
          <button type="submit" className="rounded-full bg-[#242424] px-3 py-1 text-[13px] text-white">Embed</button>
        </form>
      ) : resolved ? (
        <div className={`embed-frame ${selected ? 'outline outline-[3px] outline-[#1a8917]' : ''}`} style={resolved.aspect ? { aspectRatio: String(resolved.aspect) } : { height: resolved.height }}>
          <iframe src={resolved.src} title={resolved.provider} className="pointer-events-none" />
        </div>
      ) : (
        <div className={`link-card ${selected ? 'outline outline-[3px] outline-[#1a8917]' : ''}`}>
          <input
            value={title}
            onChange={e => updateAttributes({ title: e.target.value })}
            onKeyDown={e => e.stopPropagation()}
            placeholder="Link title"
            className="link-card-title bg-transparent outline-none"
          />
          <input
            value={description}
            onChange={e => updateAttributes({ description: e.target.value })}
            onKeyDown={e => e.stopPropagation()}
            placeholder="Short description (optional)"
            className="link-card-desc bg-transparent outline-none"
          />
          <span className="link-card-host">{displayHost(url)}</span>
        </div>
      )}
      {resolved && !editing && <CaptionInput value={caption} onChange={v => updateAttributes({ caption: v })} placeholder="Type caption for embed (optional)" />}
    </NodeViewWrapper>
  );
}

export const Embed = Node.create({
  name: 'embed',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return { url: { default: '' }, caption: { default: '' }, title: { default: '' }, description: { default: '' } };
  },
  parseHTML() { return [{ tag: 'figure[data-type="embed"]' }]; },
  renderHTML({ HTMLAttributes }) { return ['figure', { 'data-type': 'embed', 'data-url': HTMLAttributes.url }]; },
  addNodeView() { return ReactNodeViewRenderer(EmbedView); },
  addCommands() {
    return { setEmbed: attrs => ({ commands }: CommandProps) => commands.insertContent({ type: this.name, attrs }) };
  },
});

// ─── Callout ─────────────────────────────────────────────────────────────────

const CALLOUTS = [
  { v: 'info', icon: Info, label: 'Info' },
  { v: 'tip', icon: Lightbulb, label: 'Tip' },
  { v: 'warning', icon: AlertTriangle, label: 'Warning' },
  { v: 'success', icon: CheckCircle2, label: 'Success' },
] as const;

function CalloutView({ node, updateAttributes, selected }: NodeViewProps) {
  const variant = node.attrs.variant as string;
  const current = CALLOUTS.find(c => c.v === variant) ?? CALLOUTS[0];
  const Icon = current.icon;
  return (
    <NodeViewWrapper className={`callout callout-${current.v} relative`} data-type="callout" data-variant={current.v}>
      {selected && (
        <NodeToolbar>
          {CALLOUTS.map(c => (
            <TBtn key={c.v} title={c.label} active={c.v === current.v} on={() => updateAttributes({ variant: c.v })}><c.icon className="h-4 w-4" /></TBtn>
          ))}
        </NodeToolbar>
      )}
      <button
        type="button"
        contentEditable={false}
        title="Change style"
        onMouseDown={e => {
          e.preventDefault();
          const i = CALLOUTS.findIndex(c => c.v === current.v);
          updateAttributes({ variant: CALLOUTS[(i + 1) % CALLOUTS.length].v });
        }}
        className="callout-icon flex h-7 items-center"
      >
        <Icon className="h-5 w-5" />
      </button>
      <NodeViewContent className="callout-body" />
    </NodeViewWrapper>
  );
}

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'paragraph+',
  defining: true,
  addAttributes() { return { variant: { default: 'info' } }; },
  parseHTML() { return [{ tag: 'div[data-type="callout"]' }]; },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes({ 'data-type': 'callout' }, HTMLAttributes), 0]; },
  addNodeView() { return ReactNodeViewRenderer(CalloutView); },
  addCommands() {
    return {
      setCallout: attrs => ({ commands }: CommandProps) => commands.wrapIn(this.name, { variant: attrs?.variant ?? 'info' }),
    };
  },
});

// ─── Pull quote ──────────────────────────────────────────────────────────────

export const PullQuote = Node.create({
  name: 'pullQuote',
  group: 'block',
  content: 'inline*',
  defining: true,
  parseHTML() { return [{ tag: 'blockquote[data-type="pullQuote"]' }]; },
  renderHTML() { return ['blockquote', { 'data-type': 'pullQuote', class: 'pull-quote' }, 0]; },
  addCommands() {
    return { setPullQuote: () => ({ commands }: CommandProps) => commands.setNode(this.name) };
  },
  addKeyboardShortcuts() {
    return {
      // Enter at the end of a pull quote continues with a normal paragraph.
      Enter: ({ editor }) => {
        if (!editor.isActive(this.name)) return false;
        return editor.chain().insertContentAt(editor.state.selection.to + 1, { type: 'paragraph' }).focus(editor.state.selection.to + 2).run();
      },
    };
  },
});

// ─── Content card (product / project / experience / story) ───────────────────

const KIND_LABEL: Record<ContentCardKind, string> = { product: 'Product', project: 'Project', experience: 'Experience', post: 'Story' };

function ContentCardView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const { kind, refIds, layout } = node.attrs as { kind: ContentCardKind; refIds: string[]; layout: 'card' | 'compact' };
  const data = useEmbeddables();
  // A freshly inserted card opens the picker straight away.
  const [picking, setPicking] = useState(refIds.length === 0);
  const items = (data?.[kind] ?? []).filter(i => refIds.includes(i.id)).sort((a, b) => refIds.indexOf(a.id) - refIds.indexOf(b.id));
  const missing = data ? refIds.length - items.length : 0;

  return (
    <NodeViewWrapper className="relative" data-drag-handle>
      {selected && (
        <NodeToolbar>
          <TBtn title="Card layout" active={layout !== 'compact'} on={() => updateAttributes({ layout: 'card' })}><LayoutGrid className="h-4 w-4" /></TBtn>
          <TBtn title="Compact layout" active={layout === 'compact'} on={() => updateAttributes({ layout: 'compact' })}><Rows3 className="h-4 w-4" /></TBtn>
          <span className="mx-1 h-5 w-px bg-white/20" />
          <TBtn title={`Choose ${KIND_LABEL[kind].toLowerCase()}s`} on={() => setPicking(true)}><Pencil className="h-4 w-4" /></TBtn>
          <TBtn title="Remove" on={deleteNode}><Trash2 className="h-4 w-4" /></TBtn>
        </NodeToolbar>
      )}
      <div className={`content-cards content-cards-${layout === 'compact' ? 'compact' : 'card'} ${items.length > 1 ? 'is-grid' : ''} ${selected ? 'outline outline-[3px] outline-offset-4 outline-[#1a8917]' : ''}`}>
        {!data && <div className="flex h-24 items-center justify-center rounded-lg border border-[#e6e6e6]"><Loader2 className="h-5 w-5 animate-spin text-[#9b9b9b]" /></div>}
        {items.map(item => (
          <div key={item.id} className={`content-card content-card-${kind}`}>
            {item.image && layout !== 'compact' && (
              // eslint-disable-next-line @next/next/no-img-element
              <span className="cc-media"><img src={item.image} alt="" /></span>
            )}
            <span className="cc-body">
              <span className="cc-kind">{KIND_LABEL[kind]}</span>
              <span className="cc-title">{item.title}</span>
              {item.subtitle && <span className="cc-subtitle">{item.subtitle}</span>}
              {item.meta && <span className="cc-footer"><span className="cc-meta">{item.meta}</span></span>}
            </span>
            {item.image && layout === 'compact' && (
              // eslint-disable-next-line @next/next/no-img-element
              <span className="cc-thumb"><img src={item.image} alt="" /></span>
            )}
          </div>
        ))}
        {data && items.length === 0 && (
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setPicking(true); }}
            className="flex h-24 w-full items-center justify-center rounded-lg border-2 border-dashed border-[#e6e6e6] text-[14px] text-[#6b6b6b] hover:border-[#c4c4c4]"
          >
            Choose {KIND_LABEL[kind].toLowerCase()}s to embed
          </button>
        )}
      </div>
      {missing > 0 && (
        <p contentEditable={false} className="mt-2 font-sans text-[12px] text-[#c98a00]">
          {missing} embedded item{missing > 1 ? 's were' : ' was'} deleted or unpublished and won’t show to readers.
        </p>
      )}
      {picking && (
        <ContentPickerDialog
          kind={kind}
          selected={refIds}
          onClose={() => setPicking(false)}
          onConfirm={(k, ids) => { updateAttributes({ kind: k, refIds: ids }); setPicking(false); }}
        />
      )}
    </NodeViewWrapper>
  );
}

export const ContentCard = Node.create({
  name: 'contentCard',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return { kind: { default: 'product' }, refIds: { default: [] }, layout: { default: 'card' } };
  },
  parseHTML() { return [{ tag: 'div[data-type="contentCard"]' }]; },
  renderHTML() { return ['div', { 'data-type': 'contentCard' }]; },
  addNodeView() { return ReactNodeViewRenderer(ContentCardView); },
  addCommands() {
    return { setContentCard: attrs => ({ commands }: CommandProps) => commands.insertContent({ type: this.name, attrs }) };
  },
});

// ─── Button ──────────────────────────────────────────────────────────────────

function ButtonView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const { label, href, variant } = node.attrs as { label: string; href: string; variant: 'solid' | 'outline' };
  const [editing, setEditing] = useState(!href);
  useEffect(() => { if (!selected && href) setEditing(false); }, [selected, href]);

  return (
    <NodeViewWrapper className="story-button-row relative">
      {selected && (
        <NodeToolbar>
          <TBtn title="Solid" active={variant !== 'outline'} on={() => updateAttributes({ variant: 'solid' })}>Solid</TBtn>
          <TBtn title="Outline" active={variant === 'outline'} on={() => updateAttributes({ variant: 'outline' })}>Outline</TBtn>
          <TBtn title="Edit" on={() => setEditing(true)}><Pencil className="h-4 w-4" /></TBtn>
          <TBtn title="Remove" on={deleteNode}><Trash2 className="h-4 w-4" /></TBtn>
        </NodeToolbar>
      )}
      <span className={`story-button story-button-${variant === 'outline' ? 'outline' : 'solid'} ${selected ? 'outline outline-[3px] outline-offset-2 outline-[#1a8917]' : ''}`}>
        {label || 'Button'}
      </span>
      {editing && (
        <span contentEditable={false} className="mx-auto mt-3 flex max-w-[480px] gap-2 font-sans">
          <input
            autoFocus
            value={label}
            onChange={e => updateAttributes({ label: e.target.value })}
            onKeyDown={e => e.stopPropagation()}
            placeholder="Label"
            className="w-1/3 rounded border border-[#e6e6e6] px-3 py-1.5 text-[14px] outline-none focus:border-[#242424]"
          />
          <input
            value={href}
            onChange={e => updateAttributes({ href: e.target.value })}
            onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') setEditing(false); }}
            placeholder="https://… or /shop/…"
            className="min-w-0 flex-1 rounded border border-[#e6e6e6] px-3 py-1.5 text-[14px] outline-none focus:border-[#242424]"
          />
        </span>
      )}
    </NodeViewWrapper>
  );
}

export const StoryButton = Node.create({
  name: 'button',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() { return { label: { default: '' }, href: { default: '' }, variant: { default: 'solid' } }; },
  parseHTML() { return [{ tag: 'div[data-type="button"]' }]; },
  renderHTML() { return ['div', { 'data-type': 'button' }]; },
  addNodeView() { return ReactNodeViewRenderer(ButtonView); },
  addCommands() {
    return { setStoryButton: attrs => ({ commands }: CommandProps) => commands.insertContent({ type: this.name, attrs }) };
  },
});
