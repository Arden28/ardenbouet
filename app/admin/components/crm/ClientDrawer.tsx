'use client';

import { useState } from 'react';
import type { CrmClient } from '@/app/admin/crm-types';
import { Button, EditorDrawer, SelectField, TextField } from '../atoms';

const STATUS_OPTS = ['LEAD', 'ACTIVE', 'INACTIVE'];

export default function ClientDrawer({
  client,
  onSave,
  onClose,
}: {
  client: CrmClient | null;
  onSave: () => void;
  onClose: () => void;
}) {
  const isNew = !client;

  const [name,    setName]    = useState(client?.name    ?? '');
  const [email,   setEmail]   = useState(client?.email   ?? '');
  const [company, setCompany] = useState(client?.company ?? '');
  const [phone,   setPhone]   = useState(client?.phone   ?? '');
  const [country, setCountry] = useState(client?.country ?? '');
  const [status,  setStatus]  = useState(client?.status  ?? 'LEAD');
  const [notes,   setNotes]   = useState(client?.notes   ?? '');
  const [tags,    setTags]    = useState(client?.tags.join(', ') ?? '');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = {
        name: name.trim(),
        email: email.trim(),
        company: company.trim() || null,
        phone:   phone.trim()   || null,
        country: country.trim() || null,
        status,
        notes: notes.trim() || null,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      const res = await fetch(
        isNew ? '/api/admin/crm/clients' : `/api/admin/crm/clients/${client.id}`,
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
    if (!client || !confirm(`Delete ${client.name}? This will cascade all their projects and invoices.`)) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/crm/clients/${client.id}`, { method: 'DELETE' });
      onSave();
      onClose();
    } catch {
      setError('Delete failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditorDrawer
      isOpen
      onClose={onClose}
      title={isNew ? 'New Client' : client.name}
      actions={
        !isNew ? (
          <Button variant="danger" size="sm" onClick={handleDelete} disabled={saving}>
            Delete
          </Button>
        ) : undefined
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Name"    value={name}    onChange={setName}    required className="col-span-2" />
          <TextField label="Email"   value={email}   onChange={setEmail}   required className="col-span-2" />
          <TextField label="Company" value={company} onChange={setCompany} />
          <TextField label="Phone"   value={phone}   onChange={setPhone}   />
          <TextField label="Country" value={country} onChange={setCountry} />
          <SelectField label="Status" value={status} onChange={v => setStatus(v as typeof status)} options={STATUS_OPTS} />
        </div>
        <TextField label="Tags (comma-separated)" value={tags} onChange={setTags} placeholder="design, retainer, vip" />
        <TextField label="Notes" value={notes} onChange={setNotes} textarea rows={4} />

        {error && (
          <p className="font-mono text-[10px] text-red-500">{error}</p>
        )}

        <div className="flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" loading={saving}>
            {isNew ? 'Create Client' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </EditorDrawer>
  );
}
