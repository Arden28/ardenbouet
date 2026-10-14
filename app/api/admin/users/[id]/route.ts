// PATCH /api/admin/users/[id] — { grant: GrantInput } to make a writer / change access,
// { revoke: true } to remove writing access, { banned: boolean } to (un)ban.
import { prisma } from '@/lib/prisma';
import { err, isAdminRequest, json, readJson } from '@/lib/apiUtil';
import { describeGrant, parseGrantInput, setGrant } from '@/lib/accounts';
import { notifyEmail } from '@/lib/notify';
import { SITE_URL } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const reader = await prisma.reader.findUnique({ where: { id: params.id }, include: { writerGrant: true } });
  if (!reader) return err('Not found', 404);
  const body = await readJson(req);
  if (!body) return err('Invalid JSON');

  if (body.grant && typeof body.grant === 'object') {
    const g = parseGrantInput(body.grant as Record<string, unknown>);
    const hadAccess = !!reader.writerGrant && !reader.writerGrant.revokedAt;
    const grant = await setGrant(reader.id, g);
    await prisma.writerRequest.updateMany({ where: { readerId: reader.id, status: 'PENDING' }, data: { status: 'APPROVED', decidedAt: new Date() } });
    if (!hadAccess) {
      await notifyEmail(reader.email, 'You can now write on Arden’s blog',
        `Hi ${reader.name},\n\nYou’ve been given writing access: ${describeGrant(grant)}.\n\nOpen the editor from your account whenever you’re ready.`,
        { label: 'Start writing', href: `${SITE_URL}/me/stories` });
    }
  }
  if (body.revoke === true) {
    await prisma.writerGrant.updateMany({ where: { readerId: reader.id }, data: { revokedAt: new Date() } });
  }
  if (typeof body.banned === 'boolean') {
    await prisma.reader.update({ where: { id: reader.id }, data: { banned: body.banned } });
    if (body.banned) {
      await prisma.comment.updateMany({ where: { readerId: reader.id, status: 'VISIBLE' }, data: { status: 'HIDDEN' } });
      await prisma.writerGrant.updateMany({ where: { readerId: reader.id, revokedAt: null }, data: { revokedAt: new Date() } });
    }
  }
  const updated = await prisma.reader.findUnique({ where: { id: reader.id }, include: { writerGrant: true } });
  return json({ user: updated });
}
