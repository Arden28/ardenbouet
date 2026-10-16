'use client';
// Schema-driven manager for the content-bundle collections (projects, experience, journey,
// products): searchable, reorderable list + drawer editor with English / Français tabs.
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Pencil, Copy, Trash2, ArrowUp, ArrowDown, ExternalLink, Languages, X } from 'lucide-react';
import { MediaField } from '@/components/admin/media/MediaField';
import { PeriodField } from '@/components/admin/PeriodField';
import { Badge, Button, Drawer, Empty, Field, ListInput, PageIntro, SaveStatus, SearchInput, Spinner, TagInput, Toggle, inputCls, cx } from '../ui';

// ─── Schema ──────────────────────────────────────────────────────────────────

type Base = { path: string; label: string; hint?: string; translatable?: boolean; half?: boolean; showIf?: (item: Record<string, unknown>) => boolean };
export type FieldDef =
  | (Base & { type: 'text' | 'url' | 'textarea' | 'markdown' | 'number'; placeholder?: string })
  /** Start/end months ("YYYY-MM") at `path` and `endPath`; an empty end means ongoing. */
  | (Base & { type: 'period'; endPath: string; currentLabel?: string })
  | (Base & { type: 'select'; options: { value: string; label: string }[] })
  | (Base & { type: 'tags'; suggestions?: string[] })
  | (Base & { type: 'list'; placeholder?: string; multiline?: boolean })
  | (Base & { type: 'media'; accept?: string; aspect?: string })
  | (Base & { type: 'toggle' })
  | (Base & { type: 'section' })
  | (Base & { type: 'objects'; fields: FieldDef[]; addLabel: string; summary: (o: Record<string, unknown>) => string });

export type CardInfo = { title: string; subtitle?: string; image?: string; badges?: { label: string; tone?: 'neutral' | 'green' | 'amber' | 'blue' | 'red' }[]; meta?: string };

type Item = Record<string, unknown> & { id: string; translations?: { fr?: Record<string, unknown> } };

export function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), obj);
}
export function setPath<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const clone = (Array.isArray(obj) ? [...obj] : { ...(obj as object) }) as Record<string, unknown>;
  let cur = clone;
  keys.forEach((k, i) => {
    if (i === keys.length - 1) cur[k] = value;
    else {
      const next = cur[k];
      cur[k] = next && typeof next === 'object' ? { ...(next as object) } : {};
      cur = cur[k] as Record<string, unknown>;
    }
  });
  return clone as T;
}

const uid = () => Math.random().toString(36).slice(2, 10);

// ─── Field renderer ──────────────────────────────────────────────────────────

