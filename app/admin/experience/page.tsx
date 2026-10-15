'use client';
// /admin/experience — career timeline (EN/FR)
import { Suspense } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { CollectionManager, type FieldDef } from '@/components/admin/collection/CollectionManager';
import type { Experience } from '@/app/admin/types';
import '@/app/blog/story.css';

const schema: FieldDef[] = [
  { type: 'text', path: 'job', label: 'Role', placeholder: 'Senior Software Engineer', translatable: true, half: true },
  { type: 'text', path: 'title', label: 'Company / project', translatable: true, half: true },
  { type: 'text', path: 'fromTo', label: 'Period', placeholder: 'Sept 2024 – Mar 2025', translatable: true, half: true },
  { type: 'select', path: 'type', label: 'Type', half: true, options: ['Full-time', 'Contract', 'Freelance', 'Part-time', 'Intern'].map(v => ({ value: v, label: v })) },
  { type: 'select', path: 'location', label: 'Work mode', half: true, options: [{ value: '', label: '' }, { value: 'Remote', label: 'Remote' }, { value: 'Hybrid', label: 'Hybrid' }, { value: 'On-site', label: 'On-site' }] },
  { type: 'select', path: 'language', label: 'Primary language', half: true, options: [{ value: 'both', label: 'Both' }, { value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }] },
  { type: 'textarea', path: 'logline', label: 'One-line summary', translatable: true },
  { type: 'list', path: 'outcomes', label: 'Outcomes (shown first)', placeholder: 'Add an outcome', translatable: true },
  { type: 'list', path: 'bullets', label: 'Responsibilities', placeholder: 'Add a responsibility', translatable: true },
  { type: 'tags', path: 'tags', label: 'Skills / tech' },
  { type: 'media', path: 'poster', label: 'Cover image', hint: 'Wide image at the top of the detail page.', accept: 'image/*' },
  { type: 'section', path: '_detail', label: 'Detail page' },
  { type: 'media', path: 'logoUrl', label: 'Company logo', accept: 'image/*', aspect: '1/1', half: true },
  { type: 'url', path: 'companyUrl', label: 'Company website', placeholder: 'https://', half: true },
  { type: 'text', path: 'place', label: 'City / country', placeholder: 'Nairobi, Kenya', translatable: true, half: true },
  { type: 'text', path: 'startDate', label: 'Started', placeholder: '2024-09', hint: 'YYYY-MM, for the duration and the career timeline', half: true },
  { type: 'text', path: 'endDate', label: 'Ended', placeholder: '2025-03', hint: 'YYYY-MM, leave empty if you still work there', half: true },
  { type: 'markdown', path: 'story', label: 'The full story', hint: 'Markdown. What the company does, your role, the context, the hard parts, what you learned.', translatable: true },
  { type: 'objects', path: 'gallery', label: 'Gallery (images or videos)', addLabel: 'Add media', summary: o => String(o.alt || o.src || ''),
    fields: [{ type: 'media', path: 'src', label: 'File', accept: 'image/*,video/*' }, { type: 'text', path: 'alt', label: 'Caption / alt text' }] },
];

export default function ExperiencePage() {
  return (
    <AdminShell title="Experience">
      <Suspense>
        <CollectionManager<Experience>
          section="experiences"
          title="Experience"
          singular="role"
          description="The timeline on the home page, each with its own detail page. Order = display order (most recent first). Link projects to a role from the Projects page."
          schema={schema}
          newItem={() => ({ id: Math.random().toString(36).slice(2, 10), title: '', job: '', fromTo: '', bullets: [], outcomes: [], tags: [], type: 'Full-time', language: 'both' })}
          card={e => ({ title: e.job || e.title, subtitle: `${e.title}${e.fromTo ? ` · ${e.fromTo}` : ''}`, image: e.poster, badges: [{ label: e.type }, ...(e.location ? [{ label: e.location }] : [])] })}
          previewHref={e => `/experience/${e.id}`}
        />
      </Suspense>
    </AdminShell>
  );
}
