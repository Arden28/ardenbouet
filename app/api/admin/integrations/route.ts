// GET /api/admin/integrations — which third-party services are configured (no secrets). Sign-in entries
// also verify OAuth credentials live against each provider (see lib/authCheck.ts).
import { err, isAdminRequest, json } from '@/lib/apiUtil';
import { readerProviderIds } from '@/lib/readerAuth';
import { getR2Config } from '@/lib/getR2Config';
import { prisma } from '@/lib/prisma';
import { authChecks } from '@/lib/authCheck';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const e = process.env;
  const cfg = await prisma.bookingConfig.findUnique({ where: { id: 1 }, select: { googleRefreshToken: true } });
  return json({
    integrations: [
      { key: 'stripe', name: 'Stripe', ok: !!e.STRIPE_SECRET_KEY && !!e.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, detail: e.STRIPE_WEBHOOK_SECRET ? 'Payments, donations, webhooks' : 'Webhook secret missing', env: 'STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET' },
      { key: 'paypal', name: 'PayPal', ok: !!e.PAYPAL_CLIENT_ID && !!e.PAYPAL_CLIENT_SECRET, detail: 'Checkout', env: 'PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET' },
      { key: 'paystack', name: 'Paystack', ok: !!e.PAYSTACK_SECRET_KEY, detail: 'Checkout', env: 'PAYSTACK_SECRET_KEY, NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY' },
      { key: 'mpesa', name: 'M-Pesa', ok: !!e.MPESA_CONSUMER_KEY && !!e.MPESA_PASSKEY, detail: 'STK push checkout', env: 'MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY' },
      { key: 'mailgun', name: 'Mailgun', ok: !!e.MAILGUN_KEY && !!e.MAILGUN_DOMAIN, detail: 'Receipts, newsletter, notifications', env: 'MAILGUN_KEY, MAILGUN_DOMAIN' },
      { key: 'r2', name: 'Cloudflare R2', ok: !!(await getR2Config()), detail: 'Media library & downloads', env: 'R2_* or CLOUDFLARE_R2_* (+ R2_PUBLIC_URL)' },
      { key: 'google', name: 'Google Calendar', ok: !!cfg?.googleRefreshToken, detail: cfg?.googleRefreshToken ? 'Connected' : 'Connect in Bookings → Availability', env: 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET' },
      { key: 'auth', name: 'Reader sign-in', ok: readerProviderIds.some(p => p !== 'dev'), detail: readerProviderIds.filter(p => p !== 'dev').join(', ') || 'No providers', env: 'GOOGLE_*, GITHUB_*, LINKEDIN_*, DISCORD_*, TWITTER_*, FACEBOOK_*' },
      ...(await authChecks()),
      { key: 'owner', name: 'Owner alerts', ok: !!(e.OWNER_EMAIL || e.CONTACT_EMAIL), detail: e.OWNER_EMAIL || e.CONTACT_EMAIL ? 'Emails you about bookings, messages, requests' : 'Set OWNER_EMAIL', env: 'OWNER_EMAIL' },
    ],
  });
}
