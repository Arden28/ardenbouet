'use client';

import { useState } from 'react';
import type { CrmClient, CrmInvoice, CrmInvoiceStatus, CrmProject } from '@/app/admin/crm-types';
import { Button, Chip } from '../atoms';
import InvoiceDrawer from './InvoiceDrawer';

const STATUS_COLORS: Record<CrmInvoiceStatus, string> = {
  DRAFT:     'bg-zinc-100 text-zinc-500',
  SENT:      'bg-amber-100 text-amber-700',
  PAID:      'bg-emerald-100 text-emerald-600',
  OVERDUE:   'bg-red-100 text-red-500',
  CANCELLED: 'bg-zinc-100 text-zinc-500',
};

const STATUS_FILTERS: Array<{ key: CrmInvoiceStatus | 'ALL'; label: string }> = [
  { key: 'ALL',       label: 'All'       },
  { key: 'SENT',      label: 'Sent'      },
  { key: 'PAID',      label: 'Paid'      },
  { key: 'OVERDUE',   label: 'Overdue'   },
  { key: 'DRAFT',     label: 'Draft'     },
  { key: 'CANCELLED', label: 'Cancelled' },
];

function fmt(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CrmInvoicesPanel({
  invoices,
  clients,
  projects,
  onRefresh,
}: {
  invoices: CrmInvoice[];
  clients:  CrmClient[];
  projects: CrmProject[];
  onRefresh: () => void;
}) {
  const [filter,  setFilter]  = useState<CrmInvoiceStatus | 'ALL'>('ALL');
  const [q,       setQ]       = useState('');
  const [drawer,  setDrawer]  = useState<CrmInvoice | null | 'new'>(null);

  const visible = invoices.filter(inv => {
    if (filter !== 'ALL' && inv.status !== filter) return false;
    if (q) {
      const lq = q.toLowerCase();
      return inv.invoiceNumber.toLowerCase().includes(lq)
          || (inv.client?.name ?? '').toLowerCase().includes(lq)
          || (inv.client?.company ?? '').toLowerCase().includes(lq);
    }
    return true;
  });

  // Revenue subtotals for visible set
  const totalVisible = visible.reduce((sum, inv) => sum + inv.amount, 0);
  const paidVisible  = visible.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-4">
      {/* Revenue summary */}
      {visible.length > 0 && (
        <div className="flex gap-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400">Showing total</p>
            <p className="font-heading text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {fmt(totalVisible)}
            </p>
          </div>
          <div className="border-l border-zinc-200 dark:border-zinc-800 pl-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400">Paid</p>
            <p className="font-heading text-lg font-bold text-emerald-600">
              {fmt(paidVisible)}
            </p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(f => (
            <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
              {f.key !== 'ALL' && (
                <span className="ml-1 opacity-60">
                  {invoices.filter(i => i.status === f.key).length}
                </span>
              )}
            </Chip>
          ))}
        </div>
        <input
          className="ml-auto border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 w-48"
          placeholder="Search invoices…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <Button variant="primary" size="sm" onClick={() => setDrawer('new')}>
          + New Invoice
        </Button>
      </div>

      {/* Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {visible.length === 0 ? (
          <p className="px-4 py-8 text-center font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            No invoices found
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                {['Invoice #', 'Client', 'Project', 'Amount', 'Status', 'Due', 'Issued'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {visible.map(inv => (
                <tr
                  key={inv.id}
                  className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  onClick={() => setDrawer(inv)}
                >
                  <td className="px-4 py-3 font-mono text-[10px] font-medium text-zinc-900 dark:text-zinc-100">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {inv.client ? (inv.client.company || inv.client.name) : '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {inv.project?.title ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    {fmt(inv.amount, inv.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide ${STATUS_COLORS[inv.status]}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{fmtDate(inv.dueAt)}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{fmtDate(inv.issuedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {drawer && (
        <InvoiceDrawer
          invoice={drawer === 'new' ? null : drawer}
          clients={clients}
          projects={projects}
          onSave={onRefresh}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  );
}
