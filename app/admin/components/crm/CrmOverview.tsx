'use client';

import type { CrmInvoice, CrmProject, CrmStats } from '@/app/admin/crm-types';

type CrmSubTab = 'overview' | 'clients' | 'projects' | 'invoices';

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
        {label}
      </p>
      <p className="mt-2 font-heading text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 font-mono text-[9px] text-zinc-400 dark:text-zinc-600">{sub}</p>
      )}
    </div>
  );
}

function fmt(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

const PROJECT_STATUS_COLORS: Record<string, string> = {
  DISCOVERY: 'bg-zinc-100 text-zinc-500',
  PROPOSAL:  'bg-amber-100 text-amber-700',
  ACTIVE:    'bg-blue-100 text-[#2467AC]',
  REVIEW:    'bg-purple-100 text-purple-600',
  COMPLETED: 'bg-emerald-100 text-emerald-600',
  ON_HOLD:   'bg-orange-100 text-orange-600',
  CANCELLED: 'bg-red-100 text-red-500',
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT:     'bg-zinc-100 text-zinc-500',
  SENT:      'bg-amber-100 text-amber-700',
  PAID:      'bg-emerald-100 text-emerald-600',
  OVERDUE:   'bg-red-100 text-red-500',
  CANCELLED: 'bg-zinc-100 text-zinc-500',
};

export default function CrmOverview({
  stats,
  projects,
  invoices,
  onNavigate,
}: {
  stats: CrmStats;
  projects: CrmProject[];
  invoices: CrmInvoice[];
  onNavigate: (tab: CrmSubTab) => void;
}) {
  const activeProjects = projects.filter(p => p.status === 'ACTIVE').slice(0, 5);
  const recentInvoices = [...invoices].sort(
    (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
  ).slice(0, 5);

  const monthDelta = stats.revenueThisMonth - stats.revenueLastMonth;
  const monthSign  = monthDelta >= 0 ? '+' : '';

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          label="Total Revenue"
          value={fmt(stats.totalRevenue)}
          sub={`${monthSign}${fmt(monthDelta)} this month`}
        />
        <KpiCard
          label="Active Projects"
          value={String(stats.activeProjects)}
        />
        <KpiCard
          label="Pending Invoices"
          value={fmt(stats.pendingAmount)}
          sub={`${stats.pendingCount} invoice${stats.pendingCount !== 1 ? 's' : ''}${stats.overdueCount > 0 ? ` · ${stats.overdueCount} overdue` : ''}`}
        />
        <KpiCard
          label="Active Leads"
          value={String(stats.leadsCount)}
          sub={`${stats.totalClients} clients total`}
        />
      </div>

      {/* Lower panels */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Active projects */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400">
              Active Projects
            </span>
            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="font-mono text-[9px] uppercase tracking-widest text-[#2467AC] hover:underline"
            >
              View all →
            </button>
          </div>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {activeProjects.length === 0 && (
              <li className="px-4 py-3 font-mono text-[10px] text-zinc-400">No active projects</li>
            )}
            {activeProjects.map(p => (
              <li key={p.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{p.title}</p>
                  {p.client && (
                    <p className="font-mono text-[9px] text-zinc-400">{p.client.company || p.client.name}</p>
                  )}
                </div>
                <span className={`px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide ${PROJECT_STATUS_COLORS[p.status] ?? ''}`}>
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent invoices */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400">
              Recent Invoices
            </span>
            <button
              type="button"
              onClick={() => onNavigate('invoices')}
              className="font-mono text-[9px] uppercase tracking-widest text-[#2467AC] hover:underline"
            >
              View all →
            </button>
          </div>
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentInvoices.length === 0 && (
              <li className="px-4 py-3 font-mono text-[10px] text-zinc-400">No invoices yet</li>
            )}
            {recentInvoices.map(inv => (
              <li key={inv.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="font-mono text-[10px] font-medium text-zinc-900 dark:text-zinc-100">
                    {inv.invoiceNumber}
                  </p>
                  {inv.client && (
                    <p className="font-mono text-[9px] text-zinc-400">{inv.client.company || inv.client.name}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-zinc-700 dark:text-zinc-300">
                    {fmt(inv.amount, inv.currency)}
                  </span>
                  <span className={`px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide ${INVOICE_STATUS_COLORS[inv.status] ?? ''}`}>
                    {inv.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
