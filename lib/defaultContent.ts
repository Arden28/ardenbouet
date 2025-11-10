// Keep this small-ish; you can move big blobs to JSON if you prefer.
export type ContentBundle = {
  projects: any[]; experiences: any[]; journey: any[]; notes: any[];
};

const uid = () => Math.random().toString(36).slice(2, 10);

// SEED, unchanged (trimmed here for brevity)
export const DEFAULT_CONTENT: ContentBundle = {
  projects: [
    {
      id: uid(),
      title: 'Auprea Heritage for everyone',
      description: 'Wealth manager with secure vault, PDF declarations, and an optional notary flow.',
      logoUrl: '/images/auprea.ico',
      url: '',
      tags: ['saas', 'client'],
      tech: ['Next.js', 'Laravel APIs', 'PDF'],
      metric: 'Net worth in minutes',
      caseFile: {
        problem: 'Users tracked assets in spreadsheets without a unified net-worth view or safe document storage.',
        approach: [
          'Domain model for assets/liabilities; secure doc vault w/ role-based access',
          'Server-generated PDF declarations; optional notarization workflow',
          'Performance budget for dashboard—<150ms TTFB on cached pages',
        ],
        result: 'Single source of truth; faster onboarding; exportable declarations that are legally tidy.',
        images: [
          { src: '/case/auprea-dashboard.jpg', alt: 'Auprea dashboard' },
          { src: '/case/auprea-vault.jpg', alt: 'Auprea document vault' },
        ],
        tags: ['saas', 'finance'],
        tech: ['Next.js', 'Laravel', 'MySQL', 'S3'],
      },
    },
  ],
  experiences: [
    {
      id: uid(),
      title: 'Banking API Integration',
      job: 'Financial Software Engineer',
      fromTo: 'Sept. 2024 ~ Mar 2025 · 7 months',
      bullets: [
        'Built Laravel API integrating bank transactions',
        'Livewire-powered financial reporting and reconciliation',
      ],
      type: 'Freelance',
    },
  ],
  journey: [
    {
      id: uid(),
      kind: 'education',
      year: '2024 ~ Present',
      title: 'Bachelor’s – Software Engineering / Computer Science (Ongoing)',
      org: 'KeMU',
      url: 'https://www.kemu.ac.ke/',
      note: 'Systems design, cloud, AI, security',
    },
    {
      id: uid(),
      kind: 'cert',
      year: '2024',
      title: 'Hosting & Server Management (cPanel Certified)',
      org: 'cPanel University',
      url: 'https://university.cpanel.net/',
    },
  ],
  notes: [
    {
      id: uid(),
      slug: 'shipping-saas-like-an-ops-team',
      title: 'Shipping SaaS like an ops team',
      excerpt: 'Treat features like on-call: runbooks, budgets, dashboards first—then UI.',
      cover: '/blog/ops-saas.jpg',
      date: '2025-07-20',
      reading: '6 min',
      tags: ['saaS', 'process', 'devops'],
    },
  ],
};
