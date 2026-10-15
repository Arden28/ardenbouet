'use client';
// The story editor: Medium-like distraction-free canvas with title/subtitle, slash commands,
// "+" inserter, selection bubble, rich media + site-content embeds, autosave, revisions, publish flow.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent, useEditorState, type Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder, CharacterCount, Focus } from '@tiptap/extensions';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Typography from '@tiptap/extension-typography';
import { Markdown } from 'tiptap-markdown';
import { createLowlight, common } from 'lowlight';
import { ArrowLeft, Eye, Settings2, History, MoreHorizontal, Loader2, AlertCircle, Check, Keyboard } from 'lucide-react';
import type { EditorPost } from '@/lib/blog/admin';
import { firstImage, readingMinutes as calcReading, type PMNode } from '@/lib/blog/doc';
import { resolveEmbed } from '@/lib/blog/embeds';
import { Figure, Gallery, Embed, Callout, PullQuote, ContentCard, StoryButton } from './nodes';
import { SlashCommands, insertUploadedImages } from './commands';
import { SelectionBubble, BlockInserter, TableMenu } from './EditorMenus';
import { PublishDialog, SettingsDrawer, RevisionsDrawer } from './Panels';
import { usePostSaver, type SaveState } from './usePostSaver';
import { loadEmbeddables } from './embeddables';
import '@/app/blog/story.css';

const lowlight = createLowlight(common);
const LANGS = ['plaintext', 'typescript', 'javascript', 'tsx', 'jsx', 'python', 'php', 'go', 'rust', 'java', 'kotlin', 'swift', 'c', 'cpp', 'csharp', 'ruby', 'bash', 'shell', 'sql', 'json', 'yaml', 'html', 'xml', 'css', 'scss', 'markdown', 'dockerfile', 'graphql', 'diff'];

// Fields only the server decides; everything else stays as the author typed it.
const SERVER_FIELDS = ['updatedAt', 'status', 'publishedAt', 'scheduledAt', 'slug', 'wordCount', 'readingMinutes', 'newsletterSentAt', 'seriesId'] as const;

function AutoTextarea({ value, onChange, placeholder, className, onEnter, autoFocus }: {
  value: string; onChange: (v: string) => void; placeholder: string; className: string; onEnter?: () => void; autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      autoFocus={autoFocus}
      onChange={e => onChange(e.target.value.replace(/\n/g, ' '))}
      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onEnter?.(); } }}
      placeholder={placeholder}
      className={`block w-full resize-none overflow-hidden bg-transparent outline-none placeholder:text-[#b3b3b1] ${className}`}
    />
  );
}

