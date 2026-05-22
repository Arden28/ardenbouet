'use client';

import { useState } from 'react';
import type { CrmClient, CrmInvoice, CrmInvoiceStatus, CrmProject } from '@/app/admin/crm-types';
import { Button, EditorDrawer, SelectField, TextField } from '../atoms';

const STATUS_OPTS: CrmInvoiceStatus[] = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];
const CURRENCY_OPTS = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY'];

function toDateInput(iso: string | null) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function fmt(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export default function InvoiceDrawer({
  invoice,
  clients,
  projects,
  onSave,
  onClose,
}: {
  invoice: CrmInvoice | null;
  clients: CrmClient[];
  projects: CrmProject[];
  onSave: () => void;
  onClose: () => void;
}) {
  const isNew = !invoice;

  const [clientId,  setClientId]  = useState(invoice?.clientId  ?? clients[0]?.id ?? '');
  const [projectId, setProjectId] = useState(invoice?.projectId ?? '');
  const [amount,    setAmount]    = useState(invoice?.amount != null ? String(invoice.amount) : '');
  const [currency,  setCurrency]  = useState(invoice?.currency  ?? 'USD');
  const [status,    setStatus]    = useState<CrmInvoiceStatus>(invoice?.status ?? 'DRAFT');
  const [dueAt,     setDueAt]     = useState(toDateInput(invoice?.dueAt ?? null));
  const [notes,     setNotes]     = useState(invoice?.notes ?? '');
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const clientProjects = projects.filter(p => p.clientId === clientId);

  function handleClientChange(id: string) {
    setClientId(id);
    setProjectId(''); // reset project when client changes
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = {
        clientId,
        projectId: projectId || null,
        amount: Number(amount),
        currency,
        status,
        dueAt: dueAt || null,
        notes: notes.trim() || null,
      };
      const res = await fetch(
        isNew ? '/api/admin/crm/invoices' : `/api/admin/crm/invoices/${invoice.id}`,
        { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );
      if (!res.ok) throw new Error(await res.text());
      onSave();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!invoice || !confirm(`Delete invoice ${invoice.invoiceNumber}?`)) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/crm/invoices/${invoice.id}`, { method: 'DELETE' });
      onSave();
      onClose();
    } catch {
      setError('Delete failed');
    } finally {
      setSaving(false);
    }
  }

  const selectCls = [
    'w-full border border-zinc-200 dark:border-zinc-800',
    'bg-white dark:bg-zinc-900',
    'px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100',
    'focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100',
    'transition-colors duration-150 appearance-none',
  ].join(' ');

  const labelCls = 'mb-1.5 block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600';

  return (
    <EditorDrawer
      isOpen
      onClose={onClose}
      title={isNew ? 'New Invoice' : invoice.invoiceNumber}
      actions={
        !isNew ? (
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={saving}>Delete</Button>
        ) : undefined
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Invoice number (read-only on edit) */}
        {!isNew && (
          <div>
            <span className={labelCls}>Invoice Number</span>
            <p className="font-mono text-sm text-zinc-500">{invoice.invoiceNumber}</p>
            {invoice.paidAt && (
              <p className="font-mono text-[9px] text-emerald-600 mt-0.5">
                Paid {new Date(invoice.paidAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Client selector */}
        <label className="block">
          <span className={labelCls}>Client *</span>
          <select value={clientId} onChange={e => handleClientChange(e.target.value)} className={selectCls} required>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
            ))}
          </select>
        </label>

        {/* Project selector — filtered by client */}
        {clientProjects.length > 0 && (
          <label className="block">
            <span className={labelCls}>Project</span>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className={selectCls}>
              <option value="">— No project —</option>
              {clientProjects.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </label>
        )}

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Amount *"
            value={amount}
            onChange={setAmount}
            required
            placeholder="e.g. 2500"
          />
          <SelectField label="Currency" value={currency} onChange={setCurrency} options={CURRENCY_OPTS} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Status" value={status} onChange={v => setStatus(v as CrmInvoiceStatus)} options={STATUS_OPTS} />
          <label className="block">
            <span className={labelCls}>Due Date</span>
            <input
              type="date"
              value={dueAt}
              onChange={e => setDueAt(e.target.value)}
              className={selectCls}
            />
          </label>
        </div>

        <TextField label="Notes" value={notes} onChange={setNotes} textarea rows={3} />

        {/* Amount preview */}
        {amount && !isNaN(Number(amount)) && (
          <p className="font-mono text-[10px] text-zinc-400">
            Total: {fmt(Number(amount), currency)}
          </p>
        )}

        {error && <p className="font-mono text-[10px] text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" loading={saving}>
            {isNew ? 'Create Invoice' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </EditorDrawer>
  );
}
