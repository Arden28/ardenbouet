// GET /api/admin/dashboard?range=7d|30d|90d|12m|all — KPIs, time series and activity for /admin
import { prisma } from '@/lib/prisma';
import { err, isAdminRequest, json } from '@/lib/apiUtil';
import { formatMoney, summarize, toBase } from '@/lib/money';

export const dynamic = 'force-dynamic';

const RANGES: Record<string, number | null> = { '7d': 7, '30d': 30, '90d': 90, '12m': 365, all: null };

function bucketKey(d: Date, unit: 'day' | 'month') {
  return unit === 'day' ? d.toISOString().slice(0, 10) : d.toISOString().slice(0, 7);
}

function buckets(from: Date, to: Date, unit: 'day' | 'month'): string[] {
  const out: string[] = [];
  const c = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), unit === 'day' ? from.getUTCDate() : 1));
  while (c <= to) {
    out.push(bucketKey(c, unit));
    if (unit === 'day') c.setUTCDate(c.getUTCDate() + 1); else c.setUTCMonth(c.getUTCMonth() + 1);
  }
  return out;
}

export async function GET(req: Request) {
  if (!(await isAdminRequest())) return err('Unauthorized', 401);
  const rangeKey = new URL(req.url).searchParams.get('range') ?? '30d';
  const days = RANGES[rangeKey] === undefined ? 30 : RANGES[rangeKey];
  const now = new Date();
  const first = await prisma.order.findFirst({ orderBy: { createdAt: 'asc' }, select: { createdAt: true } });
  const since = days ? new Date(now.getTime() - days * 86_400_000) : (first?.createdAt ?? new Date(now.getTime() - 365 * 86_400_000));
  const prevSince = days ? new Date(since.getTime() - days * 86_400_000) : null;
  const inRange = { gte: since, lte: now };
  const unit: 'day' | 'month' = days && days <= 90 ? 'day' : 'month';

  const [
    paidOrders, prevPaid, pendingOrders, donations, prevDonations,
    readersNew, prevReaders, subsNew, prevSubs, subsActive,
    posts, postsPublished, views, claps, responses, prevResponses, responsesPendingWriters,
    bookingsUpcoming, bookingsNew, messagesUnread, messagesNew,
    crmActive, crmPipeline, invoicesOpen, invoicesOverdue, writerRequests, reviewQueue,
    topStories,
    latest,
  ] = await Promise.all([
    prisma.order.findMany({ where: { status: 'PAID', createdAt: inRange }, select: { amount: true, currency: true, createdAt: true } }),
    prevSince ? prisma.order.findMany({ where: { status: 'PAID', createdAt: { gte: prevSince, lt: since } }, select: { amount: true, currency: true } }) : null,
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.donation.findMany({ where: { status: 'SUCCEEDED', createdAt: inRange }, select: { amount: true, currency: true, feeAmount: true, recipientId: true, createdAt: true } }),
    prevSince ? prisma.donation.findMany({ where: { status: 'SUCCEEDED', recipientId: null, createdAt: { gte: prevSince, lt: since } }, select: { amount: true, currency: true } }) : null,
    prisma.reader.findMany({ where: { createdAt: inRange }, select: { createdAt: true } }),
    prevSince ? prisma.reader.count({ where: { createdAt: { gte: prevSince, lt: since } } }) : null,
    prisma.subscriber.findMany({ where: { status: 'ACTIVE', confirmedAt: inRange }, select: { confirmedAt: true } }),
    prevSince ? prisma.subscriber.count({ where: { status: 'ACTIVE', confirmedAt: { gte: prevSince, lt: since } } }) : null,
    prisma.subscriber.count({ where: { status: 'ACTIVE' } }),
    prisma.post.count(),
    prisma.post.count({ where: { status: 'PUBLISHED', publishedAt: inRange } }),
    prisma.post.aggregate({ _sum: { views: true } }),
    prisma.clap.aggregate({ where: { updatedAt: inRange }, _sum: { count: true } }),
    prisma.comment.count({ where: { status: 'VISIBLE', createdAt: inRange, isAuthor: false } }),
    prevSince ? prisma.comment.count({ where: { status: 'VISIBLE', createdAt: { gte: prevSince, lt: since }, isAuthor: false } }) : null,
    prisma.comment.count({ where: { status: 'HIDDEN' } }),
    prisma.booking.count({ where: { status: 'CONFIRMED', start: { gte: now } } }),
    prisma.booking.count({ where: { createdAt: inRange } }),
    prisma.message.count({ where: { read: false, archived: false } }),
    prisma.message.count({ where: { createdAt: inRange } }),
    prisma.crmProject.count({ where: { status: { in: ['ACTIVE', 'REVIEW'] } } }),
    prisma.crmProject.findMany({ where: { status: { in: ['DISCOVERY', 'PROPOSAL', 'ACTIVE', 'REVIEW'] }, budget: { not: null } }, select: { budget: true, currency: true } }),
    prisma.crmInvoice.findMany({ where: { status: { in: ['SENT', 'OVERDUE'] } }, select: { amount: true, currency: true } }),
    prisma.crmInvoice.count({ where: { OR: [{ status: 'OVERDUE' }, { status: 'SENT', dueAt: { lt: now } }] } }),
    prisma.writerRequest.count({ where: { status: 'PENDING' } }),
    prisma.post.count({ where: { status: 'REVIEW' } }),
    prisma.post.findMany({
      where: { status: 'PUBLISHED' }, orderBy: { views: 'desc' }, take: 5,
      select: { id: true, title: true, slug: true, views: true, _count: { select: { comments: { where: { status: 'VISIBLE' } } } } },
    }),
    Promise.all([
      prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: { id: true, createdAt: true, customerName: true, productTitle: true, amount: true, currency: true, status: true } }),
      prisma.comment.findMany({ where: { isAuthor: false }, orderBy: { createdAt: 'desc' }, take: 6, select: { id: true, createdAt: true, body: true, reader: { select: { name: true } }, post: { select: { title: true, slug: true } } } }),
      prisma.booking.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: { id: true, createdAt: true, name: true, start: true, status: true, meetingType: { select: { title: true } } } }),
      prisma.message.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: { id: true, createdAt: true, name: true, body: true, read: true } }),
      prisma.writerRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 4, select: { id: true, createdAt: true, status: true, reader: { select: { name: true } } } }),
      prisma.subscriber.findMany({ where: { status: 'ACTIVE' }, orderBy: { confirmedAt: 'desc' }, take: 4, select: { id: true, confirmedAt: true, email: true } }),
    ]),
  ]);

  // Revenue: each order/donation keeps its currency. Totals are summed per currency and converted to the
  // base currency (fixed rates) only for the headline, the period comparison and the chart.
  const ownerDonations = donations.filter(d => !d.recipientId);
  const donationRows = (rows: { amount: number; currency: string }[]) => rows.map(d => ({ amount: d.amount / 100, currency: d.currency })); // cents
  const revenue = summarize([...paidOrders, ...donationRows(ownerDonations)]);
  const prevRevenue = prevSince ? summarize([...(prevPaid ?? []), ...donationRows(prevDonations ?? [])]).base : null;

  const keys = buckets(since, now, unit);
  const rev = new Map(keys.map(k => [k, 0]));
  for (const o of paidOrders) rev.set(bucketKey(o.createdAt, unit), (rev.get(bucketKey(o.createdAt, unit)) ?? 0) + (toBase(o.amount, o.currency) ?? 0));
  for (const d of ownerDonations) rev.set(bucketKey(d.createdAt, unit), (rev.get(bucketKey(d.createdAt, unit)) ?? 0) + (toBase(d.amount / 100, d.currency) ?? 0));
  const aud = new Map(keys.map(k => [k, 0]));
  for (const r of readersNew) aud.set(bucketKey(r.createdAt, unit), (aud.get(bucketKey(r.createdAt, unit)) ?? 0) + 1);
  for (const s of subsNew) if (s.confirmedAt) aud.set(bucketKey(s.confirmedAt, unit), (aud.get(bucketKey(s.confirmedAt, unit)) ?? 0) + 1);

  const [orders, comments, bookings, messages, requests, subscribers] = latest;
  const activity = [
    ...orders.map(o => ({ type: 'order', at: o.createdAt, title: `${o.customerName} · ${o.productTitle}`, meta: `${formatMoney(o.amount, o.currency)} · ${o.status.toLowerCase()}`, href: '/admin/orders' })),
    ...comments.map(c => ({ type: 'response', at: c.createdAt, title: `${c.reader?.name ?? 'Reader'} on “${c.post.title}”`, meta: c.body.slice(0, 90), href: '/admin/blog/comments' })),
    ...bookings.map(b => ({ type: 'booking', at: b.createdAt, title: `${b.name} · ${b.meetingType.title}`, meta: `${b.status === 'CANCELLED' ? 'cancelled · ' : ''}${b.start.toISOString()}`, href: '/admin/bookings' })),
    ...messages.map(m => ({ type: 'message', at: m.createdAt, title: m.name, meta: m.body.slice(0, 90), href: '/admin/messages', unread: !m.read })),
    ...requests.map(r => ({ type: 'writer', at: r.createdAt, title: `${r.reader.name} asked to write`, meta: r.status.toLowerCase(), href: '/admin/users?tab=requests' })),
    ...subscribers.filter(s => s.confirmedAt).map(s => ({ type: 'subscriber', at: s.confirmedAt!, title: s.email, meta: 'subscribed', href: '/admin/blog/subscribers' })),
  ].sort((a, b) => +b.at - +a.at).slice(0, 14);

  const delta = (cur: number, prev: number | null | undefined) => (prev === null || prev === undefined ? null : prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100));

  return json({
    range: rangeKey,
    unit,
    baseCurrency: revenue.baseCurrency,
    kpis: {
      revenue: { value: revenue.base, summary: revenue, delta: delta(revenue.base, prevRevenue), orders: paidOrders.length, donations: ownerDonations.length },
      pendingOrders,
      audience: { readers: readersNew.length, readersDelta: delta(readersNew.length, prevReaders), subscribers: subsNew.length, subscribersDelta: delta(subsNew.length, prevSubs), activeSubscribers: subsActive },
      blog: { posts, published: postsPublished, views: views._sum.views ?? 0, claps: claps._sum.count ?? 0, responses, responsesDelta: delta(responses, prevResponses), hidden: responsesPendingWriters, review: reviewQueue },
      bookings: { upcoming: bookingsUpcoming, created: bookingsNew },
      messages: { unread: messagesUnread, created: messagesNew },
      crm: {
        activeProjects: crmActive, overdue: invoicesOverdue, openInvoices: invoicesOpen.length,
        pipeline: summarize(crmPipeline.map(p => ({ amount: p.budget ?? 0, currency: p.currency }))),
        openAmount: summarize(invoicesOpen),
      },
      writerRequests,
    },
    series: {
      revenue: keys.map(k => ({ key: k, value: Math.round((rev.get(k) ?? 0) * 100) / 100 })),
      audience: keys.map(k => ({ key: k, value: aud.get(k) ?? 0 })),
    },
    topStories: topStories.map(p => ({ id: p.id, title: p.title, slug: p.slug, views: p.views, responses: p._count.comments })),
    activity,
  });
}
