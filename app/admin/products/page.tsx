'use client';
// /admin/products — shop catalogue (EN/FR), files, media, discount codes
import { Suspense } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { CollectionManager, type FieldDef } from '@/components/admin/collection/CollectionManager';
import type { ShopProduct } from '@/app/admin/types';
import { slugify } from '@/lib/blog/doc';
import '@/app/blog/story.css';

const CATS = [{ value: 'platform', label: 'Platform' }, { value: 'app', label: 'App' }, { value: 'document', label: 'Document' }, { value: 'service', label: 'Service' }];

const schema: FieldDef[] = [
  { type: 'text', path: 'title', label: 'Title', translatable: true },
  { type: 'text', path: 'tagline', label: 'Tagline', translatable: true },
  { type: 'text', path: 'slug', label: 'URL slug', hint: '/shop/<slug>', half: true },
  { type: 'select', path: 'status', label: 'Status', half: true, options: [{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }, { value: 'archived', label: 'Archived' }] },
  { type: 'select', path: 'category', label: 'Category', half: true, options: CATS },
  { type: 'select', path: 'language', label: 'Primary language', half: true, options: [{ value: 'both', label: 'Both' }, { value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }] },
  { type: 'section', path: '_price', label: 'Pricing' },
  { type: 'number', path: 'price', label: 'Price', half: true },
  { type: 'select', path: 'currency', label: 'Currency', half: true, options: ['USD', 'EUR', 'GBP', 'KES', 'NGN', 'XAF'].map(c => ({ value: c, label: c })) },
  { type: 'text', path: 'priceLabel', label: 'Price label (optional)', hint: 'e.g. “From $4,999” or “$199 / session”', translatable: true },
  { type: 'objects', path: 'discountCodes', label: 'Discount codes', addLabel: 'Add a code', summary: o => (o.code ? `${o.code} · ${o.type === 'fixed' ? '' : ''}${o.value ?? ''}${o.type === 'percent' ? '%' : ''}` : ''),
    fields: [
      { type: 'text', path: 'code', label: 'Code', half: true },
      { type: 'select', path: 'type', label: 'Type', half: true, options: [{ value: 'percent', label: 'Percent' }, { value: 'fixed', label: 'Fixed amount' }] },
      { type: 'number', path: 'value', label: 'Value', half: true },
      { type: 'text', path: 'label', label: 'Label (optional)', half: true },
    ] },
  { type: 'section', path: '_content', label: 'Content' },
  { type: 'markdown', path: 'description', label: 'Description (Markdown)', translatable: true },
  { type: 'list', path: 'features', label: 'What’s included', placeholder: 'Add a feature', translatable: true },
  { type: 'tags', path: 'tags', label: 'Tags' },
  { type: 'section', path: '_media', label: 'Media & delivery' },
  { type: 'media', path: 'cover', label: 'Cover image', accept: 'image/*' },
  { type: 'objects', path: 'media', label: 'Gallery', addLabel: 'Add media', summary: o => String(o.label || o.url || ''),
    fields: [
      { type: 'media', path: 'url', label: 'File', accept: 'image/*,video/*' },
      { type: 'select', path: 'kind', label: 'Kind', half: true, options: [{ value: 'image', label: 'Image' }, { value: 'video', label: 'Video' }] },
      { type: 'text', path: 'label', label: 'Label', half: true },
      { type: 'textarea', path: 'description', label: 'Caption' },
    ] },
  { type: 'media', path: 'fileUrl', label: 'Downloadable file (private)', accept: '*', hint: 'Delivered through expiring download links after payment, never shown publicly.', showIf: i => i.category !== 'service' },
  { type: 'url', path: 'demoUrl', label: 'Live demo URL', placeholder: 'https://', half: true },
];

export default function ProductsPage() {
  return (
    <AdminShell title="Products">
      <Suspense>
        <CollectionManager<ShopProduct>
          section="products"
          title="Products"
          singular="product"
          description="Everything sold in the shop, digital goods with a downloadable file, and services."
          schema={schema}
          newItem={() => ({ id: Math.random().toString(36).slice(2, 10), slug: `product-${Date.now().toString(36)}`, title: '', tagline: '', description: '', category: 'platform', price: 0, currency: 'USD', priceLabel: '', status: 'draft', features: [], tags: [], media: [], discountCodes: [], language: 'both' })}
          card={p => ({
            title: p.title, subtitle: p.tagline, image: p.cover || p.media?.find(m => m.kind === 'image')?.url,
            badges: [
              { label: p.status, tone: p.status === 'published' ? 'green' : p.status === 'draft' ? 'amber' : 'neutral' },
              { label: CATS.find(c => c.value === p.category)?.label ?? p.category },
              ...(p.category !== 'service' && !p.fileUrl ? [{ label: 'no file', tone: 'red' as const }] : []),
            ],
            meta: p.priceLabel || `${p.currency} ${p.price}`,
          })}
          previewHref={p => (p.status === 'published' ? `/shop/${p.slug || slugify(p.title)}` : null)}
          extraFilters={[
            { key: 'published', label: 'Published', test: p => p.status === 'published' },
            { key: 'draft', label: 'Drafts', test: p => p.status === 'draft' },
            ...CATS.map(c => ({ key: c.value, label: c.label, test: (p: ShopProduct) => p.category === c.value })),
          ]}
        />
      </Suspense>
    </AdminShell>
  );
}
