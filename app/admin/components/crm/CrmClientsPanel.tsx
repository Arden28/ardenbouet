'use client';

import { useState } from 'react';
import type { CrmClient, CrmClientStatus } from '@/app/admin/crm-types';
import { Button, Chip } from '../atoms';
import ClientDrawer from './ClientDrawer';

const STATUS_COLORS: Record<CrmClientStatus, string> = {
  LEAD:     'bg-amber-100 text-amber-700',
  ACTIVE:   'bg-blue-100 text-[#2467AC]',
  INACTIVE: 'bg-zinc-100 text-zinc-500',
};

const FILTERS: Array<{ key: CrmClientStatus | 'ALL'; label: string }> = [
  { key: 'ALL',      label: 'All'      },
  { key: 'LEAD',     label: 'Lead'     },
  { key: 'ACTIVE',   label: 'Active'   },
  { key: 'INACTIVE', label: 'Inactive' },
];

export default function CrmClientsPanel({
  clients,
  onRefresh,
}: {
  clients: CrmClient[];
  onRefresh: () => void;
}) {
  const [filter,    setFilter]    = useState<CrmClientStatus | 'ALL'>('ALL');
  const [q,         setQ]         = useState('');
  const [drawer,    setDrawer]    = useState<CrmClient | null | 'new'>(null);

  const visible = clients.filter(c => {
    if (filter !== 'ALL' && c.status !== filter) return false;
    if (q) {
      const lq = q.toLowerCase();
      return c.name.toLowerCase().includes(lq)
          || c.email.toLowerCase().includes(lq)
          || (c.company ?? '').toLowerCase().includes(lq);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
              {f.label}
              {f.key !== 'ALL' && (
                <span className="ml-1 opacity-60">
                  {clients.filter(c => c.status === f.key).length}
                </span>
              )}
            </Chip>
          ))}
        </div>
        <input
          className="ml-auto border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 w-48"
          placeholder="Search clients…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <Button variant="primary" size="sm" onClick={() => setDrawer('new')}>
          + New Client
        </Button>
      </div>

      {/* Table */}
      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {visible.length === 0 ? (
          <p className="px-4 py-8 text-center font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            No clients found
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                {['Name', 'Company', 'Email', 'Status', 'Tags'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {visible.map(c => (
                <tr
                  key={c.id}
                  className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  onClick={() => setDrawer(c)}
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{c.name}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{c.company ?? '—'}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{c.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide ${STATUS_COLORS[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {c.tags.map(t => (
                        <span key={t} className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 font-mono text-[9px] text-zinc-500">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {drawer && (
        <ClientDrawer
          client={drawer === 'new' ? null : drawer}
          onSave={onRefresh}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  );
}
