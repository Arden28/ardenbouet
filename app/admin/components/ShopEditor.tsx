'use client';
// app/admin/components/ShopEditor.tsx

import { useState, useMemo } from 'react';
import { Plus, Package, FileText, Wrench, Layers, Search, X, Globe, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ShopProduct, ProductMediaItem } from '../types';
import { TextField, SelectField, uid, Button, Rule, cn } from './atoms';
import { ArrayField } from './ArrayField';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES: { key: ShopProduct['category']; label: string; Icon: React.ElementType; color: string }[] = [
  { key: 'platform', label: 'Platform',  Icon: Layers,      color: 'text-blue-500'   },
  { key: 'app',      label: 'App',       Icon: Package,     color: 'text-purple-500' },
  { key: 'document', label: 'Document',  Icon: FileText,    color: 'text-amber-500'  },
  { key: 'service',  label: 'Service',   Icon: Wrench,      color: 'text-green-500'  },
];

const STATUS_CFG: Record<ShopProduct['status'], { label: string; dot: string; text: string }> = {
  published: { label: 'Published', dot: 'bg-[#2467AC]',  text: 'text-[#2467AC]'  },
  draft:     { label: 'Draft',     dot: 'bg-amber-400',  text: 'text-amber-600'  },
  archived:  { label: 'Archived',  dot: 'bg-zinc-400',   text: 'text-zinc-400'   },
};

