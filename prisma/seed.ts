// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// same uid helper you used in the UI
const uid = () => Math.random().toString(36).slice(2, 10);

const SEED = {
  projects: [
    {
      id: uid(),
      title: 'Auprea — Heritage for everyone',
      description: 'Wealth manager with secure vault, PDF declarations, and an optional notary flow.',
      logoUrl: '/images/auprea.ico',
      url: 'https://patrimoine-manager.vercel.app/',
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
      logline: 'Unified company data behind a small REST layer with quotas and consumer controls.',
      outcomes: ['Research hours collapsed to minutes'],
      tags: ['Laravel', 'Sanctum', 'Python'],
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
} as const;

async function main() {
  // Upsert the single Content row
  await prisma.content.upsert({
    where: { id: 1 },
    update: { data: SEED },
    create: { id: 1, data: SEED },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
