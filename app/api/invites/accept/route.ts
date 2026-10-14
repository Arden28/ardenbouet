// GET ?token= (preview) / POST { token } (accept) — writer invitations
import { prisma } from '@/lib/prisma';
import { err, json, readJson, str } from '@/lib/apiUtil';
import { requireReader } from '@/lib/meApi';
import { describeGrant, setGrant } from '@/lib/accounts';

export const dynamic = 'force-dynamic';

async function findUsable(token: string) {
  const invite = token ? await prisma.writerInvite.findUnique({ where: { token } }) : null;
  if (!invite || invite.revokedAt) return { error: 'This invitation is no longer valid.' } as const;
  if (invite.acceptedAt) return { error: 'This invitation has already been used.' } as const;
  if (invite.inviteExpiresAt && invite.inviteExpiresAt < new Date()) return { error: 'This invitation has expired.' } as const;
  return { invite } as const;
}

export async function GET(req: Request) {
  const r = await findUsable(new URL(req.url).searchParams.get('token') ?? '');
  if ('error' in r) return err(r.error!, 410);
  const { invite } = r;
  return json({ invite: { email: invite.email, note: invite.note, summary: describeGrant({ ...invite, expiresAt: invite.grantExpiresAt }) } });
}

export async function POST(req: Request) {
  const ctx = await requireReader();
  if ('error' in ctx) return ctx.error;
  const r = await findUsable(str((await readJson(req))?.token, 100));
  if ('error' in r) return err(r.error!, 410);
  const { invite } = r;

  await setGrant(ctx.reader.id, {
    scope: invite.scope, maxPosts: invite.maxPosts, postIds: invite.postIds, canPublish: invite.canPublish,
    expiresAt: invite.grantExpiresAt?.toISOString() ?? null, note: invite.note,
  });
  await prisma.writerInvite.update({ where: { id: invite.id }, data: { acceptedAt: new Date(), acceptedById: ctx.reader.id } });
  // A pending request is answered by the invitation.
  await prisma.writerRequest.updateMany({ where: { readerId: ctx.reader.id, status: 'PENDING' }, data: { status: 'APPROVED', decidedAt: new Date() } });
  return json({ ok: true });
}
