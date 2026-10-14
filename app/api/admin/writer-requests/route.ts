// GET /api/admin/writer-requests?status= — "I'd like to write" requests
// PATCH { id, decision: 'approve' | 'reject', note?, grant? } — answer one
import { prisma } from '@/lib/prisma';
import { err, isAdminRequest, json, readJson, str } from '@/lib/apiUtil';
import { describeGrant, parseGrantInput, setGrant } from '@/lib/accounts';
import { notifyEmail } from '@/lib/notify';
import { SITE_URL } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const status = new URL(req.url).searchParams.get('status');
  const requests = await prisma.writerRequest.findMany({
    where: status && status !== 'ALL' ? { status: status as 'PENDING' } : {},
    include: { reader: { select: { id: true, name: true, handle: true, email: true, image: true, createdAt: true, _count: { select: { comments: true } } } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return json({ requests });
}

export async function PATCH(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const body = await readJson(req);
  const request = await prisma.writerRequest.findUnique({ where: { id: str(body?.id, 64) }, include: { reader: true } });
  if (!request) return err('Not found', 404);
  if (request.status !== 'PENDING') return err('Already answered');
  const note = str(body?.note, 1000);

  if (body?.decision === 'approve') {
    const grant = await setGrant(request.readerId, parseGrantInput((body.grant as Record<string, unknown>) ?? {}));
    await prisma.writerRequest.update({ where: { id: request.id }, data: { status: 'APPROVED', decidedAt: new Date(), decisionNote: note } });
    await notifyEmail(request.reader.email, 'Your writer request was approved',
      `Hi ${request.reader.name},\n\nGood news — you can now write on Arden’s blog (${describeGrant(grant)}).${note ? `\n\n${note}` : ''}`,
      { label: 'Start writing', href: `${SITE_URL}/me/stories` });
  } else if (body?.decision === 'reject') {
    await prisma.writerRequest.update({ where: { id: request.id }, data: { status: 'REJECTED', decidedAt: new Date(), decisionNote: note } });
    await notifyEmail(request.reader.email, 'About your writer request',
      `Hi ${request.reader.name},\n\nThanks for offering to write. It’s not a fit right now${note ? `:\n\n${note}` : '.'}\n\nYou’re welcome to ask again later.`);
  } else {
    return err('decision must be approve or reject');
  }
  return json({ ok: true });
}
