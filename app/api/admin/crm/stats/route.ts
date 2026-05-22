import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import type { CrmStats } from '@/app/admin/crm-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'admin_session';

async function isAuthed() {
  try {
    const store = await cookies();
    return store.get(COOKIE_NAME)?.value === '1';
  } catch { return false; }
}

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [
    totalRevenueAgg,
    pendingAgg,
    overdueCount,
    activeProjects,
    totalClients,
    leadsCount,
    thisMonthAgg,
    lastMonthAgg,
  ] = await Promise.all([
    prisma.crmInvoice.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
    prisma.crmInvoice.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { status: { in: ['SENT', 'OVERDUE'] } },
    }),
    prisma.crmInvoice.count({ where: { status: 'OVERDUE' } }),
    prisma.crmProject.count({ where: { status: 'ACTIVE' } }),
    prisma.crmClient.count(),
    prisma.crmClient.count({ where: { status: 'LEAD' } }),
    prisma.crmInvoice.aggregate({
      _sum: { amount: true },
      where: { status: 'PAID', paidAt: { gte: startOfMonth } },
    }),
    prisma.crmInvoice.aggregate({
      _sum: { amount: true },
      where: { status: 'PAID', paidAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
    }),
  ]);

  const stats: CrmStats = {
    totalRevenue:     totalRevenueAgg._sum.amount ?? 0,
    pendingAmount:    pendingAgg._sum.amount ?? 0,
    pendingCount:     pendingAgg._count,
    overdueCount,
    activeProjects,
    totalClients,
    leadsCount,
    revenueThisMonth: thisMonthAgg._sum.amount ?? 0,
    revenueLastMonth: lastMonthAgg._sum.amount ?? 0,
  };

  return NextResponse.json(stats);
}
