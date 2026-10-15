// GET  /api/blog/posts/[slug]/donate — can this story take donations? (+ Stripe publishable key)
// POST /api/blog/posts/[slug]/donate { amount, currency?, name?, email?, message?, isPublic? }
//      → creates a PaymentIntent (destination charge to the writer's connected account, or the
//        platform account for the owner's stories) and a PENDING Donation; returns clientSecret.
import { prisma } from '@/lib/prisma';
import { err, json, readJson, str } from '@/lib/apiUtil';
import { getReader } from '@/lib/readerAuth';
import { visibleWhere } from '@/lib/blog/queries';
import { DONATION_LIMITS, donationFeePercent, getStripe, stripeConfigured } from '@/lib/stripe';

export const dynamic = 'force-dynamic';
const CURRENCIES = ['usd', 'eur'];

async function target(slug: string) {
  const post = await prisma.post.findFirst({
    where: { AND: [{ slug }, visibleWhere()] },
    select: { id: true, title: true, donationsEnabled: true, author: { select: { id: true, name: true, stripeAccountId: true, stripeChargesEnabled: true } } },
  });
  if (!post || !post.donationsEnabled || !stripeConfigured()) return null;
  if (post.author && (!post.author.stripeAccountId || !post.author.stripeChargesEnabled)) return null;
  return post;
}

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const post = await target(params.slug);
  if (!post) return json({ enabled: false });
  const supporters = await prisma.donation.count({ where: { postId: post.id, status: 'SUCCEEDED' } });
  return json({
    enabled: true,
    recipient: post.author?.name ?? 'Arden BOUET',
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    supporters,
    limits: DONATION_LIMITS,
  });
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const post = await target(params.slug);
  if (!post) return err('Donations are not available for this story', 404);
  const body = await readJson(req);
  const amount = Math.round(Number(body?.amount));
  if (!Number.isFinite(amount) || amount < DONATION_LIMITS.min || amount > DONATION_LIMITS.max) return err('Choose an amount between $1 and $1,000');
  const currency = CURRENCIES.includes(String(body?.currency)) ? String(body!.currency) : 'usd';
  const reader = await getReader();
  const email = str(body?.email, 254).trim() || reader?.email || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err('Invalid email');

  const writer = post.author;
  const fee = writer ? Math.round((amount * donationFeePercent()) / 100) : 0;
  const intent = await getStripe().paymentIntents.create({
    amount,
    currency,
    automatic_payment_methods: { enabled: true },
    description: `Donation for “${post.title}”`,
    receipt_email: email ?? undefined,
    metadata: { kind: 'donation', postId: post.id, recipientId: writer?.id ?? 'owner' },
    ...(writer?.stripeAccountId
      ? { transfer_data: { destination: writer.stripeAccountId }, ...(fee ? { application_fee_amount: fee } : {}) }
      : {}),
  });

  await prisma.donation.create({
    data: {
      postId: post.id,
      recipientId: writer?.id ?? null,
      donorId: reader?.id ?? null,
      donorName: str(body?.name, 80).trim() || reader?.name || '',
      donorEmail: email,
      message: str(body?.message, 280).trim(),
      isPublic: body?.isPublic !== false,
      amount,
      currency,
      feeAmount: fee,
      stripePaymentIntentId: intent.id,
    },
  });
  return json({ clientSecret: intent.client_secret, paymentIntentId: intent.id });
}
