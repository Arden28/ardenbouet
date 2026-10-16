import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminSession';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import type { CrmStats } from '@/app/admin/crm-types';
import { summarize } from '@/lib/money';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'admin_session';

async function isAuthed() {
  try {
    const store = await cookies();
    return verifyAdminToken(store.get(COOKIE_NAME)?.value);
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
    prisma.crmInvoice.findMany({ where: { status: 'PAID' }, select: { amount: true, currency: true } }),
    prisma.crmInvoice.findMany({ where: { status: { in: ['SENT', 'OVERDUE'] } }, select: { amount: true, currency: true } }),
    prisma.crmInvoice.count({ where: { status: 'OVERDUE' } }),
    prisma.crmProject.count({ where: { status: 'ACTIVE' } }),
    prisma.crmClient.count(),
    prisma.crmClient.count({ where: { status: 'LEAD' } }),
    prisma.crmInvoice.findMany({ where: { status: 'PAID', paidAt: { gte: startOfMonth } }, select: { amount: true, currency: true } }),
    prisma.crmInvoice.findMany({ where: { status: 'PAID', paidAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, select: { amount: true, currency: true } }),
  ]);

  const stats: CrmStats = {
    totalRevenue:     summarize(totalRevenueAgg),
    pendingAmount:    summarize(pendingAgg),
    pendingCount:     pendingAgg.length,
    overdueCount,
    activeProjects,
    totalClients,
    leadsCount,
    revenueThisMonth: summarize(thisMonthAgg),
    revenueLastMonth: summarize(lastMonthAgg),
  };

  return NextResponse.json(stats);
}
