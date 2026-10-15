// GET /api/admin/badges — small counts for the admin sidebar
import { prisma } from '@/lib/prisma';
import { err, isAdminRequest, json } from '@/lib/apiUtil';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const [messages, requests, review, orders, bookings] = await Promise.all([
    prisma.message.count({ where: { read: false, archived: false } }),
    prisma.writerRequest.count({ where: { status: 'PENDING' } }),
    prisma.post.count({ where: { status: 'REVIEW' } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.booking.count({ where: { status: 'CONFIRMED', start: { gte: new Date(), lte: new Date(Date.now() + 7 * 86_400_000) } } }),
  ]);
  return json({ '/admin/messages': messages, '/admin/users': requests, '/admin/blog': review, '/admin/orders': orders, '/admin/bookings': bookings });
}
