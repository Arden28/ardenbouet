// GET / POST / DELETE /api/admin/invites — single-use writer invitation links
import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { err, isAdminRequest, json, readJson, str } from '@/lib/apiUtil';
import { describeGrant, parseGrantInput } from '@/lib/accounts';
import { notifyEmail } from '@/lib/notify';
import { SITE_URL } from '@/lib/mailer';

export const dynamic = 'force-dynamic';
const link = (token: string) => `${SITE_URL}/join/writer?token=${token}`;

export async function GET() {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const invites = await prisma.writerInvite.findMany({
    orderBy: { createdAt: 'desc' },
    include: { acceptedBy: { select: { name: true, handle: true } } },
    take: 200,
  });
  return json({
    invites: invites.map(i => ({
      ...i,
      link: link(i.token),
      summary: describeGrant({ ...i, expiresAt: i.grantExpiresAt }),
      state: i.revokedAt ? 'revoked' : i.acceptedAt ? 'accepted' : i.inviteExpiresAt && i.inviteExpiresAt < new Date() ? 'expired' : 'pending',
    })),
  });
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const body = await readJson(req);
  if (!body) return err('Invalid JSON');
  const g = parseGrantInput(body);
  const email = str(body.email, 254).trim().toLowerCase() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return err('Invalid email');
  const days = Math.max(1, Math.min(90, Number(body.inviteDays) || 14));

  const invite = await prisma.writerInvite.create({
    data: {
      token: randomBytes(24).toString('base64url'),
      email,
      note: g.note ?? '',
      scope: g.scope,
      maxPosts: g.maxPosts ?? null,
      postIds: g.postIds ?? [],
      canPublish: g.canPublish ?? true,
      grantExpiresAt: g.expiresAt ? new Date(g.expiresAt) : null,
      inviteExpiresAt: new Date(Date.now() + days * 86_400_000),
    },
  });

  if (email && body.send !== false) {
    await notifyEmail(email, 'You’re invited to write on Arden’s blog',
      `You’ve been invited to write on Arden BOUET’s blog (${describeGrant({ ...invite, expiresAt: invite.grantExpiresAt })}).${invite.note ? `\n\n“${invite.note}”` : ''}\n\nSign in with any of your social accounts to accept. This link works once and expires in ${days} days.`,
      { label: 'Accept the invitation', href: link(invite.token) });
  }
  return json({ invite: { ...invite, link: link(invite.token) } }, 201);
}

export async function DELETE(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const id = str((await readJson(req))?.id, 64);
  await prisma.writerInvite.updateMany({ where: { id, acceptedAt: null }, data: { revokedAt: new Date() } });
  return json({ ok: true });
}