function FieldInput({ def, value, onChange, reference }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void; reference?: unknown }) {
  const ph = reference && typeof reference === 'string' ? reference : 'placeholder' in def ? def.placeholder : undefined;
  switch (def.type) {
    case 'text': case 'url': case 'number':
      return <input type={def.type === 'number' ? 'number' : 'text'} value={(value as string | number | undefined) ?? ''} placeholder={ph}
        onChange={e => onChange(def.type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value)} className={inputCls} />;
    case 'textarea': case 'markdown':
      return <textarea value={(value as string) ?? ''} placeholder={ph} rows={def.type === 'markdown' ? 8 : 3} onChange={e => onChange(e.target.value)}
        className={cx(inputCls, def.type === 'markdown' && 'font-mono text-[13px] leading-6')} />;
    case 'select':
      return <select value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} className={inputCls}>{def.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
    case 'tags':
      return <TagInput value={(value as string[]) ?? []} onChange={onChange} suggestions={def.suggestions} />;
    case 'list':
      return <ListInput value={(value as string[]) ?? []} onChange={onChange} placeholder={def.placeholder} multiline={def.multiline} />;
    case 'media':
      return <MediaField value={(value as string) ?? ''} onChange={onChange} accept={def.accept} aspect={def.aspect} />;
    case 'toggle':
      return <Toggle checked={!!value} onChange={onChange} label={def.label} hint={def.hint} />;
    case 'objects': {
      const list = (value as Record<string, unknown>[]) ?? [];
      return (
        <div className="space-y-2">
          {list.map((o, i) => (
            <details key={i} className="group rounded-lg border border-[#ececec] bg-[#fcfcfc]" open={!def.summary(o)}>
              <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-[14px] text-[#242424]">
                <span className="font-mono text-[11px] text-[#c4c4c4]">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{def.summary(o) || 'New item'}</span>
                <button type="button" onClick={e => { e.preventDefault(); if (i > 0) { const n = [...list]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; onChange(n); } }} className="rounded p-1 text-[#9b9b9b] hover:text-[#242424]" aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={e => { e.preventDefault(); onChange(list.filter((_, j) => j !== i)); }} className="rounded p-1 text-[#9b9b9b] hover:text-[#c94a4a]" aria-label="Remove"><X className="h-4 w-4" /></button>
              </summary>
              <div className="grid gap-4 border-t border-[#ececec] p-3 sm:grid-cols-2">
                {def.fields.map(f => (
                  <div key={f.path} className={f.half ? '' : 'sm:col-span-2'}>
                    {f.type === 'toggle' ? <FieldInput def={f} value={o[f.path]} onChange={v => onChange(list.map((x, j) => (j === i ? { ...x, [f.path]: v } : x)))} />
                      : <Field label={f.label} hint={f.hint}><FieldInput def={f} value={o[f.path]} onChange={v => onChange(list.map((x, j) => (j === i ? { ...x, [f.path]: v } : x)))} /></Field>}
                  </div>
                ))}
              </div>
            </details>
          ))}
          <button type="button" onClick={() => onChange([...list, {}])} className="flex items-center gap-1.5 text-[13px] text-[#6b6b6b] hover:text-[#242424]"><Plus className="h-3.5 w-3.5" /> {def.addLabel}</button>
        </div>
      );
    }
    default: return null;
  }
}

function FieldsForm({ schema, item, onChange, lang }: { schema: FieldDef[]; item: Item; onChange: (i: Item) => void; lang: 'en' | 'fr' }) {
  const visible = schema.filter(f => (!f.showIf || f.showIf(item)) && (lang === 'en' || f.translatable || f.type === 'section'));
  // Drop section headers that end up with no fields under them (FR tab)
  const rows = visible.filter((f, i) => f.type !== 'section' || (visible[i + 1] && visible[i + 1].type !== 'section'));
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {rows.map(f => {
        if (f.type === 'period') {
          if (lang === 'fr') return null;
          return (
            <div key={f.path} className="sm:col-span-2">
              <PeriodField start={getPath(item, f.path) as string | undefined} end={getPath(item, f.endPath) as string | undefined} currentLabel={f.currentLabel}
                onChange={(start, end) => onChange(setPath(setPath(item, f.path, start), f.endPath, end))} />
              {f.hint && <p className="mt-1.5 text-[12px] text-[#9b9b9b]">{f.hint}</p>}
            </div>
          );
        }
        if (f.type === 'section') return <h3 key={f.path} className="mt-4 border-t border-[#f2f2f2] pt-5 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#9b9b9b] sm:col-span-2">{f.label}</h3>;
        const path = lang === 'fr' ? `translations.fr.${f.path}` : f.path;
        const value = getPath(item, path);
        const set = (v: unknown) => onChange(setPath(item, path, v));
        const reference = lang === 'fr' ? getPath(item, f.path) : undefined;
        return (
          <div key={f.path} className={f.half ? '' : 'sm:col-span-2'}>
            {f.type === 'toggle' ? <FieldInput def={f} value={value} onChange={set} /> : (
              <Field label={f.label} hint={lang === 'fr' && reference && typeof reference === 'string' ? undefined : f.hint}>
                <FieldInput def={f} value={value} onChange={set} reference={reference} />
                {lang === 'fr' && Array.isArray(reference) && reference.length > 0 && !(Array.isArray(value) && value.length) && (
                  <span className="mt-1.5 block text-[12px] text-[#9b9b9b]">EN: {(reference as unknown[]).map(r => (typeof r === 'string' ? r : '')).filter(Boolean).slice(0, 3).join(' · ')}{reference.length > 3 ? '…' : ''}</span>
                )}
              </Field>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Manager ─────────────────────────────────────────────────────────────────

export function CollectionManager<T extends Item>({ section, title, description, singular, schema, newItem, card, previewHref, extraFilters }: {
  section: 'projects' | 'experiences' | 'journey' | 'products';
  title: string;
  description?: string;
  singular: string;
  schema: FieldDef[];
  newItem: () => T;
  card: (item: T) => CardInfo;
  previewHref?: (item: T) => string | null;
  extraFilters?: { key: string; label: string; test: (item: T) => boolean }[];
}) {
  const params = useSearchParams();
  const [items, setItems] = useState<T[] | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState<{ item: T; isNew: boolean } | null>(null);
  const [lang, setLang] = useState<'en' | 'fr'>('en');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/content', { cache: 'no-store' }).then(r => r.json()).then(d => setItems((d[section] ?? []) as T[]));
  }, [section]);

  const persist = useCallback(async (next: T[]) => {
    setItems(next);
    setState('saving');
    const res = await fetch('/api/admin/content', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section, value: next }) });
    if (res.ok) { setState('saved'); setError(''); } else { setState('error'); setError((await res.json().catch(() => ({}))).error ?? 'Save failed'); }
  }, [section]);

  // ?new=1 opens a fresh item (dashboard quick actions)
  useEffect(() => { if (items && params.get('new') && !editing) { setLang('en'); setEditing({ item: newItem(), isNew: true }); } }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = useMemo(() => {
    if (!items) return [];
    const term = q.trim().toLowerCase();
    const f = extraFilters?.find(x => x.key === filter);
    return items.filter(it => (!f || f.test(it)) && (!term || JSON.stringify(card(it)).toLowerCase().includes(term)));
  }, [items, q, filter, extraFilters, card]);

  const save = async () => {
    if (!editing || !items) return;
    const exists = items.some(i => i.id === editing.item.id);
    await persist(exists ? items.map(i => (i.id === editing.item.id ? editing.item : i)) : [editing.item, ...items]);
    setEditing(null);
  };
  const move = (id: string, d: number) => {
    if (!items) return;
    const i = items.findIndex(x => x.id === id), j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    persist(next);
  };
  const duplicate = (it: T) => {
    if (!items) return;
    const copy = { ...structuredClone(it), id: uid(), ...('slug' in it ? { slug: `${it.slug}-copy` } : {}), ...('title' in it ? { title: `${it.title} (copy)` } : {}) } as T;
    const i = items.findIndex(x => x.id === it.id);
    persist([...items.slice(0, i + 1), copy, ...items.slice(i + 1)]);
  };
  const remove = (it: T) => {
    if (!items || !confirm(`Delete “${card(it).title}”? This can’t be undone.`)) return;
    persist(items.filter(i => i.id !== it.id));
  };

  const frCount = (it: T) => Object.values(it.translations?.fr ?? {}).filter(v => v && (typeof v !== 'string' || v.trim()) && (!Array.isArray(v) || v.length)).length;
  const translatableCount = schema.filter(f => f.translatable).length;

  return (
    <div className="mx-auto max-w-[1000px]">
      <PageIntro
        title={title}
        description={description}
        actions={<>
          <SaveStatus state={state === 'idle' ? 'idle' : state} error={error} />
          <Button variant="primary" onClick={() => { setLang('en'); setEditing({ item: newItem(), isNew: true }); }}><Plus className="h-4 w-4" /> New {singular}</Button>
        </>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={q} onChange={setQ} placeholder={`Search ${title.toLowerCase()}`} className="w-full sm:w-72" />
        {extraFilters && (
          <div className="flex flex-wrap gap-1.5">
            {[{ key: 'all', label: 'All' }, ...extraFilters].map(f => (
              <button key={f.key} type="button" onClick={() => setFilter(f.key)} className={cx('rounded-full px-3 py-1.5 text-[13px]', filter === f.key ? 'bg-[#242424] text-white' : 'bg-white text-[#6b6b6b] ring-1 ring-[#e6e6e6] hover:text-[#242424]')}>{f.label}</button>
            ))}
          </div>
        )}
        {items && <span className="ml-auto text-[13px] text-[#9b9b9b]">{shown.length} of {items.length}</span>}
      </div>

      {!items ? <Spinner /> : items.length === 0 ? (
        <Empty title={`No ${title.toLowerCase()} yet`} action={<Button variant="dark" onClick={() => setEditing({ item: newItem(), isNew: true })}><Plus className="h-4 w-4" /> New {singular}</Button>} />
      ) : (
        <ul className="overflow-hidden rounded-2xl border border-[#f0f0f0] bg-white">
          {shown.map(it => {
            const c = card(it);
            const href = previewHref?.(it);
            const fr = frCount(it);
            const canMove = !q && filter === 'all';
            return (
              <li key={it.id} className="group flex items-center gap-4 border-b border-[#f6f6f6] px-4 py-3 last:border-0 hover:bg-[#fcfcfc]">
                {canMove && (
                  <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
                    <button type="button" onClick={() => move(it.id, -1)} className="rounded p-0.5 text-[#9b9b9b] hover:text-[#242424]" aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => move(it.id, 1)} className="rounded p-0.5 text-[#9b9b9b] hover:text-[#242424]" aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></button>
                  </div>
                )}
                <button type="button" onClick={() => { setLang('en'); setEditing({ item: structuredClone(it), isNew: false }); }} className="flex min-w-0 flex-1 items-center gap-4 text-left">
                  <span className="checker h-12 w-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-[#f0f0f0]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {c.image ? <img src={c.image} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-[18px] font-semibold text-[#c4c4c4]">{c.title[0] ?? '·'}</span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium text-[#242424]">{c.title || 'Untitled'}</span>
                    {c.subtitle && <span className="block truncate text-[13px] text-[#6b6b6b]">{c.subtitle}</span>}
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      {c.badges?.map(b => <Badge key={b.label} tone={b.tone}>{b.label}</Badge>)}
                      {translatableCount > 0 && <span className={cx('inline-flex items-center gap-1 text-[11px]', fr ? 'text-[#2467ac]' : 'text-[#c4c4c4]')}><Languages className="h-3 w-3" /> FR {fr ? `${fr}/${translatableCount}` : ''}</span>}
                      {c.meta && <span className="text-[12px] text-[#9b9b9b]">{c.meta}</span>}
                    </span>
                  </span>
                </button>
                <div className="flex items-center opacity-60 transition-opacity group-hover:opacity-100">
                  {href && <a href={href} target="_blank" rel="noopener noreferrer" className="rounded-full p-2 text-[#6b6b6b] hover:bg-[#f2f2f2]" title="View on site"><ExternalLink className="h-4 w-4" /></a>}
                  <button type="button" onClick={() => { setLang('en'); setEditing({ item: structuredClone(it), isNew: false }); }} className="rounded-full p-2 text-[#6b6b6b] hover:bg-[#f2f2f2]" title="Edit"><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => duplicate(it)} className="rounded-full p-2 text-[#6b6b6b] hover:bg-[#f2f2f2]" title="Duplicate"><Copy className="h-4 w-4" /></button>
                  <button type="button" onClick={() => remove(it)} className="rounded-full p-2 text-[#c94a4a] hover:bg-[#fdf1f1]" title="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? (editing.isNew ? `New ${singular}` : card(editing.item).title || `Edit ${singular}`) : ''}
        width={720}
        subtitle={translatableCount > 0 && (
          <span className="mt-2 inline-flex rounded-full bg-[#f2f2f2] p-0.5 text-[12px]">
            {(['en', 'fr'] as const).map(l => (
              <button key={l} type="button" onClick={() => setLang(l)} className={cx('rounded-full px-3 py-1', lang === l ? 'bg-white font-medium text-[#242424] shadow-sm' : 'text-[#6b6b6b]')}>
                {l === 'en' ? 'English' : 'Français'}
              </button>
            ))}
          </span>
        )}
        footer={<>
          <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="primary" busy={state === 'saving'} onClick={save}>{editing?.isNew ? `Create ${singular}` : 'Save changes'}</Button>
        </>}
      >
        {editing && (
          <>
            {lang === 'fr' && <p className="mb-5 rounded-lg bg-[#eef4fb] px-4 py-3 text-[13px] leading-5 text-[#2467ac]">French version, leave a field empty to show the English text on /fr. The English value is shown as a placeholder.</p>}
            <FieldsForm schema={schema} item={editing.item} lang={lang} onChange={i => setEditing({ ...editing, item: i as T })} />
          </>
        )}
      </Drawer>
    </div>
  );
}

export function useUid() { return uid; }
export type { ReactNode };
