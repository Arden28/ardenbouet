// POST /api/admin/blog/posts/[id]/newsletter — emails a published story to active subscribers
import { render } from '@react-email/components';
import { prisma } from '@/lib/prisma';
import { sendMail, SITE_URL } from '@/lib/mailer';
import { NewPostEmail } from '@/emails/BlogEmails';
import { err, isAdminRequest, json, readJson } from '@/lib/apiUtil';
import { visibleWhere } from '@/lib/blog/queries';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const post = await prisma.post.findFirst({ where: { AND: [{ id: params.id }, visibleWhere()] } });
  if (!post) return err('Only published stories can be sent', 422);
  const force = !!(await readJson(req))?.force;
  if (post.newsletterSentAt && !force) return err('Already sent to subscribers', 409);

  const subs = await prisma.subscriber.findMany({ where: { status: 'ACTIVE' }, select: { email: true, token: true } });
  const url = `${SITE_URL}/blog/${post.slug}`;
  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    const unsubscribeUrl = `${SITE_URL}/api/blog/unsubscribe?token=${sub.token}`;
    try {
      const html = await render(NewPostEmail({
        title: post.title, subtitle: post.subtitle || post.excerpt, coverUrl: post.coverUrl,
        url, readingMinutes: post.readingMinutes, unsubscribeUrl,
      }));
      const ok = await sendMail({
        to: sub.email,
        subject: post.title,
        html,
        headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      });
      if (ok) sent++; else failed++;
    } catch (e) {
      console.error('[newsletter] send failed for', sub.email, e);
      failed++;
    }
  }

  if (sent > 0) await prisma.post.update({ where: { id: post.id }, data: { newsletterSentAt: new Date() } });
  return json({ total: subs.length, sent, failed });
}
