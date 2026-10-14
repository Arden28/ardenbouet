'use client';
// /admin/journey — education & certifications (EN/FR)
import { Suspense } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { CollectionManager, type FieldDef } from '@/components/admin/collection/CollectionManager';
import type { JourneyItem } from '@/app/admin/types';
import '@/app/blog/story.css';

const schema: FieldDef[] = [
  { type: 'select', path: 'kind', label: 'Type', half: true, options: [{ value: 'education', label: 'Education' }, { value: 'cert', label: 'Certification' }] },
  { type: 'text', path: 'year', label: 'Year', half: true },
  { type: 'text', path: 'title', label: 'Title', translatable: true },
  { type: 'text', path: 'org', label: 'Institution / issuer', translatable: true, half: true },
  { type: 'url', path: 'url', label: 'Credential URL', placeholder: 'https://', half: true },
  { type: 'textarea', path: 'note', label: 'Note', translatable: true },
  { type: 'select', path: 'language', label: 'Primary language', half: true, options: [{ value: 'both', label: 'Both' }, { value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }] },
];

export default function JourneyPage() {
  return (
    <AdminShell title="Education & certifications">
      <Suspense>
        <CollectionManager<JourneyItem>
          section="journey"
          title="Education & certifications"
          singular="entry"
          schema={schema}
          newItem={() => ({ id: Math.random().toString(36).slice(2, 10), kind: 'cert', year: String(new Date().getFullYear()), title: '', language: 'both' })}
          card={j => ({ title: j.title, subtitle: [j.org, j.year].filter(Boolean).join(' · '), badges: [{ label: j.kind === 'cert' ? 'Certification' : 'Education', tone: j.kind === 'cert' ? 'blue' : 'neutral' }] })}
          extraFilters={[{ key: 'education', label: 'Education', test: j => j.kind === 'education' }, { key: 'cert', label: 'Certifications', test: j => j.kind === 'cert' }]}
        />
      </Suspense>
    </AdminShell>
  );
}
