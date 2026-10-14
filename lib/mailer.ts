import { render } from '@react-email/components';
import PurchaseEmail, { type PurchaseEmailProps } from '@/emails/PurchaseEmail';

const MAILGUN_KEY    = process.env.MAILGUN_KEY    ?? '';
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN ?? '';
const MAILGUN_FROM   = process.env.MAILGUN_FROM
  ?? `Arden BOUET <noreply@${MAILGUN_DOMAIN}>`;
const MAILGUN_BASE   = process.env.MAILGUN_BASE_URL ?? 'https://api.mailgun.net';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://ardenbouet.me').replace(/\/$/, '');

/** Generic Mailgun send. Returns false (and logs) when Mailgun isn't configured. */
export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  headers?: Record<string, string>;
}): Promise<boolean> {
  if (!MAILGUN_KEY || !MAILGUN_DOMAIN) {
    console.warn(`[mailer] Mailgun not configured — skipped "${opts.subject}" to ${opts.to}`);
    return false;
  }
  const form = new URLSearchParams({ from: MAILGUN_FROM, to: opts.to, subject: opts.subject, html: opts.html });
  for (const [k, v] of Object.entries(opts.headers ?? {})) form.set(`h:${k}`, v);
  const res = await fetch(`${MAILGUN_BASE}/v3/${MAILGUN_DOMAIN}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${MAILGUN_KEY}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });
  if (!res.ok) throw new Error(`[mailer] Mailgun ${res.status}: ${await res.text()}`);
  return true;
}

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
