// POST /api/blog/subscribe { email, source?, website? } — double opt-in newsletter signup
import { randomBytes } from 'crypto';
import { render } from '@react-email/components';
import { prisma } from '@/lib/prisma';
import { sendMail, SITE_URL } from '@/lib/mailer';
import { ConfirmSubscriptionEmail } from '@/emails/BlogEmails';
import { err, json, readJson, str } from '@/lib/apiUtil';

export const dynamic = 'force-dynamic';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request) {
  const body = await readJson(req);
  if (str(body?.website)) return json({ ok: true }); // honeypot: bots fill hidden fields
  const email = str(body?.email, 254).trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return err('Please enter a valid email address');

  const existing = await prisma.subscriber.findUnique({ where: { email } });
  if (existing?.status === 'ACTIVE') return json({ ok: true, status: 'active' });
  // Don't re-send a confirmation more than once every 10 minutes.
  if (existing?.status === 'PENDING' && Date.now() - existing.createdAt.getTime() < 10 * 60_000) {
    return json({ ok: true, status: 'pending' });
  }

  const token = randomBytes(24).toString('base64url');
  await prisma.subscriber.upsert({
    where: { email },
    create: { email, token, source: str(body?.source, 120) || null },
    update: { token, status: 'PENDING', createdAt: new Date() },
  });

  const confirmUrl = `${SITE_URL}/api/blog/subscribe/confirm?token=${token}`;
  try {
    const sent = await sendMail({
      to: email,
      subject: 'Confirm your subscription',
      html: await render(ConfirmSubscriptionEmail({ confirmUrl })),
    });
    if (!sent && process.env.NODE_ENV !== 'production') console.info('[blog] confirm link:', confirmUrl);
  } catch (e) {
    console.error('[blog] subscribe email failed', e);
    // Don't leave the address stuck in the 10-minute resend cooldown after a failed send.
    if (!existing) await prisma.subscriber.delete({ where: { email } }).catch(() => {});
    else await prisma.subscriber.update({ where: { email }, data: { createdAt: new Date(0) } }).catch(() => {});
    return err('Could not send the confirmation email. Please try again later.', 502);
  }
  return json({ ok: true, status: 'pending' });
}
