// GET /api/admin/blog/subscribers[?format=csv] — newsletter audience
// DELETE { id } — remove a subscriber
import { prisma } from '@/lib/prisma';
import { err, isAdminRequest, json, readJson, str } from '@/lib/apiUtil';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const subs = await prisma.subscriber.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, status: true, createdAt: true, confirmedAt: true, source: true },
  });
  if (new URL(req.url).searchParams.get('format') === 'csv') {
    const rows = [['email', 'status', 'subscribed_at', 'confirmed_at', 'source'], ...subs.map(s => [
      s.email, s.status, s.createdAt.toISOString(), s.confirmedAt?.toISOString() ?? '', s.source ?? '',
    ])];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    return new Response(csv, {
      headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="subscribers.csv"' },
    });
  }
  return json({ subscribers: subs });
}

export async function DELETE(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const id = str((await readJson(req))?.id, 64);
  await prisma.subscriber.delete({ where: { id } }).catch(() => null);
  return json({ ok: true });
}
