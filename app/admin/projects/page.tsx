'use client';
// /admin/projects — portfolio projects + case studies (EN/FR)
import { Suspense } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { CollectionManager, type FieldDef } from '@/components/admin/collection/CollectionManager';
import type { Project } from '@/app/admin/types';
import '@/app/blog/story.css';

const TAGS = [{ value: 'saas', label: 'SaaS' }, { value: 'client', label: 'Client' }, { value: 'open-source', label: 'Open source' }, { value: 'mobile', label: 'Mobile' }, { value: 'job', label: 'Job role' }];

const schema: FieldDef[] = [
  { type: 'text', path: 'title', label: 'Title', translatable: true },
  { type: 'textarea', path: 'description', label: 'Short description', hint: 'One or two sentences shown on the home page.', translatable: true },
  { type: 'media', path: 'logoUrl', label: 'Logo', accept: 'image/*', aspect: '1/1', half: true },
  { type: 'text', path: 'metric', label: 'Headline result', hint: 'e.g. “Net worth in minutes”', translatable: true, half: true },
  { type: 'url', path: 'url', label: 'Live URL', placeholder: 'https://', half: true },
  { type: 'select', path: 'language', label: 'Primary language', half: true, options: [{ value: 'both', label: 'Both' }, { value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }] },
  { type: 'tags', path: 'tags', label: 'Categories', hint: TAGS.map(t => t.value).join(', '), suggestions: TAGS.map(t => t.value) },
  { type: 'tags', path: 'tech', label: 'Tech stack', suggestions: ['Next.js', 'React', 'Laravel', 'Spring Boot', 'PostgreSQL', 'PostGIS', 'Redis', 'TypeScript', 'React Native', 'Stripe'] },
  { type: 'section', path: '_case', label: 'Case study' },
  { type: 'textarea', path: 'caseFile.problem', label: 'The brief / problem', translatable: true },
  { type: 'list', path: 'caseFile.approach', label: 'Approach (steps)', placeholder: 'Add a step', multiline: true, translatable: true },
  { type: 'textarea', path: 'caseFile.result', label: 'Result', translatable: true },
  { type: 'objects', path: 'caseFile.images', label: 'Gallery (images or videos)', addLabel: 'Add media', summary: o => String(o.alt || o.src || ''),
    fields: [{ type: 'media', path: 'src', label: 'File', accept: 'image/*,video/*' }, { type: 'text', path: 'alt', label: 'Caption / alt text' }] },
];

export default function ProjectsPage() {
  return (
    <AdminShell title="Projects">
      <Suspense>
        <CollectionManager<Project & { id: string }>
          section="projects"
          title="Projects"
          singular="project"
          description="Shown in “Selected work” on the home page, each with its own case-study page. Drag order = display order."
          schema={schema}
          newItem={() => ({ id: Math.random().toString(36).slice(2, 10), title: '', description: '', logoUrl: '', url: '', tags: [], tech: [], language: 'both', caseFile: { problem: '', approach: [], result: '', images: [] } } as Project)}
          card={p => ({
            title: p.title, subtitle: p.description, image: p.caseFile?.images?.find(i => !/\.(mp4|webm|mov)/i.test(i.src))?.src || p.logoUrl,
            badges: [...(p.tags ?? []).map(t => ({ label: TAGS.find(x => x.value === t)?.label ?? t })), ...(p.caseFile?.problem ? [{ label: 'Case study', tone: 'green' as const }] : [])],
            meta: p.metric,
          })}
          previewHref={p => `/projects/${p.id}`}
          extraFilters={TAGS.map(t => ({ key: t.value, label: t.label, test: (p: Project) => (p.tags ?? []).includes(t.value as Project['tags'][number]) }))}
        />
      </Suspense>
    </AdminShell>
  );
}
