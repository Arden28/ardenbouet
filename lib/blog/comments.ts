// lib/blog/comments.ts — comment formatting + serialization shared by public and admin routes.
import 'server-only';
import type { Comment, Reader } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { visibleWhere } from './queries';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Tiny, safe formatter for reader comments: paragraphs, line breaks, `code`, **bold**,
 * *italic*, ```fenced code``` and auto-linked http(s) URLs. Everything is escaped first.
 */
export function formatComment(raw: string): string {
  const blocks = raw.replace(/\r\n/g, '\n').trim().split(/```/);
  return blocks
    .map((chunk, i) => {
      if (i % 2 === 1) return `<pre><code>${esc(chunk.replace(/^\w*\n/, ''))}</code></pre>`;
      return chunk
        .split(/\n{2,}/)
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => {
          let h = esc(p);
          h = h.replace(/`([^`\n]+)`/g, '<code>$1</code>');
          h = h.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
          h = h.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
          h = h.replace(
            /(^|[\s(])(https?:\/\/[^\s<)]+)/g,
            '$1<a href="$2" target="_blank" rel="noopener noreferrer nofollow ugc">$2</a>',
          );
          return `<p>${h.replace(/\n/g, '<br/>')}</p>`;
        })
        .join('');
    })
    .join('');
}

export type CommentDTO = {
  id: string;
  parentId: string | null;
  html: string;
  body: string;
  quote: string | null;
  createdAt: string;
  editedAt: string | null;
  isAuthor: boolean;
  pinned: boolean;
  deleted: boolean;
  likeCount: number;
  likedByMe: boolean;
  mine: boolean;
  author: { name: string; image: string | null };
  replies: CommentDTO[];
};

type Row = Comment & { reader: Reader | null };

export function toDTO(c: Row, viewerId: string | null, liked: Set<string>): CommentDTO {
  const deleted = c.status === 'DELETED';
  return {
    id: c.id,
    parentId: c.parentId,
    html: deleted ? '' : formatComment(c.body),
    body: deleted || c.readerId !== viewerId ? '' : c.body,
    quote: deleted ? null : c.quote,
    createdAt: c.createdAt.toISOString(),
    editedAt: c.editedAt?.toISOString() ?? null,
    isAuthor: c.isAuthor,
    pinned: c.pinned,
    deleted,
    likeCount: c.likeCount,
    likedByMe: liked.has(c.id),
    mine: !!viewerId && c.readerId === viewerId,
    author: c.isAuthor
      ? { name: 'Arden BOUET', image: '/images/me.png' }
      : { name: c.reader?.name ?? 'Reader', image: c.reader?.image ?? null },
    replies: [],
  };
}

/** Threads a flat list; deleted comments are kept only if they still have visible replies. */
export function thread(list: CommentDTO[]): CommentDTO[] {
  const byId = new Map(list.map(c => [c.id, c]));
  const roots: CommentDTO[] = [];
  for (const c of list) {
    const parent = c.parentId ? byId.get(c.parentId) : null;
    (parent ? parent.replies : roots).push(c);
  }
  const prune = (arr: CommentDTO[]): CommentDTO[] =>
    arr
      .map(c => ({ ...c, replies: prune(c.replies) }))
      .filter(c => !c.deleted || c.replies.length > 0);
  return prune(roots);
}

export async function findVisiblePost(slug: string) {
  return prisma.post.findFirst({
    where: { AND: [{ slug }, visibleWhere()] },
    select: { id: true, slug: true, title: true, commentsOpen: true },
  });
}

export const COMMENT_MAX = 5000;
export const COMMENT_RATE = { windowMs: 60_000, max: 5 };
