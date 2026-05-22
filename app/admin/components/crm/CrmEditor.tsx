'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CrmClient, CrmInvoice, CrmProject, CrmStats } from '@/app/admin/crm-types';
import { Chip, cn } from '../atoms';
import CrmOverview      from './CrmOverview';
import CrmClientsPanel  from './CrmClientsPanel';
import CrmProjectsPanel from './CrmProjectsPanel';
import CrmInvoicesPanel from './CrmInvoicesPanel';

type CrmSubTab = 'overview' | 'clients' | 'projects' | 'invoices';

const TABS: { key: CrmSubTab; label: string }[] = [
  { key: 'overview',  label: 'Overview'  },
  { key: 'clients',   label: 'Clients'   },
  { key: 'projects',  label: 'Projects'  },
  { key: 'invoices',  label: 'Invoices'  },
];

function SkeletonCard() {
  return <div className="h-24 w-full animate-pulse bg-zinc-100 dark:bg-zinc-800" />;
}

export default function CrmEditor() {
  const [crmTab, setCrmTab]   = useState<CrmSubTab>('overview');
  const [loading, setLoading] = useState(true);
  const [stats,    setStats]    = useState<CrmStats | null>(null);
  const [clients,  setClients]  = useState<CrmClient[]>([]);
  const [projects, setProjects] = useState<CrmProject[]>([]);
  const [invoices, setInvoices] = useState<CrmInvoice[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, clientsRes, projectsRes, invoicesRes] = await Promise.all([
        fetch('/api/admin/crm/stats'),
        fetch('/api/admin/crm/clients'),
        fetch('/api/admin/crm/projects'),
        fetch('/api/admin/crm/invoices'),
      ]);
      const [s, c, p, i] = await Promise.all([
        statsRes.json(), clientsRes.json(), projectsRes.json(), invoicesRes.json(),
      ]);
      setStats(s);
      setClients(Array.isArray(c) ? c : []);
      setProjects(Array.isArray(p) ? p : []);
      setInvoices(Array.isArray(i) ? i : []);
    } catch {
      // keep stale data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          CRM
        </h1>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          Clients · Projects · Invoices
        </p>
      </div>

      {/* Sub-nav */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        {TABS.map(t => (
          <Chip key={t.key} active={crmTab === t.key} onClick={() => setCrmTab(t.key)}>
            {t.label}
          </Chip>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : (
        <>
          {crmTab === 'overview'  && stats && (
            <CrmOverview
              stats={stats}
              projects={projects}
              invoices={invoices}
              onNavigate={setCrmTab}
            />
          )}
          {crmTab === 'clients'   && (
            <CrmClientsPanel clients={clients} onRefresh={refresh} />
          )}
          {crmTab === 'projects'  && (
            <CrmProjectsPanel projects={projects} clients={clients} onRefresh={refresh} />
          )}
          {crmTab === 'invoices'  && (
            <CrmInvoicesPanel invoices={invoices} clients={clients} projects={projects} onRefresh={refresh} />
          )}
        </>
      )}
    </div>
  );
}