const CURRENCIES    = ['USD', 'EUR', 'GBP', 'KES'];
const PRICE_LABELS  = ['one-time', '/ month', '/ year', 'starting at', 'free', 'contact us'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function autoSlug(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function formatPrice(price: number, currency: string, label: string): string {
  if (label === 'free') return 'Free';
  if (label === 'contact us') return 'Contact us';
  const sym: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', KES: 'KES ' };
  return `${sym[currency] ?? currency}${price}${label ? ` ${label}` : ''}`;
}

function blankProduct(): ShopProduct {
  return {
    id: uid(), slug: '', title: '', tagline: '', description: '',
    category: 'platform', price: 0, currency: 'USD', priceLabel: 'one-time',
    status: 'draft', features: [], tags: [], media: [],
    cover: '', demoUrl: '', buyUrl: '',
  };
}

function blankMediaItem(): ProductMediaItem {
  return { url: '', kind: 'image', label: '', description: '' };
}

// ─── Media editor ─────────────────────────────────────────────────────────────
function MediaEditor({ items, onChange }: { items: ProductMediaItem[]; onChange: (items: ProductMediaItem[]) => void }) {
  const update = (i: number, patch: Partial<ProductMediaItem>) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => {
    const next = [...items];
    next.splice(i, 1);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
          Media ({items.length})
        </p>
        <button
          type="button"
          onClick={() => onChange([...items, blankMediaItem()])}
          className="font-mono text-[9px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          + Add item
        </button>
      </div>

      {items.length === 0 && (
        <div className="border border-dashed border-zinc-200 dark:border-zinc-800 py-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            No media — add screenshots or demo videos
          </p>
        </div>
      )}

      {items.map((item, i) => (
        <div key={i} className="border border-zinc-200 dark:border-zinc-800 p-3 space-y-3">
          {/* Kind + remove */}
          <div className="flex items-center gap-2">
            <div className="flex border border-zinc-200 dark:border-zinc-800">
              {(['image', 'video'] as const).map(k => (
                <button
                  key={k}
                  type="button"
                  onClick={() => update(i, { kind: k })}
                  className={cn(
                    'px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest transition-colors',
                    item.kind === k
                      ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900'
                      : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300',
                  )}
                >
                  {k}
                </button>
              ))}
            </div>
            <span className="flex-1 truncate font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
              {item.label || item.url || `item ${i + 1}`}
            </span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="font-mono text-[9px] uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
            >
              Remove
            </button>
          </div>

          <TextField
            label="URL"
            value={item.url}
            onChange={v => update(i, { url: v })}
            placeholder="https://example.com/screenshot.png"
          />
          <TextField
            label="Label"
            value={item.label}
            onChange={v => update(i, { label: v })}
            placeholder="Dashboard overview"
          />
          <TextField
            label="Description"
            value={item.description ?? ''}
            onChange={v => update(i, { description: v || undefined })}
            placeholder="Optional context shown below the thumbnail"
          />

          {/* Image preview */}
          {item.kind === 'image' && item.url && (
            <div className="aspect-video overflow-hidden border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt="" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Full-screen editor overlay ───────────────────────────────────────────────
function ProductEditorOverlay({
  draft,
  onDraftChange,
  onSave,
  onClose,
}: {
  draft: ShopProduct;
  onDraftChange: (p: ShopProduct) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const set = (patch: Partial<ShopProduct>) => onDraftChange({ ...draft, ...patch });
  const cat = CATEGORIES.find(c => c.key === draft.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-zinc-950"
      role="dialog"
      aria-modal="true"
    >
      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-5 py-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-900 hover:text-zinc-900 dark:hover:border-zinc-100 dark:hover:text-zinc-100 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <span className="font-heading text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 max-w-[260px] truncate">
            {draft.title || 'New product'}
          </span>
          {cat && (
            <span className={cn('font-mono text-[9px] uppercase tracking-widest', cat.color)}>
              {cat.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Quick status toggle */}
          <div className="hidden items-center border border-zinc-200 dark:border-zinc-800 sm:flex">
            {(['draft', 'published', 'archived'] as const).map(s => (
              <button key={s} type="button" onClick={() => set({ status: s })}
                className={cn(
                  'px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest transition-colors border-r border-zinc-200 dark:border-zinc-800 last:border-0',
                  draft.status === s
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                    : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                )}
              >
                {STATUS_CFG[s].label}
              </button>
            ))}
          </div>
          <Button variant="primary" onClick={onSave}>Save product</Button>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar — metadata ─────────────────────────────────────────── */}
        <aside className="hidden w-72 shrink-0 flex-col gap-5 overflow-y-auto border-r border-zinc-200 dark:border-zinc-800 p-5 lg:flex [&::-webkit-scrollbar]:hidden">
          <TextField label="Title *" value={draft.title} onChange={v => set({ title: v, slug: draft.slug || autoSlug(v) })} required />
          <TextField label="Slug" value={draft.slug} onChange={v => set({ slug: v })} placeholder={autoSlug(draft.title) || 'product-slug'} hint="Auto-generated from title" />
          <TextField label="Tagline" value={draft.tagline} onChange={v => set({ tagline: v })} placeholder="One-line pitch shown on the card" />

          <SelectField
            label="Category"
            value={draft.category}
            onChange={v => set({ category: v as ShopProduct['category'] })}
            options={['platform', 'app', 'document', 'service']}
          />

          {/* Pricing */}
          <div className="flex gap-2">
            <TextField label="Price" value={String(draft.price)} onChange={v => set({ price: parseFloat(v) || 0 })} className="flex-1" />
            <SelectField label="Currency" value={draft.currency} onChange={v => set({ currency: v })} options={CURRENCIES} className="w-24" />
          </div>
          <SelectField label="Price label" value={draft.priceLabel} onChange={v => set({ priceLabel: v })} options={PRICE_LABELS} />

          <Rule />

          <TextField label="Cover image URL" value={draft.cover ?? ''} onChange={v => set({ cover: v })} placeholder="https://…" />
          {draft.cover && (
            <div className="relative aspect-video w-full overflow-hidden border border-zinc-200 dark:border-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={draft.cover} alt="" className="h-full w-full object-cover" />
            </div>
          )}

          <TextField label="Demo URL" value={draft.demoUrl ?? ''} onChange={v => set({ demoUrl: v })} placeholder="https://demo.…" />
          <TextField label="Buy / Stripe URL" value={draft.buyUrl ?? ''} onChange={v => set({ buyUrl: v })} placeholder="https://buy.stripe.com/…" />

          <Rule />

          <ArrayField label="Tags (comma-separated)" value={draft.tags} onChange={v => set({ tags: v })} separator="comma" placeholder="saas, next.js, starter" />
        </aside>

        {/* ── Main — features + description + media ──────────────────────── */}
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 [&::-webkit-scrollbar]:hidden">
          <ArrayField
            label="Features (one per line)"
            value={draft.features}
            onChange={v => set({ features: v })}
            separator="line"
            rows={8}
            placeholder="Next.js 14 App Router&#10;Stripe billing&#10;Admin dashboard"
            hint="Each line becomes a bullet point on the product page"
          />
          <TextField
            label="Full description"
            value={draft.description}
            onChange={v => set({ description: v })}
            textarea
            rows={8}
            placeholder="Detailed description shown on the product page. Markdown is supported."
          />

          {/* ── Media items ─────────────────────────────────────────────── */}
          <MediaEditor
            items={draft.media ?? []}
            onChange={items => set({ media: items })}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onEdit, onDelete }: { product: ShopProduct; onEdit: () => void; onDelete: () => void }) {
  const cat    = CATEGORIES.find(c => c.key === product.category)!;
  const status = STATUS_CFG[product.status];

  return (
    <motion.article
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="group relative flex flex-col border border-zinc-200 dark:border-zinc-800 hover:border-zinc-900 dark:hover:border-zinc-100 transition-colors duration-150"
    >
      {/* Cover */}
      <div className="relative aspect-video w-full overflow-hidden border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
        {product.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.cover} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <cat.Icon className={cn('h-8 w-8', cat.color)} />
          </div>
        )}
        {/* Status badge */}
        <div className="absolute left-2 top-2 flex items-center gap-1.5 border border-white/30 bg-white/90 dark:bg-zinc-900/90 px-2 py-1">
          <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
          <span className={cn('font-mono text-[8px] uppercase tracking-widest', status.text)}>{status.label}</span>
        </div>
        {/* Category */}
        <div className="absolute right-2 top-2 border border-zinc-200/80 dark:border-zinc-700 bg-white/90 dark:bg-zinc-900/90 px-1.5 py-0.5">
          <span className={cn('font-mono text-[8px] uppercase tracking-widest', cat.color)}>{cat.label}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="font-heading text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-snug">
          {product.title || 'Untitled'}
        </h3>
        {product.tagline && (
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{product.tagline}</p>
        )}
        <p className="mt-auto font-mono text-sm font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
          {formatPrice(product.price, product.currency, product.priceLabel)}
        </p>
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map(tag => (
              <span key={tag} className="border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-900 px-4 py-3">
        <div className="flex items-center gap-1">
          {product.demoUrl && (
            <a href={product.demoUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex h-6 w-6 items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              title="Demo"
            >
              <Globe className="h-3 w-3" />
            </a>
          )}
          {product.buyUrl && (
            <a href={product.buyUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex h-6 w-6 items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              title="Buy link"
            >
              <ShoppingBag className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="danger" size="sm" onClick={onDelete}>Del</Button>
          <Button variant="secondary" size="sm" onClick={onEdit}>Edit →</Button>
        </div>
      </div>

      {/* Hover accent */}
      <span aria-hidden className="absolute left-0 top-0 h-0 w-[2px] bg-[#2467AC] transition-[height] duration-300 group-hover:h-full" />
    </motion.article>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ShopEditor({ value, onChange }: { value: ShopProduct[]; onChange: (p: ShopProduct[]) => void }) {
  const [draft,     setDraft]     = useState<ShopProduct | null>(null);
  const [query,     setQuery]     = useState('');
  const [catFilter, setCatFilter] = useState<'all' | ShopProduct['category']>('all');
  const [stsFilter, setStsFilter] = useState<'all' | ShopProduct['status']>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return value.filter(p => {
      if (catFilter !== 'all' && p.category !== catFilter) return false;
      if (stsFilter !== 'all' && p.status !== stsFilter) return false;
      if (q && !p.title.toLowerCase().includes(q) && !p.tagline.toLowerCase().includes(q) && !p.tags.some(t => t.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [value, catFilter, stsFilter, query]);

  const save = () => {
    if (!draft || !draft.title.trim()) return;
    const item = { ...draft, slug: draft.slug || autoSlug(draft.title) };
    const exists = value.find(p => p.id === item.id);
    onChange(exists ? value.map(p => p.id === item.id ? item : p) : [item, ...value]);
    setDraft(null);
  };

  const remove = (id: string) => {
    if (confirm('Delete this product?')) onChange(value.filter(p => p.id !== id));
  };

  // Stats
  const published = value.filter(p => p.status === 'published').length;
  const drafts    = value.filter(p => p.status === 'draft').length;

  return (
    <>
      <Rule />
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex items-baseline gap-3">
          <h2 className="font-heading text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">Shop</h2>
          <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
            {published} published · {drafts} draft
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="search" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search products…"
              className="w-44 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-8 pr-3 py-1.5 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 transition-colors"
            />
          </div>
          <button type="button" onClick={() => setDraft(blankProduct())}
            className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Add product →
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 pb-4">
        {/* Category */}
        <button type="button" onClick={() => setCatFilter('all')}
          className={cn('border px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest transition-colors',
            catFilter === 'all' ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-50' : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-500')}>
          All
        </button>
        {CATEGORIES.map(c => (
          <button key={c.key} type="button" onClick={() => setCatFilter(c.key)}
            className={cn('flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest transition-colors',
              catFilter === c.key ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-50' : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-500')}>
            <c.Icon className={cn('h-3 w-3', c.color)} />{c.label}
          </button>
        ))}

        <span className="mx-1 self-center text-zinc-200 dark:text-zinc-800">|</span>

        {/* Status */}
        {(['all', 'published', 'draft', 'archived'] as const).map(s => (
          <button key={s} type="button" onClick={() => setStsFilter(s)}
            className={cn('border px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest transition-colors',
              stsFilter === s ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-50' : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-500')}>
            {s === 'all' ? 'All status' : STATUS_CFG[s].label}
          </button>
        ))}
      </div>

      <Rule />

      {/* Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <button type="button" onClick={() => setDraft(blankProduct())}
          className="group flex h-full min-h-[200px] flex-col items-center justify-center gap-3 border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:border-zinc-900 dark:hover:border-zinc-100 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors duration-150"
        >
          <div className="flex h-8 w-8 items-center justify-center border border-zinc-300 dark:border-zinc-700 group-hover:border-zinc-700 dark:group-hover:border-zinc-400 transition-colors">
            <Plus className="h-4 w-4" />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest">New Product</span>
        </button>

        <AnimatePresence mode="popLayout">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} onEdit={() => setDraft({ ...p })} onDelete={() => remove(p.id)} />
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && value.length > 0 && (
        <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
          No products match the current filters
        </p>
      )}

      {/* Full-screen overlay */}
      <AnimatePresence>
        {draft && (
          <ProductEditorOverlay
            key={draft.id}
            draft={draft}
            onDraftChange={setDraft}
            onSave={save}
            onClose={() => setDraft(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
