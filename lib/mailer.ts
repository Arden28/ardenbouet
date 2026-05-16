import { render } from '@react-email/components';
import PurchaseEmail, { type PurchaseEmailProps } from '@/emails/PurchaseEmail';

const MAILGUN_KEY    = process.env.MAILGUN_KEY    ?? '';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN ?? '';
const MAILGUN_FROM   = process.env.MAILGUN_FROM
  ?? `Arden BOUET <noreply@${MAILGUN_DOMAIN}>`;
const MAILGUN_BASE   = process.env.MAILGUN_BASE_URL ?? 'https://api.mailgun.net';

export async function sendPurchaseEmail(props: PurchaseEmailProps): Promise<void> {
  console.log('[mailer] sendPurchaseEmail called for:', props.customerEmail);
  console.log('[mailer] MAILGUN_KEY set:', !!MAILGUN_KEY, '| MAILGUN_DOMAIN:', MAILGUN_DOMAIN || '(empty)');

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
  const url   = `${MAILGUN_BASE}/v3/${MAILGUN_DOMAIN}/messages`;
  console.log('[mailer] POSTing to:', url, '| from:', MAILGUN_FROM, '| to:', props.customerEmail);

  const res = await fetch(url, {
    method:  'POST',
    headers: {
      Authorization:  `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });

  const body = await res.text();
  console.log('[mailer] Mailgun response:', res.status, body);

  if (!res.ok) {
    throw new Error(`[mailer] Mailgun ${res.status}: ${body}`);
  }
}
