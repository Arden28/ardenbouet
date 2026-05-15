import { render } from '@react-email/components';
import PurchaseEmail, { type PurchaseEmailProps } from '@/emails/PurchaseEmail';

const MAILGUN_KEY    = process.env.MAILGUN_KEY    ?? '';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN ?? '';
const MAILGUN_FROM   = process.env.MAILGUN_FROM
  ?? `Arden BOUET <noreply@${MAILGUN_DOMAIN}>`;
const MAILGUN_BASE   = process.env.MAILGUN_BASE_URL ?? 'https://api.mailgun.net';

export async function sendPurchaseEmail(props: PurchaseEmailProps): Promise<void> {
  if (!MAILGUN_KEY || !MAILGUN_DOMAIN) {
    console.warn('[mailer] MAILGUN_KEY or MAILGUN_DOMAIN not set — email skipped.');
    return;
  }

  const html    = await render(PurchaseEmail(props));
  const subject = props.isService
    ? `Booking confirmed — ${props.productTitle}`
    : `Your download is ready — ${props.productTitle}`;

  const form = new URLSearchParams({
    from:    MAILGUN_FROM,
    to:      props.customerEmail,
    subject,
    html,
  });

  const creds = Buffer.from(`api:${MAILGUN_KEY}`).toString('base64');

  const res = await fetch(`${MAILGUN_BASE}/v3/${MAILGUN_DOMAIN}/messages`, {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[mailer] Mailgun ${res.status}: ${text}`);
  }
}
