// GET /api/blog/posts?take=&tag=&q=&sort= — published post cards (used by the home page Notes section)
import { listPosts } from '@/lib/blog/queries';
import { json } from '@/lib/apiUtil';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  try {
    const posts = await listPosts({
      take: Math.min(50, Number(sp.get('take')) || 20),
      skip: Math.max(0, Number(sp.get('skip')) || 0),
      tag: sp.get('tag') || undefined,
      q: sp.get('q') || undefined,
      sort: sp.get('sort') === 'popular' ? 'popular' : 'latest',
    });
    return json({ posts });
  } catch (e) {
    console.error('GET /api/blog/posts failed', e);
    return json({ posts: [] });
  }
}
