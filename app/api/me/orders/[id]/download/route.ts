// POST /api/me/orders/[id]/download — a valid download token for one of the reader's own paid orders
// (the existing one, or a fresh 48-hour link when it expired or ran out). The browser then goes to /download/[token].
import { err, json } from '@/lib/apiUtil';
import { getReader } from '@/lib/readerAuth';
import { ensureDownloadToken } from '@/lib/meOrders';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const reader = await getReader();
  if (!reader) return err('Sign in required', 401);
  const r = await ensureDownloadToken(reader, params.id);
  return 'error' in r ? err(r.error, r.status) : json({ token: r.token });
}
