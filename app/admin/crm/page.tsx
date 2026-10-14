'use client';
// /admin/crm — clients, project pipeline (board), invoices
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Mail, Phone, Building2, Trash2 } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Badge, Button, Drawer, Empty, Field, SearchInput, Spinner, Tabs, TagInput, inputCls } from '@/components/admin/ui';
import type { CrmClient, CrmProject, CrmInvoice, CrmProjectStatus, CrmInvoiceStatus } from '@/app/admin/crm-types';
import '@/app/blog/story.css';

type Client = CrmClient & { _count?: { projects: number; invoices: number } };
type Project = CrmProject & { _count?: { invoices: number } };
type Invoice = CrmInvoice & { client?: { id: string; name: string; company: string | null }; project?: { id: string; title: string } | null; clientId: string; projectId: string | null };

const STAGES: { key: CrmProjectStatus; label: string }[] = [
  { key: 'DISCOVERY', label: 'Discovery' }, { key: 'PROPOSAL', label: 'Proposal' }, { key: 'ACTIVE', label: 'Active' },
  { key: 'REVIEW', label: 'Review' }, { key: 'COMPLETED', label: 'Completed' }, { key: 'ON_HOLD', label: 'On hold' }, { key: 'CANCELLED', label: 'Cancelled' },
];
const INV_TONE: Record<CrmInvoiceStatus, 'neutral' | 'blue' | 'green' | 'red' | 'amber'> = { DRAFT: 'neutral', SENT: 'blue', PAID: 'green', OVERDUE: 'red', CANCELLED: 'neutral' };
const money = (n: number | null | undefined, c = 'USD') => (n == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(n));
const dateInput = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '');

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Request failed');
  return res.json();
}

