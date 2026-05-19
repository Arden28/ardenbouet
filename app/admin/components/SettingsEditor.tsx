'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import type { SiteSettings } from '../types';
import { TextField, Rule, Button } from './atoms';

// ─── Section heading ─────────────────────────────────────────────────────────
function SectionHead({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5">
      <h3 className="font-heading text-base font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      {description && (
        <p className="mt-0.5 font-mono text-[10px] text-zinc-400 dark:text-zinc-600">{description}</p>
      )}
    </div>
  );
}

// ─── Password-style text field ────────────────────────────────────────────────
function SecretField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-600">
        {label}
      </label>
      <div className="flex items-center border border-zinc-200 dark:border-zinc-800 focus-within:border-zinc-900 dark:focus-within:border-zinc-100 transition-colors">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent px-3 py-2 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-300 dark:placeholder:text-zinc-700 outline-none"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="px-3 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          aria-label={show ? 'Hide' : 'Show'}
        >
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      {hint && (
        <p className="font-mono text-[9px] text-zinc-400 dark:text-zinc-600">{hint}</p>
      )}
    </div>
  );
}

// ─── Connection test result ───────────────────────────────────────────────────
type TestState = 'idle' | 'testing' | 'ok' | 'fail';

function ConnectionBadge({ state, message }: { state: TestState; message?: string }) {
  if (state === 'idle') return null;
  if (state === 'testing') return (
    <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-400">
      <Loader2 className="h-3 w-3 animate-spin" />
      Testing connection…
    </div>
  );
  if (state === 'ok') return (
    <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
      <CheckCircle2 className="h-3 w-3" />
      Connected — R2 is working
    </div>
  );
  return (
    <div className="flex items-center gap-1.5 font-mono text-[10px] text-red-500">
      <XCircle className="h-3 w-3" />
      {message ?? 'Connection failed'}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SettingsEditor({
  value,
  onChange,
}: {
  value: SiteSettings;
  onChange: (s: SiteSettings) => void;
}) {
  const set = (patch: Partial<SiteSettings>) => onChange({ ...value, ...patch });

  const [testState,   setTestState]   = useState<TestState>('idle');
  const [testMessage, setTestMessage] = useState<string | undefined>();

  const testConnection = async () => {
    setTestState('testing');
    setTestMessage(undefined);
    try {
      const res = await fetch('/api/admin/media');
      if (res.ok || res.status === 200) {
        setTestState('ok');
      } else {
        const body = await res.json().catch(() => ({}));
        setTestState('fail');
        setTestMessage(body.error ?? `HTTP ${res.status}`);
      }
    } catch (err: any) {
      setTestState('fail');
      setTestMessage(err.message ?? 'Network error');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-10 pb-20">

      {/* ── General ──────────────────────────────────────────────────────── */}
      <section>
        <Rule />
        <div className="py-6">
          <SectionHead
            title="General"
            description="Basic identity information shown across the site"
          />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Site title"
                value={value.siteTitle ?? ''}
                onChange={v => set({ siteTitle: v })}
                placeholder="Arden Bouet"
              />
              <TextField
                label="Tagline"
                value={value.siteTagline ?? ''}
                onChange={v => set({ siteTagline: v })}
                placeholder="Full-stack engineer & designer"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Contact email"
                value={value.contactEmail ?? ''}
                onChange={v => set({ contactEmail: v })}
                placeholder="hello@example.com"
              />
              <TextField
                label="Phone"
                value={value.contactPhone ?? ''}
                onChange={v => set({ contactPhone: v })}
                placeholder="+1 234 567 8901"
              />
            </div>
            <TextField
              label="Location"
              value={value.location ?? ''}
              onChange={v => set({ location: v })}
              placeholder="Nairobi, Kenya"
            />
          </div>
        </div>
      </section>

      {/* ── Social ───────────────────────────────────────────────────────── */}
      <section>
        <Rule />
        <div className="py-6">
          <SectionHead
            title="Social"
            description="Handles or full URLs — used in the site footer and meta tags"
          />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="GitHub"
                value={value.github ?? ''}
                onChange={v => set({ github: v })}
                placeholder="https://github.com/yourhandle"
              />
              <TextField
                label="LinkedIn"
                value={value.linkedin ?? ''}
                onChange={v => set({ linkedin: v })}
                placeholder="https://linkedin.com/in/yourhandle"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Twitter / X"
                value={value.twitter ?? ''}
                onChange={v => set({ twitter: v })}
                placeholder="https://x.com/yourhandle"
              />
              <TextField
                label="Instagram"
                value={value.instagram ?? ''}
                onChange={v => set({ instagram: v })}
                placeholder="https://instagram.com/yourhandle"
              />
            </div>
            <TextField
              label="YouTube"
              value={value.youtube ?? ''}
              onChange={v => set({ youtube: v })}
              placeholder="https://youtube.com/@yourchannel"
            />
          </div>
        </div>
      </section>

      {/* ── Media / Storage ──────────────────────────────────────────────── */}
      <section>
        <Rule />
        <div className="py-6">
          <SectionHead
            title="Media Storage"
            description="Cloudflare R2 credentials for the media library — environment variables take precedence over these values"
          />

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <TextField
                label="Account ID"
                value={value.r2AccountId ?? ''}
                onChange={v => set({ r2AccountId: v })}
                placeholder="abc123def456…"
              />
              <TextField
                label="Bucket name"
                value={value.r2BucketName ?? ''}
                onChange={v => set({ r2BucketName: v })}
                placeholder="my-media-bucket"
              />
            </div>

            <TextField
              label="Public URL"
              value={value.r2PublicUrl ?? ''}
              onChange={v => set({ r2PublicUrl: v })}
              placeholder="https://pub-xxxx.r2.dev"
              hint="The public base URL for your bucket (no trailing slash)"
            />

            <SecretField
              label="Access Key ID"
              value={value.r2AccessKeyId ?? ''}
              onChange={v => set({ r2AccessKeyId: v })}
              placeholder="R2 access key ID"
            />
            <SecretField
              label="Secret Access Key"
              value={value.r2SecretAccessKey ?? ''}
              onChange={v => set({ r2SecretAccessKey: v })}
              placeholder="R2 secret access key"
            />

            {/* CORS reminder */}
            <div className="border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-2">
                Required CORS rule (Cloudflare dashboard → R2 → Bucket → Settings)
              </p>
              <pre className="font-mono text-[10px] text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
{`[{
  "AllowedOrigins": ["https://yourdomain.com", "http://localhost:3000"],
  "AllowedMethods": ["PUT", "GET"],
  "AllowedHeaders": ["Content-Type"],
  "MaxAgeSeconds": 3600
}]`}
              </pre>
            </div>

            {/* Test connection */}
            <div className="flex items-center gap-4">
              <Button variant="secondary" onClick={testConnection} disabled={testState === 'testing'}>
                Test connection
              </Button>
              <ConnectionBadge state={testState} message={testMessage} />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
