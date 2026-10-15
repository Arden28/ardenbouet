// GET /api/me/orders — the signed-in reader's shop orders (matched by account email)
import { err, json } from '@/lib/apiUtil';
import { getReader } from '@/lib/readerAuth';
import { readerOrders } from '@/lib/meOrders';

export const dynamic = 'force-dynamic';

export async function GET() {
  const reader = await getReader();
  if (!reader) return err('Sign in required', 401);
  return json({ email: reader.email, orders: await readerOrders(reader) });
}
