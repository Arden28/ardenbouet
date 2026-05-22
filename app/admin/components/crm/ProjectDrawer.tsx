'use client';

import { useState } from 'react';
import type { CrmClient, CrmProject } from '@/app/admin/crm-types';
import { Button, EditorDrawer, SelectField, TextField } from '../atoms';

const STATUS_OPTS = ['DISCOVERY', 'PROPOSAL', 'ACTIVE', 'REVIEW', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];
const CURRENCY_OPTS = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY'];

function toDateInput(iso: string | null) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export default function ProjectDrawer({
  project,
  clients,
  onSave,
  onClose,
}: {
  project: CrmProject | null;
  clients: CrmClient[];
  onSave: () => void;
  onClose: () => void;
}) {
  const isNew = !project;

  const [clientId,    setClientId]    = useState(project?.clientId    ?? clients[0]?.id ?? '');
  const [title,       setTitle]       = useState(project?.title       ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [status,      setStatus]      = useState(project?.status      ?? 'DISCOVERY');
  const [budget,      setBudget]      = useState(project?.budget != null ? String(project.budget) : '');
  const [currency,    setCurrency]    = useState(project?.currency     ?? 'USD');
  const [startDate,   setStartDate]   = useState(toDateInput(project?.startDate ?? null));
  const [endDate,     setEndDate]     = useState(toDateInput(project?.endDate   ?? null));
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = {
        clientId,
        title: title.trim(),
        description: description.trim() || null,
        status,
        budget: budget ? Number(budget) : null,
        currency,
        startDate: startDate || null,
        endDate:   endDate   || null,
      };
      const res = await fetch(
        isNew ? '/api/admin/crm/projects' : `/api/admin/crm/projects/${project.id}`,
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
    if (!project || !confirm(`Delete project "${project.title}"?`)) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/crm/projects/${project.id}`, { method: 'DELETE' });
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
      title={isNew ? 'New Project' : project.title}
      actions={
        !isNew ? (
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={saving}>Delete</Button>
        ) : undefined
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client selector */}
        <label className="block">
          <span className={labelCls}>Client *</span>
          <select value={clientId} onChange={e => setClientId(e.target.value)} className={selectCls} required>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
            ))}
          </select>
        </label>

        <TextField label="Title" value={title} onChange={setTitle} required />
        <TextField label="Description" value={description} onChange={setDescription} textarea rows={3} />

        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Status"   value={status}   onChange={v => setStatus(v as typeof status)}   options={STATUS_OPTS}   />
          <SelectField label="Currency" value={currency} onChange={setCurrency} options={CURRENCY_OPTS} />
        </div>

        <TextField
          label="Budget"
          value={budget}
          onChange={setBudget}
          placeholder="e.g. 5000"
          hint="Leave blank if not set"
        />

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className={labelCls}>Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className={selectCls}
            />
          </label>
          <label className="block">
            <span className={labelCls}>End Date</span>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className={selectCls}
            />
          </label>
        </div>

        {error && <p className="font-mono text-[10px] text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" loading={saving}>
            {isNew ? 'Create Project' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </EditorDrawer>
  );
}
