// lib/blog/render.tsx — renders stored TipTap JSON to React on the server.
// Every node type the editor can produce must be handled here; unknown nodes render their children.
import type { ReactNode } from 'react';
import hljs from 'highlight.js';
import { collectHeadings, nodeText, type PMMark, type PMNode } from './doc';
import { displayHost, isSafeHref, resolveEmbed } from './embeds';
import type { EmbedMap, EmbeddedItem } from './queries';
import { CopyButton } from '@/components/ui/CopyButton';

type Ctx = {
  embeds: EmbedMap;
  headingIds: string[];
  headingCursor: { i: number };
};

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlight(code: string, lang: string | undefined): string {
  try {
    if (lang && lang !== 'plaintext' && hljs.getLanguage(lang)) return hljs.highlight(code, { language: lang }).value;
    if (!lang) return hljs.highlightAuto(code).value;
  } catch { /* fall through */ }
  return escapeHtml(code);
}

function alignStyle(attrs?: Record<string, any>) {
  const a = attrs?.textAlign;
  return a && a !== 'left' ? { textAlign: a as 'center' | 'right' | 'justify' } : undefined;
}

function wrapMarks(text: ReactNode, marks: PMMark[] | undefined, key: string): ReactNode {
  if (!marks?.length) return text;
  return marks.reduce<ReactNode>((acc, m, i) => {
    const k = `${key}-m${i}`;
    switch (m.type) {
      case 'bold': return <strong key={k}>{acc}</strong>;
      case 'italic': return <em key={k}>{acc}</em>;
      case 'underline': return <u key={k}>{acc}</u>;
      case 'strike': return <s key={k}>{acc}</s>;
      case 'code': return <code key={k}>{acc}</code>;
      case 'highlight': return <mark key={k}>{acc}</mark>;
      case 'link': {
        const href = m.attrs?.href;
        if (!isSafeHref(href)) return acc;
        const external = /^https?:/i.test(href) && !href.includes('ardenbouet.me');
        return (
          <a key={k} href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}>
            {acc}
          </a>
        );
      }
      default: return acc;
    }
  }, text);
}

function children(node: PMNode, ctx: Ctx, key: string): ReactNode {
  return node.content?.map((c, i) => renderNode(c, ctx, `${key}.${i}`));
}

function Caption({ text }: { text?: string }) {
  return text ? <figcaption>{text}</figcaption> : null;
}

