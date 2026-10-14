'use client';
// /admin/settings — site identity, contact, social profiles, storage fallback, integrations status
import { useEffect, useState } from 'react';
import { CheckCircle2, CircleDashed } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Button, Field, PageIntro, SaveStatus, Spinner, inputCls } from '@/components/admin/ui';
import type { SiteSettings } from '@/app/admin/types';
import '@/app/blog/story.css';
import { BackupCard } from './BackupCard';

type Integration = { key: string; name: string; ok: boolean; detail: string; env: string };

const GROUPS: { title: string; description: string; fields: { key: keyof SiteSettings; label: string; placeholder?: string; secret?: boolean }[] }[] = [
  { title: 'Site', description: 'Used in page titles and emails.', fields: [
    { key: 'siteTitle', label: 'Site title', placeholder: 'Arden BOUET' }, { key: 'siteTagline', label: 'Tagline' },
  ] },
  { title: 'Contact', description: 'The email shows in the contact section of the home page.', fields: [
    { key: 'contactEmail', label: 'Public email' }, { key: 'contactPhone', label: 'Phone' }, { key: 'location', label: 'Location', placeholder: 'Nairobi, Kenya' },
  ] },
  { title: 'Social profiles', description: 'Links used across the site.', fields: [
    { key: 'github', label: 'GitHub URL' }, { key: 'linkedin', label: 'LinkedIn URL' }, { key: 'twitter', label: 'X / Twitter URL' }, { key: 'instagram', label: 'Instagram URL' }, { key: 'youtube', label: 'YouTube URL' },
  ] },
  { title: 'Storage fallback (Cloudflare R2)', description: 'Only used when R2 environment variables are not set. Environment variables always win.', fields: [
    { key: 'r2AccountId', label: 'Account ID' }, { key: 'r2BucketName', label: 'Bucket' }, { key: 'r2PublicUrl', label: 'Public URL', placeholder: 'https://media.example.com' },
    { key: 'r2AccessKeyId', label: 'Access key ID', secret: true }, { key: 'r2SecretAccessKey', label: 'Secret access key', secret: true },
  ] },
];

export default function SettingsPage() {
  const [s, setS] = useState<SiteSettings | null>(null);
  const [saved, setSaved] = useState<SiteSettings | null>(null);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [integrations, setIntegrations] = useState<Integration[] | null>(null);

  useEffect(() => {
    fetch('/api/admin/content', { cache: 'no-store' }).then(r => r.json()).then(d => { setS(d.settings ?? {}); setSaved(d.settings ?? {}); });
    fetch('/api/admin/integrations').then(r => r.json()).then(d => setIntegrations(d.integrations));
  }, []);

  const dirty = JSON.stringify(s) !== JSON.stringify(saved);
  const save = async () => {
    if (!s) return;
    setState('saving');
    const res = await fetch('/api/admin/content', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section: 'settings', value: s }) });
    if (res.ok) { setSaved(s); setState('saved'); } else setState('error');
  };

  return (
    <AdminShell title="Settings">
      <div className="mx-auto max-w-[860px]">
        <PageIntro title="Settings" actions={<><SaveStatus state={dirty ? 'dirty' : state} /><Button variant="primary" disabled={!dirty} busy={state === 'saving'} onClick={save}>Save settings</Button></>} />
        {!s ? <Spinner /> : (
          <div className="space-y-6">
            {GROUPS.map(g => (
              <section key={g.title} className="grid gap-6 rounded-2xl border border-[#f0f0f0] bg-white p-6 md:grid-cols-[220px_minmax(0,1fr)]">
                <div>
                  <h2 className="text-[15px] font-semibold text-[#242424]">{g.title}</h2>
                  <p className="mt-1 text-[13px] leading-5 text-[#6b6b6b]">{g.description}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {g.fields.map(f => (
                    <Field key={f.key} label={f.label}>
                      <input type={f.secret ? 'password' : 'text'} autoComplete="off" value={(s[f.key] as string) ?? ''} placeholder={f.placeholder}
                        onChange={e => setS({ ...s, [f.key]: e.target.value })} className={inputCls} />
                    </Field>
                  ))}
                </div>
              </section>
            ))}

            <BackupCard />

            <section className="rounded-2xl border border-[#f0f0f0] bg-white p-6">
              <h2 className="text-[15px] font-semibold text-[#242424]">Integrations</h2>
              <p className="mt-1 text-[13px] text-[#6b6b6b]">Configured through environment variables on the server. Secrets are never shown here.</p>
              {!integrations ? <Spinner /> : (
                <ul className="mt-4 divide-y divide-[#f6f6f6]">
                  {integrations.map(i => (
                    <li key={i.key} className="flex items-start gap-3 py-3">
                      {i.ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1a8917]" /> : <CircleDashed className="mt-0.5 h-5 w-5 shrink-0 text-[#c4c4c4]" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium text-[#242424]">{i.name} <span className={`ml-1 text-[12px] font-normal ${i.ok ? 'text-[#1a6b17]' : 'text-[#9b9b9b]'}`}>{i.ok ? 'active' : 'not configured'}</span></p>
                        <p className="text-[13px] text-[#6b6b6b]">{i.detail}</p>
                        {!i.ok && <p className="mt-0.5 font-mono text-[11px] text-[#9b9b9b]">{i.env}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
