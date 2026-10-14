// GET /api/admin/messages?filter=inbox|unread|archived&q= — contact form messages
// PATCH { id, read?, archived? } · DELETE { id }
import { prisma } from '@/lib/prisma';
import { err, isAdminRequest, json, readJson, str } from '@/lib/apiUtil';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const sp = new URL(req.url).searchParams;
  const filter = sp.get('filter') ?? 'inbox';
  const q = sp.get('q')?.trim();
  const messages = await prisma.message.findMany({
    where: {
      ...(filter === 'archived' ? { archived: true } : { archived: false }),
      ...(filter === 'unread' ? { read: false } : {}),
      ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { body: { contains: q, mode: 'insensitive' } }] } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 300,
  });
  const counts = {
    inbox: await prisma.message.count({ where: { archived: false } }),
    unread: await prisma.message.count({ where: { archived: false, read: false } }),
    archived: await prisma.message.count({ where: { archived: true } }),
  };
  return json({ messages, counts });
}

export async function PATCH(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const body = await readJson(req);
  const id = Number(body?.id);
  if (!Number.isInteger(id)) return err('Invalid id');
  const data: { read?: boolean; archived?: boolean } = {};
  if (typeof body?.read === 'boolean') data.read = body.read;
  if (typeof body?.archived === 'boolean') data.archived = body.archived;
  return json({ message: await prisma.message.update({ where: { id }, data }) });
}

export async function DELETE(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const id = Number(str((await readJson(req))?.id, 20));
  await prisma.message.delete({ where: { id } }).catch(() => null);
  return json({ ok: true });
}
