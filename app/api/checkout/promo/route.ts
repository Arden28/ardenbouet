// POST /api/checkout/promo { productId, code } — checks one promo code for one product.
// Codes never ship to the browser in bulk; a valid code returns only its own discount.
import { err, json, readJson, str } from '@/lib/apiUtil';
import { getContentBundle } from '@/lib/blog/queries';
import { findCode } from '@/lib/publicContent';

export const dynamic = 'force-dynamic';

// Light brute-force brake: 20 attempts per minute per client (per server instance).
const attempts = new Map<string, number[]>();
function tooMany(key: string) {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter(t => now - t < 60_000);
  recent.push(now);
  attempts.set(key, recent);
  if (attempts.size > 5000) attempts.clear();
  return recent.length > 20;
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  if (tooMany(ip)) return err('Too many attempts, try again in a minute', 429);
  const body = await readJson(req);
  const productId = str(body?.productId, 80);
  const code = str(body?.code, 60);
  if (!productId || !code) return err('productId and code are required');
  const product = ((await getContentBundle()).products ?? []).find(p => p.id === productId && p.status === 'published');
  const match = product ? findCode(product, code) : null;
  if (!match) return err('Invalid code', 404);
  return json({ discount: { code: match.code, type: match.type, value: match.value, label: match.label } });
}
