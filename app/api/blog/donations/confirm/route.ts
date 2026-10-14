// POST /api/blog/donations/confirm { paymentIntentId } — client-side confirmation fallback
// (the webhook does the same; settleDonation is idempotent).
import { err, json, readJson, str } from '@/lib/apiUtil';
import { getStripe, settleDonation, stripeConfigured } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!stripeConfigured()) return err('Payments are not configured', 503);
  const id = str((await readJson(req))?.paymentIntentId, 100);
  if (!id.startsWith('pi_')) return err('Invalid payment');
  const intent = await getStripe().paymentIntents.retrieve(id);
  if (intent.metadata?.kind !== 'donation') return err('Invalid payment');
  const donation = await settleDonation(intent);
  return json({ status: donation?.status ?? 'UNKNOWN' });
}