function CodeLanguageMenu({ editor }: { editor: Editor }) {
  const lang = useEditorState({ editor, selector: ({ editor: e }) => (e.getAttributes('codeBlock').language as string | null) ?? '' });
  return (
    <BubbleMenu
      editor={editor}
      pluginKey="codeLang"
      options={{ placement: 'top-end', offset: 6 }}
      shouldShow={({ editor: e }) => e.isActive('codeBlock')}
      className="z-50"
    >
      <select
        value={lang}
        onChange={e => editor.chain().focus().updateAttributes('codeBlock', { language: e.target.value || null }).run()}
        className="rounded-md border border-[#e6e6e6] bg-white px-2 py-1 font-sans text-[12px] text-[#242424] shadow-sm outline-none"
        aria-label="Code language"
      >
        <option value="">auto-detect</option>
        {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
      </select>
    </BubbleMenu>
  );
}

function SaveIndicator({ state, error, onRetry }: { state: SaveState; error: string; onRetry: () => void }) {
  if (state === 'saving') return <span className="flex items-center gap-1.5 text-[13px] text-[#9b9b9b]"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</span>;
  if (state === 'dirty') return <span className="text-[13px] text-[#9b9b9b]">Unsaved changes</span>;
  if (state === 'error' || state === 'conflict') {
    return (
      <button type="button" onClick={state === 'conflict' ? () => window.location.reload() : onRetry} title={error} className="flex items-center gap-1.5 text-[13px] text-[#c94a4a]">
        <AlertCircle className="h-3.5 w-3.5" /> {state === 'conflict' ? 'Edited elsewhere — reload' : 'Not saved — retry'}
      </button>
    );
  }
  return <span className="flex items-center gap-1.5 text-[13px] text-[#9b9b9b]"><Check className="h-3.5 w-3.5" /> Saved</span>;
}

const STATUS_CHIP: Record<string, string> = {
  DRAFT: 'bg-[#f2f2f2] text-[#6b6b6b]',
  SCHEDULED: 'bg-[#fdf6e7] text-[#7a5a00]',
  PUBLISHED: 'bg-[#eef7ee] text-[#1a8917]',
  ARCHIVED: 'bg-[#f2f2f2] text-[#9b9b9b]',
};

const SHORTCUTS: [string, string][] = [
  ['/', 'Insert block menu'], ['⌘ B / I / U', 'Bold / italic / underline'], ['⌘ K', 'Add link (select text first)'],
  ['⌘ ⌥ 1 / 2 / 3', 'Heading / subheading / small heading'], ['⌘ ⇧ 7 / 8', 'Numbered / bulleted list'],
  ['⌘ ⇧ B', 'Quote'], ['⌘ ⌥ C', 'Code block'], ['⌘ S', 'Save now'], ['⌘ ⇧ P', 'Preview'],
  ['**text** / _text_', 'Markdown shortcuts work as you type'], ['---', 'Separator'], ['```', 'Code block'],
];

export default function StoryEditor({ id }: { id: string }) {
  const router = useRouter();
  const [post, setPost] = useState<EditorPost | null>(null);
  const [loadError, setLoadError] = useState('');
  const [panel, setPanel] = useState<null | 'publish' | 'settings' | 'history' | 'shortcuts'>(null);
  const [menu, setMenu] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);

  const onSaved = useCallback((server: EditorPost) => {
    setPost(cur => {
      if (!cur) return server;
      const next = { ...cur };
      for (const k of SERVER_FIELDS) (next as Record<string, unknown>)[k] = server[k];
      if (!cur.excerpt && server.excerpt) next.excerpt = server.excerpt;
      return next;
    });
  }, []);
  const { state: saveState, error: saveError, queue, flush } = usePostSaver(post, onSaved);

  const patch = useCallback((p: Record<string, unknown>, immediate = false) => {
    const { status: _s, scheduledAt: _sa, ...optimistic } = p;
    setPost(cur => (cur ? { ...cur, ...optimistic } as EditorPost : cur));
    return queue(p, immediate);
  }, [queue]);

  // ── Load ────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/admin/blog/posts/${id}`, { cache: 'no-store' })
      .then(async r => { if (!r.ok) throw new Error(r.status === 404 ? 'Story not found' : `Error ${r.status}`); return r.json(); })
      .then(d => setPost(d.post))
      .catch(e => setLoadError(e.message));
    fetch('/api/admin/blog/posts').then(r => r.json()).then(d => {
      const counts = new Map<string, number>();
      for (const p of d.posts ?? []) for (const t of p.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
      setTagSuggestions(Array.from(counts).sort((a, b) => b[1] - a[1]).map(([t]) => t));
    }).catch(() => {});
    fetch('/api/admin/blog/subscribers').then(r => r.json()).then(d => {
      setSubscriberCount((d.subscribers ?? []).filter((s: { status: string }) => s.status === 'ACTIVE').length);
    }).catch(() => setSubscriberCount(0));
    loadEmbeddables();
  }, [id]);

  // ── Editor ──────────────────────────────────────────────────────────────
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer' } },
        dropcursor: { color: '#1a8917', width: 3 },
      }),
      Placeholder.configure({
        includeChildren: false,
        placeholder: ({ node, editor: e }) => {
          if (node.type.name === 'heading') return ['Heading', 'Subheading', 'Small heading'][(node.attrs.level ?? 2) - 2] ?? 'Heading';
          if (node.type.name === 'paragraph' && e.state.doc.childCount <= 1) return 'Tell your story… (type “/” for blocks)';
          return node.type.name === 'paragraph' ? 'Type “/” for blocks' : '';
        },
        showOnlyCurrent: true,
      }),
      CharacterCount,
      Focus.configure({ className: 'has-focus', mode: 'shallowest' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow, TableHeader, TableCell,
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: null }),
      TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center'] }),
      Highlight,
      Typography,
      Markdown.configure({ html: false, tightLists: true, transformPastedText: true }),
      Figure, Gallery, Embed, Callout, PullQuote, ContentCard, StoryButton,
      SlashCommands,
    ],
    editorProps: {
      attributes: { class: 'outline-none min-h-[50vh] pb-[40vh]', spellcheck: 'true' },
      handlePaste: (view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter(f => f.type.startsWith('image/'));
        if (files.length && editorRef.current) { insertUploadedImages(editorRef.current, files); return true; }
        // A bare embeddable URL pasted on an empty line becomes an embed.
        const text = event.clipboardData?.getData('text/plain')?.trim() ?? '';
        const { $from } = view.state.selection;
        if (/^https?:\/\/\S+$/.test(text) && $from.parent.content.size === 0 && resolveEmbed(text) && editorRef.current) {
          editorRef.current.chain().focus().setEmbed({ url: text }).run();
          return true;
        }
        return false;
      },
      handleDrop: (view, event, _slice, moved) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'));
        if (moved || !files.length || !editorRef.current) return false;
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        event.preventDefault();
        insertUploadedImages(editorRef.current, files, pos);
        return true;
      },
    },
    onUpdate: ({ editor: e }) => {
      if (!loadedRef.current) return;
      patchRef.current({ content: e.getJSON() });
    },
  });
  const patchRef = useRef(patch);
  patchRef.current = patch;
  const editorRef = useRef<Editor | null>(null);
  editorRef.current = editor;
  const loadedRef = useRef(false);

  // Fill the editor once both the post and the editor exist.
  useEffect(() => {
    if (!editor || !post || loadedRef.current) return;
    loadedRef.current = true;
    // Deferred: React node views flushSync while mounting, which React forbids inside an effect.
    setTimeout(() => {
      if (post.content) editor.commands.setContent(post.content as object, { emitUpdate: false });
      else if (post.bodyMd) editor.commands.setContent(post.bodyMd, { emitUpdate: false }); // legacy markdown note
    }, 0);
  }, [editor, post]);

  const stats = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      if (!e) return { words: 0, minutes: 1, cover: undefined as string | undefined };
      const words = (e.storage as { characterCount?: { words: () => number } }).characterCount?.words() ?? 0;
      const json = e.getJSON() as PMNode;
      let imgs = 0;
      json.content?.forEach(n => { if (n.type === 'figure') imgs++; if (n.type === 'gallery') imgs += n.attrs?.images?.length ?? 0; });
      return { words, minutes: calcReading(words, imgs), cover: firstImage(json) };
    },
  }) ?? { words: 0, minutes: 1, cover: undefined };

  // ── Shortcuts ───────────────────────────────────────────────────────────
  const preview = useCallback(async () => {
    if (!post) return;
    await flush();
    window.open(`/blog/${post.slug}`, '_blank', 'noopener');
  }, [post, flush]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); flush(); }
      if (mod && e.shiftKey && e.key.toLowerCase() === 'p') { e.preventDefault(); preview(); }
      if (mod && e.key === '/') { e.preventDefault(); setPanel(p => (p === 'shortcuts' ? null : 'shortcuts')); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flush, preview]);

  const restore = async (r: { title: string; subtitle: string; content: unknown; bodyMd: string | null }) => {
    if (!editor || !post) return;
    await fetch(`/api/admin/blog/posts/${post.id}/revisions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label: 'Before restore' }) });
    if (r.content) editor.commands.setContent(r.content as object, { emitUpdate: false });
    else editor.commands.setContent(r.bodyMd ?? '', { emitUpdate: false });
    patch({ title: r.title, subtitle: r.subtitle, content: editor.getJSON() }, true);
    setPanel(null);
  };

  const publishLabel = useMemo(() => {
    if (!post) return 'Publish';
    if (post.status === 'PUBLISHED') return 'Update';
    if (post.status === 'SCHEDULED') return 'Scheduled';
    return 'Publish';
  }, [post]);

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 font-sans">
        <p className="text-[#6b6b6b]">{loadError}</p>
        <Link href="/admin/blog" className="rounded-full bg-[#242424] px-4 py-2 text-sm text-white">Back to stories</Link>
      </div>
    );
  }

  return (
    <div className="blog-ui min-h-screen bg-white">
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-[60] border-b border-[#f2f2f2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[57px] max-w-[1192px] items-center gap-3 px-4 font-sans sm:px-6">
          <Link href="/admin/blog" onClick={() => { flush(); }} className="flex items-center gap-2 rounded-full p-1.5 text-[#6b6b6b] hover:bg-[#f2f2f2] hover:text-[#242424]" aria-label="Back to stories">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="font-story text-[22px] font-bold text-[#242424]">Arden</span>
          {post && <span className={`hidden rounded-full px-2.5 py-0.5 text-[12px] font-medium sm:inline ${STATUS_CHIP[post.status]}`}>{post.status.toLowerCase()}</span>}
          <span className="hidden sm:inline"><SaveIndicator state={saveState} error={saveError} onRetry={() => flush()} /></span>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <span className="mr-2 hidden text-[13px] text-[#9b9b9b] md:inline">{stats.words.toLocaleString()} words · {stats.minutes} min read</span>
            <button type="button" onClick={() => setPanel('publish')} disabled={!post} className="rounded-full bg-[#1a8917] px-3.5 py-1.5 text-[14px] text-white hover:bg-[#156d12] disabled:opacity-50">
              {publishLabel}
            </button>
            <button type="button" onClick={preview} disabled={!post} title="Preview (⌘⇧P)" className="rounded-full p-2 text-[#6b6b6b] hover:bg-[#f2f2f2] hover:text-[#242424]"><Eye className="h-5 w-5" /></button>
            <button type="button" onClick={() => setPanel('settings')} disabled={!post} title="Story settings" className="rounded-full p-2 text-[#6b6b6b] hover:bg-[#f2f2f2] hover:text-[#242424]"><Settings2 className="h-5 w-5" /></button>
            <div className="relative">
              <button type="button" onClick={() => setMenu(m => !m)} className="rounded-full p-2 text-[#6b6b6b] hover:bg-[#f2f2f2] hover:text-[#242424]" aria-label="More"><MoreHorizontal className="h-5 w-5" /></button>
              {menu && (
                <div className="absolute right-0 top-11 w-56 rounded-md border border-[#f2f2f2] bg-white py-2 text-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.12)]" onMouseLeave={() => setMenu(false)}>
                  <button type="button" onClick={() => { setPanel('history'); setMenu(false); }} className="flex w-full items-center gap-3 px-4 py-2 text-left text-[#6b6b6b] hover:text-[#242424]"><History className="h-4 w-4" /> Version history</button>
                  <button type="button" onClick={() => { setPanel('shortcuts'); setMenu(false); }} className="flex w-full items-center gap-3 px-4 py-2 text-left text-[#6b6b6b] hover:text-[#242424]"><Keyboard className="h-4 w-4" /> Keyboard shortcuts</button>
                  {post?.status === 'PUBLISHED' && (
                    <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2 text-[#6b6b6b] hover:text-[#242424]"><Eye className="h-4 w-4" /> View live story</a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Canvas ───────────────────────────────────────────────────── */}
      {!post || !editor ? (
        <div className="mx-auto max-w-[680px] animate-pulse space-y-4 px-6 pt-16">
          <div className="h-12 w-3/4 rounded bg-[#f2f2f2]" />
          <div className="h-6 w-1/2 rounded bg-[#f2f2f2]" />
          <div className="h-4 w-full rounded bg-[#f2f2f2]" />
          <div className="h-4 w-5/6 rounded bg-[#f2f2f2]" />
        </div>
      ) : (
        <main className="px-6 pt-12 sm:pt-16">
          <div className="mx-auto max-w-[680px]">
            <AutoTextarea
              value={post.title}
              onChange={v => patch({ title: v })}
              placeholder="Title"
              onEnter={() => document.getElementById('story-subtitle')?.focus()}
              className="font-story text-[34px] font-normal leading-[44px] text-[#242424] sm:text-[42px] sm:leading-[52px]"
            />
            <div id="story-title-anchor" />
            <AutoTextarea
              value={post.subtitle}
              onChange={v => patch({ subtitle: v })}
              placeholder="Subtitle (optional)"
              onEnter={() => editor.commands.focus('start')}
              className="mt-2 font-story text-[22px] leading-[30px] text-[#6b6b6b]"
            />
          </div>
          <EditorContent editor={editor} className="story story-editor mt-8" />
          <SelectionBubble editor={editor} />
          <BlockInserter editor={editor} />
          <TableMenu editor={editor} />
          <CodeLanguageMenu editor={editor} />
        </main>
      )}

      {/* ── Panels ───────────────────────────────────────────────────── */}
      {post && panel === 'publish' && (
        <PublishDialog
          post={post}
          patch={patch}
          onClose={() => setPanel(null)}
          fallbackCover={stats.cover}
          tagSuggestions={tagSuggestions}
          subscriberCount={subscriberCount}
        />
      )}
      {post && panel === 'settings' && (
        <SettingsDrawer
          post={post}
          patch={patch}
          onClose={() => setPanel(null)}
          onDeleted={() => router.push('/admin/blog')}
          fallbackCover={stats.cover}
          tagSuggestions={tagSuggestions}
        />
      )}
      {post && panel === 'history' && <RevisionsDrawer postId={post.id} onRestore={restore} onClose={() => setPanel(null)} />}
      {panel === 'shortcuts' && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/20 p-4 font-sans" onMouseDown={() => setPanel(null)}>
          <div className="w-full max-w-[460px] rounded-xl bg-white p-6 shadow-2xl" onMouseDown={e => e.stopPropagation()}>
            <h2 className="mb-4 text-[16px] font-semibold text-[#242424]">Keyboard shortcuts</h2>
            <dl className="space-y-2">
              {SHORTCUTS.map(([k, d]) => (
                <div key={k} className="flex items-center justify-between gap-4 text-[14px]">
                  <dt className="text-[#6b6b6b]">{d}</dt>
                  <dd><kbd className="rounded border border-[#e6e6e6] bg-[#fafafa] px-1.5 py-0.5 font-mono text-[12px] text-[#242424]">{k}</kbd></dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
