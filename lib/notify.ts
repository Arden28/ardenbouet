// lib/notify.ts — simple transactional emails (owner alerts, writer notices). Never throws.
import 'server-only';
import { sendMail, SITE_URL } from '@/lib/mailer';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function simpleEmail(title: string, body: string, cta?: { label: string; href: string }) {
  const paragraphs = esc(body).split(/\n{2,}/).map(p => `<p style="margin:0 0 14px;font:16px/1.6 Georgia,serif;color:#242424">${p.replace(/\n/g, '<br/>')}</p>`).join('');
  const button = cta
    ? `<p style="margin:24px 0"><a href="${cta.href}" style="background:#242424;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font:15px system-ui,sans-serif">${esc(cta.label)}</a></p>`
    : '';
  return `<div style="background:#f2f2f2;padding:32px 16px"><div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:32px">
<p style="margin:0 0 24px;font:700 20px Georgia,serif;color:#242424">Arden BOUET</p>
<h1 style="margin:0 0 16px;font:700 24px/1.3 Georgia,serif;color:#242424">${esc(title)}</h1>${paragraphs}${button}</div></div>`;
}

/** Email the site owner (CONTACT/OWNER email env). */
export async function notifyOwner(subject: string, body: string, adminPath?: string) {
  const to = process.env.OWNER_EMAIL || process.env.CONTACT_EMAIL;
  if (!to) { console.info('[notify] OWNER_EMAIL not set —', subject); return; }
  try {
    await sendMail({ to, subject, html: simpleEmail(subject, body, adminPath ? { label: 'Open in admin', href: `${SITE_URL}${adminPath}` } : undefined) });
  } catch (e) { console.error('[notify] owner email failed', e); }
}

export async function notifyEmail(to: string | null | undefined, subject: string, body: string, cta?: { label: string; href: string }) {
  if (!to) return;
  try { await sendMail({ to, subject, html: simpleEmail(subject, body, cta) }); } catch (e) { console.error('[notify] email failed', e); }
}