function Crm() {
  const params = useSearchParams();
  const router = useRouter();
  const tab = (params.get('tab') as 'clients' | 'projects' | 'invoices') || 'clients';
  const [clients, setClients] = useState<Client[] | null>(null);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [q, setQ] = useState('');
  const [client, setClient] = useState<Partial<Client> | null>(null);
  const [project, setProject] = useState<Partial<Project> | null>(null);
  const [invoice, setInvoice] = useState<Partial<Invoice> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    fetch('/api/admin/crm/clients').then(r => r.json()).then(setClients);
    fetch('/api/admin/crm/projects').then(r => r.json()).then(setProjects);
    fetch('/api/admin/crm/invoices').then(r => r.json()).then(setInvoices);
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (params.get('new') && tab === 'invoices') setInvoice({ currency: 'USD', status: 'DRAFT' }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const term = q.trim().toLowerCase();
  const fClients = useMemo(() => (clients ?? []).filter(c => !term || `${c.name} ${c.company ?? ''} ${c.email} ${c.tags.join(' ')}`.toLowerCase().includes(term)), [clients, term]);
  const fProjects = useMemo(() => (projects ?? []).filter(p => !term || `${p.title} ${p.client?.name ?? ''}`.toLowerCase().includes(term)), [projects, term]);
  const fInvoices = useMemo(() => (invoices ?? []).filter(i => !term || `${i.invoiceNumber} ${i.client?.name ?? ''} ${i.project?.title ?? ''}`.toLowerCase().includes(term)), [invoices, term]);
  const isOverdue = (i: Invoice) => i.status === 'OVERDUE' || (i.status === 'SENT' && !!i.dueAt && new Date(i.dueAt) < new Date());

  const run = async (fn: () => Promise<unknown>, after: () => void) => {
    setBusy(true); setError('');
    try { await fn(); after(); load(); } catch (e) { setError((e as Error).message); }
    setBusy(false);
  };

  const saveClient = () => client && run(() => (client.id ? send(`/api/admin/crm/clients/${client.id}`, 'PUT', client) : send('/api/admin/crm/clients', 'POST', client)), () => setClient(null));
  const saveProject = () => project && run(() => (project.id ? send(`/api/admin/crm/projects/${project.id}`, 'PUT', project) : send('/api/admin/crm/projects', 'POST', project)), () => setProject(null));
  const saveInvoice = () => invoice && run(() => (invoice.id ? send(`/api/admin/crm/invoices/${invoice.id}`, 'PUT', invoice) : send('/api/admin/crm/invoices', 'POST', invoice)), () => setInvoice(null));
  const moveProject = (p: Project, status: CrmProjectStatus) => {
    setProjects(list => list && list.map(x => (x.id === p.id ? { ...x, status } : x)));
    send(`/api/admin/crm/projects/${p.id}`, 'PUT', { status }).catch(load);
  };
  const del = (kind: 'clients' | 'projects' | 'invoices', id: string, label: string) => {
    if (!confirm(`Delete ${label}?${kind === 'clients' ? ' Its projects and invoices are deleted too.' : ''}`)) return;
    run(() => send(`/api/admin/crm/${kind}/${id}`, 'DELETE'), () => { setClient(null); setProject(null); setInvoice(null); });
  };

  const clientOptions = (clients ?? []).map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ''}</option>);

  return (
    <div className="mx-auto max-w-[1200px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Tabs value={tab} onChange={k => router.replace(`/admin/crm?tab=${k}`)} items={[
          { key: 'clients', label: 'Clients', count: clients?.length }, { key: 'projects', label: 'Pipeline', count: projects?.length },
          { key: 'invoices', label: 'Invoices', count: invoices?.length },
        ]} />
        <div className="mb-3 flex items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder="Search" className="w-56" />
          {tab === 'clients' && <Button variant="primary" onClick={() => setClient({ status: 'LEAD', tags: [] })}><Plus className="h-4 w-4" /> Client</Button>}
          {tab === 'projects' && <Button variant="primary" onClick={() => setProject({ status: 'DISCOVERY', currency: 'USD' })} disabled={!clients?.length}><Plus className="h-4 w-4" /> Project</Button>}
          {tab === 'invoices' && <Button variant="primary" onClick={() => setInvoice({ currency: 'USD', status: 'DRAFT' })} disabled={!clients?.length}><Plus className="h-4 w-4" /> Invoice</Button>}
        </div>
      </div>

      {/* Clients */}
      {tab === 'clients' && (!clients ? <Spinner /> : fClients.length === 0 ? <div className="mt-6"><Empty title="No clients yet" body="Bookings and contact messages can create leads automatically." /></div> : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fClients.map(c => (
            <button key={c.id} type="button" onClick={() => setClient(c)} className="rounded-2xl border border-[#f0f0f0] bg-white p-5 text-left transition-colors hover:border-[#d4d4d4]">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-semibold text-[#242424]">{c.name}</p>
                  {c.company && <p className="flex items-center gap-1.5 truncate text-[13px] text-[#6b6b6b]"><Building2 className="h-3.5 w-3.5" /> {c.company}</p>}
                </div>
                <Badge tone={c.status === 'ACTIVE' ? 'green' : c.status === 'LEAD' ? 'blue' : 'neutral'}>{c.status.toLowerCase()}</Badge>
              </div>
              <p className="mt-3 truncate text-[13px] text-[#6b6b6b]">{c.email}</p>
              <p className="mt-3 text-[12px] text-[#9b9b9b]">{c._count?.projects ?? 0} projects · {c._count?.invoices ?? 0} invoices</p>
              {c.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{c.tags.slice(0, 4).map(t => <Badge key={t}>{t}</Badge>)}</div>}
            </button>
          ))}
        </div>
      ))}

      {/* Pipeline board */}
      {tab === 'projects' && (!projects ? <Spinner /> : (
        <div className="no-scrollbar -mx-4 mt-6 flex gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
          {STAGES.map(s => {
            const col = fProjects.filter(p => p.status === s.key);
            const total = col.reduce((sum, p) => sum + (p.budget ?? 0), 0);
            return (
              <div key={s.key} className="flex w-[260px] shrink-0 flex-col rounded-2xl bg-[#f6f6f6] p-2"
                onDragOver={e => e.preventDefault()}
                onDrop={e => { const id = e.dataTransfer.getData('text/project'); const p = projects.find(x => x.id === id); if (p && p.status !== s.key) moveProject(p, s.key); }}>
                <div className="flex items-baseline justify-between px-2 py-2">
                  <p className="text-[13px] font-semibold text-[#242424]">{s.label} <span className="font-normal text-[#9b9b9b]">{col.length}</span></p>
                  {total > 0 && <span className="text-[12px] tabular-nums text-[#6b6b6b]">{money(total)}</span>}
                </div>
                <div className="flex min-h-[80px] flex-1 flex-col gap-2">
                  {col.map(p => (
                    <button key={p.id} type="button" draggable onDragStart={e => e.dataTransfer.setData('text/project', p.id)} onClick={() => setProject(p)}
                      className="cursor-grab rounded-xl bg-white p-3 text-left shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] active:cursor-grabbing">
                      <p className="text-[14px] font-medium text-[#242424]">{p.title}</p>
                      <p className="mt-0.5 truncate text-[12px] text-[#6b6b6b]">{p.client?.name}</p>
                      <div className="mt-2 flex items-center justify-between text-[12px] text-[#9b9b9b]">
                        <span className="tabular-nums">{money(p.budget, p.currency)}</span>
                        {p.endDate && <span>due {new Date(p.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Invoices */}
      {tab === 'invoices' && (!invoices ? <Spinner /> : fInvoices.length === 0 ? <div className="mt-6"><Empty title="No invoices yet" /></div> : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-[#f0f0f0] bg-white">
          <table className="w-full min-w-[720px] text-left text-[14px]">
            <thead className="border-b border-[#f2f2f2] text-[11px] uppercase tracking-[0.06em] text-[#9b9b9b]">
              <tr><th className="px-4 py-3 font-medium">Number</th><th className="px-4 py-3 font-medium">Client</th><th className="px-4 py-3 font-medium">Project</th><th className="px-4 py-3 text-right font-medium">Amount</th><th className="px-4 py-3 font-medium">Due</th><th className="px-4 py-3 font-medium">Status</th></tr>
            </thead>
            <tbody>
              {fInvoices.map(i => (
                <tr key={i.id} onClick={() => setInvoice(i)} className="cursor-pointer border-b border-[#f6f6f6] last:border-0 hover:bg-[#fcfcfc]">
                  <td className="px-4 py-3 font-mono text-[13px] text-[#242424]">{i.invoiceNumber}</td>
                  <td className="px-4 py-3 text-[#242424]">{i.client?.name}</td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{i.project?.title ?? '—'}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#242424]">{money(i.amount, i.currency)}</td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{i.dueAt ? new Date(i.dueAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3"><Badge tone={isOverdue(i) ? 'red' : INV_TONE[i.status]}>{isOverdue(i) && i.status === 'SENT' ? 'overdue' : i.status.toLowerCase()}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Client drawer */}
      <Drawer open={!!client} onClose={() => setClient(null)} title={client?.id ? client.name ?? 'Client' : 'New client'} width={560}
        footer={<>{client?.id && <Button variant="danger" className="mr-auto" onClick={() => del('clients', client.id!, client.name ?? 'client')}><Trash2 className="h-4 w-4" /></Button>}
          <Button variant="ghost" onClick={() => setClient(null)}>Cancel</Button><Button variant="primary" busy={busy} onClick={saveClient}>Save</Button></>}>
        {client && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" className="sm:col-span-2"><input value={client.name ?? ''} onChange={e => setClient({ ...client, name: e.target.value })} className={inputCls} /></Field>
            <Field label="Email"><input value={client.email ?? ''} onChange={e => setClient({ ...client, email: e.target.value })} className={inputCls} /></Field>
            <Field label="Company"><input value={client.company ?? ''} onChange={e => setClient({ ...client, company: e.target.value })} className={inputCls} /></Field>
            <Field label="Phone"><input value={client.phone ?? ''} onChange={e => setClient({ ...client, phone: e.target.value })} className={inputCls} /></Field>
            <Field label="Country"><input value={client.country ?? ''} onChange={e => setClient({ ...client, country: e.target.value })} className={inputCls} /></Field>
            <Field label="Status" className="sm:col-span-2">
              <div className="flex gap-2">{(['LEAD', 'ACTIVE', 'INACTIVE'] as const).map(s => <button key={s} type="button" onClick={() => setClient({ ...client, status: s })} className={`rounded-full px-3 py-1.5 text-[13px] ${client.status === s ? 'bg-[#242424] text-white' : 'border border-[#e6e6e6]'}`}>{s.toLowerCase()}</button>)}</div>
            </Field>
            <Field label="Tags" className="sm:col-span-2"><TagInput value={client.tags ?? []} onChange={tags => setClient({ ...client, tags })} /></Field>
            <Field label="Notes" className="sm:col-span-2"><textarea rows={5} value={client.notes ?? ''} onChange={e => setClient({ ...client, notes: e.target.value })} className={inputCls} /></Field>
            {client.id && (
              <div className="flex gap-2 sm:col-span-2">
                {client.email && <a href={`mailto:${client.email}`} className="inline-flex items-center gap-1.5 rounded-full border border-[#e6e6e6] px-3 py-1.5 text-[13px] hover:border-[#242424]"><Mail className="h-3.5 w-3.5" /> Email</a>}
                {client.phone && <a href={`tel:${client.phone}`} className="inline-flex items-center gap-1.5 rounded-full border border-[#e6e6e6] px-3 py-1.5 text-[13px] hover:border-[#242424]"><Phone className="h-3.5 w-3.5" /> Call</a>}
                <Button size="sm" onClick={() => { setProject({ clientId: client.id, status: 'DISCOVERY', currency: 'USD' }); setClient(null); }}><Plus className="h-3.5 w-3.5" /> Project</Button>
                <Button size="sm" onClick={() => { setInvoice({ clientId: client.id, currency: 'USD', status: 'DRAFT' }); setClient(null); }}><Plus className="h-3.5 w-3.5" /> Invoice</Button>
              </div>
            )}
            {error && <p className="text-[13px] text-[#c94a4a] sm:col-span-2">{error}</p>}
          </div>
        )}
      </Drawer>

      {/* Project drawer */}
      <Drawer open={!!project} onClose={() => setProject(null)} title={project?.id ? project.title ?? 'Project' : 'New project'} width={560}
        footer={<>{project?.id && <Button variant="danger" className="mr-auto" onClick={() => del('projects', project.id!, project.title ?? 'project')}><Trash2 className="h-4 w-4" /></Button>}
          <Button variant="ghost" onClick={() => setProject(null)}>Cancel</Button><Button variant="primary" busy={busy} onClick={saveProject}>Save</Button></>}>
        {project && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" className="sm:col-span-2"><input value={project.title ?? ''} onChange={e => setProject({ ...project, title: e.target.value })} className={inputCls} /></Field>
            <Field label="Client" className="sm:col-span-2"><select value={project.clientId ?? ''} onChange={e => setProject({ ...project, clientId: e.target.value })} className={inputCls}><option value="">Choose…</option>{clientOptions}</select></Field>
            <Field label="Stage" className="sm:col-span-2"><select value={project.status} onChange={e => setProject({ ...project, status: e.target.value as CrmProjectStatus })} className={inputCls}>{STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select></Field>
            <Field label="Budget"><input type="number" value={project.budget ?? ''} onChange={e => setProject({ ...project, budget: e.target.value === '' ? null : Number(e.target.value) })} className={inputCls} /></Field>
            <Field label="Currency"><select value={project.currency ?? 'USD'} onChange={e => setProject({ ...project, currency: e.target.value })} className={inputCls}>{['USD', 'EUR', 'GBP', 'KES', 'XAF'].map(c => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Start"><input type="date" value={dateInput(project.startDate)} onChange={e => setProject({ ...project, startDate: e.target.value || null })} className={inputCls} /></Field>
            <Field label="Deadline"><input type="date" value={dateInput(project.endDate)} onChange={e => setProject({ ...project, endDate: e.target.value || null })} className={inputCls} /></Field>
            <Field label="Description" className="sm:col-span-2"><textarea rows={4} value={project.description ?? ''} onChange={e => setProject({ ...project, description: e.target.value })} className={inputCls} /></Field>
            {error && <p className="text-[13px] text-[#c94a4a] sm:col-span-2">{error}</p>}
          </div>
        )}
      </Drawer>

      {/* Invoice drawer */}
      <Drawer open={!!invoice} onClose={() => setInvoice(null)} title={invoice?.invoiceNumber ?? 'New invoice'} subtitle={invoice?.id ? 'Paid date is set automatically when marked paid.' : 'The number (INV-YYYY-NNN) is assigned on save.'} width={520}
        footer={<>{invoice?.id && <Button variant="danger" className="mr-auto" onClick={() => del('invoices', invoice.id!, invoice.invoiceNumber ?? 'invoice')}><Trash2 className="h-4 w-4" /></Button>}
          <Button variant="ghost" onClick={() => setInvoice(null)}>Cancel</Button><Button variant="primary" busy={busy} onClick={saveInvoice}>Save</Button></>}>
        {invoice && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Client" className="sm:col-span-2"><select value={invoice.clientId ?? ''} onChange={e => setInvoice({ ...invoice, clientId: e.target.value, projectId: null })} className={inputCls}><option value="">Choose…</option>{clientOptions}</select></Field>
            <Field label="Project (optional)" className="sm:col-span-2">
              <select value={invoice.projectId ?? ''} onChange={e => setInvoice({ ...invoice, projectId: e.target.value || null })} className={inputCls}>
                <option value="">None</option>{(projects ?? []).filter(p => p.clientId === invoice.clientId).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </Field>
            <Field label="Amount"><input type="number" value={invoice.amount ?? ''} onChange={e => setInvoice({ ...invoice, amount: Number(e.target.value) })} className={inputCls} /></Field>
            <Field label="Currency"><select value={invoice.currency ?? 'USD'} onChange={e => setInvoice({ ...invoice, currency: e.target.value })} className={inputCls}>{['USD', 'EUR', 'GBP', 'KES', 'XAF'].map(c => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Due date"><input type="date" value={dateInput(invoice.dueAt)} onChange={e => setInvoice({ ...invoice, dueAt: e.target.value || null })} className={inputCls} /></Field>
            {invoice.id && (
              <Field label="Status"><select value={invoice.status} onChange={e => setInvoice({ ...invoice, status: e.target.value as CrmInvoiceStatus })} className={inputCls}>{(['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] as const).map(s => <option key={s} value={s}>{s.toLowerCase()}</option>)}</select></Field>
            )}
            <Field label="Notes" className="sm:col-span-2"><textarea rows={3} value={invoice.notes ?? ''} onChange={e => setInvoice({ ...invoice, notes: e.target.value })} className={inputCls} /></Field>
            {error && <p className="text-[13px] text-[#c94a4a] sm:col-span-2">{error}</p>}
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default function CrmPage() {
  return <AdminShell title="CRM"><Suspense><Crm /></Suspense></AdminShell>;
}
