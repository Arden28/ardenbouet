'use client';

import { useState } from 'react';
import type { CrmClient, CrmProject, CrmProjectStatus } from '@/app/admin/crm-types';
import { Button, Chip } from '../atoms';
import ProjectDrawer from './ProjectDrawer';

const STATUS_COLORS: Record<CrmProjectStatus, string> = {
  DISCOVERY: 'bg-zinc-100 text-zinc-500',
  PROPOSAL:  'bg-amber-100 text-amber-700',
  ACTIVE:    'bg-blue-100 text-[#2467AC]',
  REVIEW:    'bg-purple-100 text-purple-600',
  COMPLETED: 'bg-emerald-100 text-emerald-600',
  ON_HOLD:   'bg-orange-100 text-orange-600',
  CANCELLED: 'bg-red-100 text-red-500',
};

const STATUS_FILTERS: Array<{ key: CrmProjectStatus | 'ALL'; label: string }> = [
  { key: 'ALL',       label: 'All'       },
  { key: 'ACTIVE',    label: 'Active'    },
  { key: 'PROPOSAL',  label: 'Proposal'  },
  { key: 'DISCOVERY', label: 'Discovery' },
  { key: 'REVIEW',    label: 'Review'    },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'ON_HOLD',   label: 'On Hold'   },
];

function fmt(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function CrmProjectsPanel({
  projects,
  clients,
  onRefresh,
}: {
  projects: CrmProject[];
  clients:  CrmClient[];
  onRefresh: () => void;
}) {
  const [filter,  setFilter]  = useState<CrmProjectStatus | 'ALL'>('ALL');
  const [q,       setQ]       = useState('');
  const [drawer,  setDrawer]  = useState<CrmProject | null | 'new'>(null);

  const visible = projects.filter(p => {
    if (filter !== 'ALL' && p.status !== filter) return false;
    if (q) {
      const lq = q.toLowerCase();
      return p.title.toLowerCase().includes(lq)
          || (p.client?.name ?? '').toLowerCase().includes(lq)
          || (p.client?.company ?? '').toLowerCase().includes(lq);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(f => (
            <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
            </Chip>
          ))}
        </div>
        <input
          className="ml-auto border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 w-48"
          placeholder="Search projects…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <Button variant="primary" size="sm" onClick={() => setDrawer('new')}>
          + New Project
        </Button>
      </div>

      {/* Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {visible.length === 0 ? (
          <p className="px-4 py-8 text-center font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            No projects found
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                {['Title', 'Client', 'Status', 'Budget', 'End Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {visible.map(p => (
                <tr
                  key={p.id}
                  className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  onClick={() => setDrawer(p)}
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{p.title}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {p.client ? (p.client.company || p.client.name) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide ${STATUS_COLORS[p.status]}`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {p.budget != null ? fmt(p.budget, p.currency) : '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{fmtDate(p.endDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {drawer && (
        <ProjectDrawer
          project={drawer === 'new' ? null : drawer}
          clients={clients}
          onSave={onRefresh}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  );
}
