// GET  /api/me/stripe — payout status + donation totals for the signed-in writer
// POST /api/me/stripe { action: 'onboard' | 'dashboard' } — Stripe Connect Express onboarding / login link
import { prisma } from '@/lib/prisma';
import { err, json, readJson } from '@/lib/apiUtil';
import { requireReader } from '@/lib/meApi';
import { getStripe, stripeConfigured, syncConnectedAccount } from '@/lib/stripe';
import { SITE_URL } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

export async function GET() {
  const ctx = await requireReader();
  if ('error' in ctx) return ctx.error;
  let { reader } = ctx;

  if (reader.stripeAccountId && stripeConfigured()) {
    try {
      await syncConnectedAccount(await getStripe().accounts.retrieve(reader.stripeAccountId));
      reader = (await prisma.reader.findUnique({ where: { id: reader.id } }))!;
    } catch (e) { console.error('[stripe] account refresh failed', e); }
  }

  const [totals, recent] = await Promise.all([
    prisma.donation.groupBy({ by: ['currency'], where: { recipientId: reader.id, status: 'SUCCEEDED' }, _sum: { amount: true, feeAmount: true }, _count: { _all: true } }),
    prisma.donation.findMany({
      where: { recipientId: reader.id, status: 'SUCCEEDED' }, orderBy: { createdAt: 'desc' }, take: 50,
      select: { id: true, amount: true, currency: true, feeAmount: true, donorName: true, isPublic: true, message: true, createdAt: true, post: { select: { title: true, slug: true } } },
    }),
  ]);

  return json({
    available: stripeConfigured(),
    isWriter: !!ctx.grant,
    connected: !!reader.stripeAccountId,
    chargesEnabled: reader.stripeChargesEnabled,
    payoutsEnabled: reader.stripePayoutsEnabled,
    totals: totals.map(t => ({ currency: t.currency, amount: (t._sum.amount ?? 0) - (t._sum.feeAmount ?? 0), count: t._count._all })),
    recent: recent.map(d => ({ ...d, donorName: d.isPublic ? d.donorName : '' })),
  });
}

export async function POST(req: Request) {
  const ctx = await requireReader();
  if ('error' in ctx) return ctx.error;
  if (!ctx.grant) return err('Only writers can receive donations', 403);
  if (!stripeConfigured()) return err('Payments are not configured on this site yet', 503);
  const stripe = getStripe();
  const action = (await readJson(req))?.action;
  let accountId = ctx.reader.stripeAccountId;

  if (action === 'dashboard') {
    if (!accountId) return err('Connect Stripe first');
    const link = await stripe.accounts.createLoginLink(accountId);
    return json({ url: link.url });
  }

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: ctx.reader.email ?? undefined,
      business_type: 'individual',
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      business_profile: { product_description: 'Writing published on ardenbouet.me', url: `${SITE_URL}/blog` },
      metadata: { readerId: ctx.reader.id },
    });
    accountId = account.id;
    await prisma.reader.update({ where: { id: ctx.reader.id }, data: { stripeAccountId: accountId } });
  }

  const base = `${SITE_URL}${ctx.reader.locale === 'fr' ? '/fr' : ''}/me/earnings`;
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    refresh_url: `${base}?stripe=refresh`,
    return_url: `${base}?stripe=return`,
  });
  return json({ url: link.url });
}