export function renderNode(node: PMNode, ctx: Ctx, key = 'n'): ReactNode {
  const a = node.attrs ?? {};
  switch (node.type) {
    case 'doc': return <>{children(node, ctx, key)}</>;
    case 'text': return wrapMarks(node.text ?? '', node.marks, key);
    case 'hardBreak': return <br key={key} />;

    case 'paragraph':
      return <p key={key} style={alignStyle(a)}>{children(node, ctx, key)}</p>;

    case 'heading': {
      const level = Math.min(4, Math.max(2, Number(a.level) || 2));
      const text = nodeText(node).trim();
      const id = text ? ctx.headingIds[ctx.headingCursor.i++] : undefined;
      const Tag = `h${level}` as 'h2' | 'h3' | 'h4';
      return (
        <Tag key={key} id={id} style={alignStyle(a)}>
          {children(node, ctx, key)}
        </Tag>
      );
    }

    case 'bulletList': return <ul key={key}>{children(node, ctx, key)}</ul>;
    case 'orderedList': return <ol key={key} start={a.start && a.start !== 1 ? a.start : undefined}>{children(node, ctx, key)}</ol>;
    case 'listItem': return <li key={key}>{children(node, ctx, key)}</li>;
    case 'taskList': return <ul key={key} className="task-list">{children(node, ctx, key)}</ul>;
    case 'taskItem':
      return (
        <li key={key} className="task-item" data-checked={a.checked ? 'true' : 'false'}>
          <span aria-hidden className="task-box">{a.checked ? '✓' : ''}</span>
          <div>{children(node, ctx, key)}</div>
        </li>
      );

    case 'blockquote': return <blockquote key={key}>{children(node, ctx, key)}</blockquote>;
    case 'pullQuote': return <blockquote key={key} className="pull-quote">{children(node, ctx, key)}</blockquote>;

    case 'callout': {
      const variant = ['info', 'tip', 'warning', 'success'].includes(a.variant) ? a.variant : 'info';
      const icon = { info: 'ℹ', tip: '💡', warning: '⚠', success: '✓' }[variant as 'info'];
      return (
        <aside key={key} className={`callout callout-${variant}`}>
          <span className="callout-icon" aria-hidden>{icon}</span>
          <div className="callout-body">{children(node, ctx, key)}</div>
        </aside>
      );
    }

    case 'codeBlock': {
      const code = nodeText(node).replace(/\n$/, '');
      const lang = typeof a.language === 'string' && a.language ? a.language : undefined;
      return (
        <div key={key} className="code-block" data-lang={lang ?? ''}>
          <div className="code-header">
            <span className="code-lang">{lang || 'plaintext'}</span>
            <CopyButton code={code} />
          </div>
          <pre className="hljs"><code dangerouslySetInnerHTML={{ __html: highlight(code, lang) }} /></pre>
        </div>
      );
    }

    case 'horizontalRule': return <hr key={key} />;

    case 'figure': {
      if (!a.src || !isSafeHref(a.src)) return null;
      const layout = ['inset', 'wide', 'full'].includes(a.layout) ? a.layout : 'inset';
      return (
        <figure key={key} className={`figure figure-${layout}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.src} alt={a.alt ?? ''} loading="lazy" decoding="async" />
          <Caption text={a.caption} />
        </figure>
      );
    }

    case 'gallery': {
      const images = (Array.isArray(a.images) ? a.images : []).filter((im: any) => isSafeHref(im?.src));
      if (!images.length) return null;
      return (
        <figure key={key} className="gallery" data-count={Math.min(images.length, 4)}>
          <div className="gallery-grid">
            {images.map((im: any, i: number) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={im.src} alt={im.alt ?? ''} loading="lazy" decoding="async" />
            ))}
          </div>
          <Caption text={a.caption} />
        </figure>
      );
    }

    case 'embed': {
      const url = typeof a.url === 'string' ? a.url : '';
      const resolved = resolveEmbed(url);
      if (resolved) {
        return (
          <figure key={key} className="embed figure-wide">
            <div
              className="embed-frame"
              style={resolved.aspect ? { aspectRatio: String(resolved.aspect) } : { height: resolved.height }}
            >
              <iframe
                src={resolved.src}
                title={a.caption || `${resolved.provider} embed`}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <Caption text={a.caption} />
          </figure>
        );
      }
      if (!isSafeHref(url)) return null;
      return (
        <a key={key} href={url} target="_blank" rel="noopener noreferrer nofollow" className="link-card">
          <span className="link-card-title">{a.title || url}</span>
          {a.description && <span className="link-card-desc">{a.description}</span>}
          <span className="link-card-host">{displayHost(url)}</span>
        </a>
      );
    }

    case 'contentCard': {
      const ids: string[] = Array.isArray(a.refIds) ? a.refIds : [];
      const items = ids.map(id => ctx.embeds[`${a.kind}:${id}`]).filter(Boolean) as EmbeddedItem[];
      if (!items.length) return null;
      const layout = a.layout === 'compact' ? 'compact' : 'card';
      return (
        <div key={key} className={`content-cards content-cards-${layout} ${items.length > 1 ? 'is-grid' : ''}`}>
          {items.map(item => <ContentCardView key={item.id} item={item} layout={layout} />)}
        </div>
      );
    }

    case 'button': {
      if (!isSafeHref(a.href)) return null;
      const external = /^https?:/i.test(a.href);
      return (
        <p key={key} className="story-button-row" style={alignStyle(a)}>
          <a
            href={a.href}
            className={`story-button story-button-${a.variant === 'outline' ? 'outline' : 'solid'}`}
            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {a.label || a.href}
          </a>
        </p>
      );
    }

    case 'table':
      return (
        <div key={key} className="table-wrap">
          <table><tbody>{children(node, ctx, key)}</tbody></table>
        </div>
      );
    case 'tableRow': return <tr key={key}>{children(node, ctx, key)}</tr>;
    case 'tableHeader': return <th key={key} colSpan={a.colspan > 1 ? a.colspan : undefined} rowSpan={a.rowspan > 1 ? a.rowspan : undefined}>{children(node, ctx, key)}</th>;
    case 'tableCell': return <td key={key} colSpan={a.colspan > 1 ? a.colspan : undefined} rowSpan={a.rowspan > 1 ? a.rowspan : undefined}>{children(node, ctx, key)}</td>;

    default:
      return node.content ? <div key={key}>{children(node, ctx, key)}</div> : null;
  }
}

function ContentCardView({ item, layout }: { item: EmbeddedItem; layout: 'card' | 'compact' }) {
  const label = { product: 'Product', project: 'Project', experience: 'Experience', post: 'Story' }[item.kind];
  const meta =
    item.kind === 'product' ? [item.category, item.price].filter(Boolean).join(' · ')
    : item.kind === 'project' ? (item.metric || item.tags.slice(0, 3).join(' · '))
    : item.kind === 'experience' ? item.period
    : `${item.readingMinutes} min read`;
  const cta = { product: 'View product →', project: 'View project →', experience: '', post: 'Read story →' }[item.kind];

  const inner = (
    <>
      {item.image && layout === 'card' && (
        <span className="cc-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image} alt="" loading="lazy" />
        </span>
      )}
      <span className="cc-body">
        <span className="cc-kind">{label}</span>
        <span className="cc-title">{item.title}</span>
        {item.subtitle && <span className="cc-subtitle">{item.subtitle}</span>}
        {item.kind === 'experience' && item.bullets.length > 0 && layout === 'card' && (
          <ul className="cc-bullets">{item.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
        )}
        <span className="cc-footer">
          {meta && <span className="cc-meta">{meta}</span>}
          {cta && <span className="cc-cta">{cta}</span>}
        </span>
      </span>
      {item.image && layout === 'compact' && (
        <span className="cc-thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image} alt="" loading="lazy" />
        </span>
      )}
    </>
  );

  return 'href' in item
    ? <a href={item.href} className={`content-card content-card-${item.kind}`}>{inner}</a>
    : <div className={`content-card content-card-${item.kind}`}>{inner}</div>;
}

export function StoryBody({ doc, embeds }: { doc: PMNode; embeds: EmbedMap }) {
  const headingIds = collectHeadings(doc).map(h => h.id);
  return <>{renderNode(doc, { embeds, headingIds, headingCursor: { i: 0 } })}</>;
}
