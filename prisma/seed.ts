// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const uid = () => Math.random().toString(36).slice(2, 10);

const SEED = {
  projects: [
    {
      id: uid(),
      language: 'en',
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
      language: 'en',
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
      language: 'en',
      kind: 'education',
      year: '2024 ~ Present',
      title: 'Bachelor’s – Software Engineering / Computer Science (Ongoing)',
      org: 'KeMU',
      url: 'https://www.kemu.ac.ke/',
      note: 'Systems design, cloud, AI, security',
    },
    {
      id: uid(),
      language: 'en',
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
      language: 'en',
      slug: 'shipping-saas-like-an-ops-team',
      title: 'Shipping SaaS like an ops team',
      excerpt: 'Treat features like on-call: runbooks, budgets, dashboards first—then UI.',
      cover: '/blog/ops-saas.jpg',
      date: '2025-07-20',
      reading: '6 min',
      tags: ['saaS', 'process', 'devops'],
    },
  ],
  products: [
    // ── Digital platforms ──────────────────────────────────────────────────────
    {
      id: 'prod_saas_01',
      language: 'en',
      slug: 'saas-starter-kit',
      title: 'SaaS Starter Kit',
      tagline: 'Full-stack Next.js 14 boilerplate with auth, billing, and dashboard.',
      description:
        'Production-ready Next.js 14 starter with Prisma, Stripe, NextAuth, Tailwind CSS, and a pre-built admin dashboard. Skip the setup — ship in days, not weeks. Every config decision is already made so you can focus on your product.',
      category: 'platform',
      price: 149,
      currency: 'USD',
      priceLabel: '$149',
      status: 'published',
      features: [
        'Next.js 14 App Router with server actions',
        'Prisma + PostgreSQL schema, fully typed',
        'Stripe subscription billing (monthly & annual)',
        'NextAuth with Google & email magic link',
        'Pre-built admin dashboard with role gating',
        'Dark mode + Tailwind CSS design system',
        'Lifetime updates included',
      ],
      tags: ['Next.js', 'Prisma', 'Stripe', 'TypeScript'],
      cover: '/images/shop/saas-starter.jpg',
      demoUrl: 'https://demo.ardenb.dev/saas-starter',
      buyUrl: 'https://ardenb.lemonsqueezy.com/buy/saas-starter',
      media: [
        {
          url: '/images/shop/saas-starter-dashboard.jpg',
          kind: 'image',
          label: 'Admin dashboard',
          description: 'Pre-built admin panel with role gating and analytics overview.',
        },
        {
          url: '/images/shop/saas-starter-billing.jpg',
          kind: 'image',
          label: 'Billing page',
          description: 'Stripe subscription flow with plan selection and invoice history.',
        },
        {
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          kind: 'video',
          label: 'Walkthrough video',
          description: '5-minute tour of the full starter — auth, billing, and dashboard.',
        },
      ],
    },
    // ── Apps ──────────────────────────────────────────────────────────────────
    {
      id: 'prod_iot_01',
      language: 'en',
      slug: 'iot-dashboard-template',
      title: 'IoT Dashboard Template',
      tagline: 'Real-time telemetry UI for device fleets.',
      description:
        'A Next.js + Recharts dashboard template built for IoT and telemetry use-cases. Plug in any WebSocket source and get live charts, device status tables, and configurable alert thresholds out of the box.',
      category: 'app',
      price: 49,
      currency: 'USD',
      priceLabel: '$49',
      status: 'published',
      features: [
        'Live line & gauge charts (Recharts)',
        'Device status & alert table with sorting',
        'WebSocket data layer stub (plug in any source)',
        'Responsive dark-mode layout',
        'Configurable alert thresholds',
        'TypeScript + Tailwind CSS throughout',
      ],
      tags: ['IoT', 'Recharts', 'WebSocket', 'React'],
      cover: '/images/shop/iot-dashboard.jpg',
      demoUrl: 'https://demo.ardenb.dev/iot-dashboard',
      buyUrl: 'https://ardenb.lemonsqueezy.com/buy/iot-dashboard',
      media: [
        {
          url: '/images/shop/iot-live-charts.jpg',
          kind: 'image',
          label: 'Live telemetry charts',
          description: 'Real-time line and gauge charts updating via WebSocket.',
        },
        {
          url: 'https://www.loom.com/share/iot-demo',
          kind: 'video',
          label: 'Device monitoring demo',
          description: 'See alert thresholds trigger and device status update in real time.',
        },
      ],
    },
    {
      id: 'prod_finance_01',
      language: 'en',
      slug: 'finance-dashboard-template',
      title: 'Finance Dashboard',
      tagline: 'Beautiful financial reporting UI for SaaS and fintech apps.',
      description:
        'A polished Next.js dashboard for financial apps. Ships with P&L charts, multi-account overview, transaction tables, and period comparisons. Dark mode and CSV export included.',
      category: 'app',
      price: 69,
      currency: 'USD',
      priceLabel: '$69',
      status: 'published',
      features: [
        'Revenue & expense breakdown charts',
        'Multi-account overview panel',
        'Transaction table with search and filters',
        'P&L summary with period comparisons',
        'CSV / PDF export ready',
        'Dark mode + Tailwind CSS',
      ],
      tags: ['Finance', 'Dashboard', 'React', 'Recharts'],
      cover: '/images/shop/finance-dashboard.jpg',
      demoUrl: 'https://demo.ardenb.dev/finance-dashboard',
      buyUrl: 'https://ardenb.lemonsqueezy.com/buy/finance-dashboard',
    },
    // ── Documents ─────────────────────────────────────────────────────────────
    {
      id: 'prod_api_guide_01',
      language: 'en',
      slug: 'api-integration-guide',
      title: 'API Integration Playbook',
      tagline: 'Patterns and recipes for robust third-party API integrations.',
      description:
        'A practical guide covering retry logic, webhook handling, rate-limit strategies, OAuth flows, and error budgeting — drawn from real production integrations. 60+ pages of battle-tested patterns with full TypeScript examples.',
      category: 'document',
      price: 29,
      currency: 'USD',
      priceLabel: '$29',
      status: 'published',
      features: [
        '60+ pages of battle-tested patterns',
        'Retry & circuit-breaker recipes',
        'Webhook validation & idempotency',
        'OAuth 2.0 flows with full code samples',
        'Rate-limit budgeting strategies',
        'TypeScript type patterns throughout',
      ],
      tags: ['API', 'TypeScript', 'Patterns', 'DevOps'],
      cover: '/images/shop/api-guide.jpg',
      buyUrl: 'https://ardenb.lemonsqueezy.com/buy/api-integration-guide',
    },
    // ── Services ──────────────────────────────────────────────────────────────
    {
      id: 'svc_deployment_01',
      language: 'en',
      slug: 'production-deployment',
      title: 'Production Deployment',
      tagline: 'From local to live — properly, securely, and fast.',
      description:
        'End-to-end deployment of any web application to a cloud provider of your choice. Includes SSL, CI/CD pipeline via GitHub Actions, environment management, database provisioning, and a post-launch health check. Delivered in 3–5 business days.',
      category: 'service',
      price: 799,
      currency: 'USD',
      priceLabel: '$799 flat',
      status: 'published',
      features: [
        'Cloud server setup (AWS, GCP, DigitalOcean, or Hetzner)',
        'SSL certificate + custom domain configuration',
        'CI/CD pipeline via GitHub Actions',
        'Environment variable & secrets management',
        'Database provisioning & automated backups',
        '30-day post-launch async support window',
      ],
      tags: ['DevOps', 'Cloud', 'CI/CD'],
      buyUrl: 'https://cal.com/ardenb/production-deployment',
    },
    {
      id: 'svc_audit_01',
      language: 'en',
      slug: 'performance-audit',
      title: 'Performance Audit',
      tagline: 'Find exactly what is making your app slow — with a clear fix plan.',
      description:
        'A deep-dive into your Next.js or Laravel application’s performance. I profile database queries, API latency, frontend bundle size, and server response times, then deliver a prioritized remediation report with impact estimates.',
      category: 'service',
      price: 299,
      currency: 'USD',
      priceLabel: '$299 flat',
      status: 'published',
      features: [
        'Database query profiling (N+1 detection, slow queries)',
        'API latency analysis with waterfall breakdown',
        'Frontend bundle analysis (dead code, render-blocking)',
        'Core Web Vitals audit with Lighthouse',
        'Prioritized fix list ranked by impact and effort',
        'Optional: implementation of the top 3 highest-impact fixes',
      ],
      tags: ['Performance', 'Next.js', 'Laravel', 'SQL'],
      buyUrl: 'https://cal.com/ardenb/performance-audit',
      media: [
        {
          url: '/images/shop/perf-audit-report.jpg',
          kind: 'image',
          label: 'Sample audit report',
          description: 'Excerpt from a real report showing query profiling and fix rankings.',
        },
      ],
    },
    {
      id: 'svc_arch_01',
      language: 'en',
      slug: 'architecture-consultation',
      title: 'Architecture Consultation',
      tagline: 'One focused session to get your technical decisions right.',
      description:
        'A 90-minute deep-dive to plan, review, or de-risk your system design. Ideal for scaling a SaaS, choosing between stacks, designing an API contract, or reviewing your data model before you build.',
      category: 'service',
      price: 199,
      currency: 'USD',
      priceLabel: '$199 / session',
      status: 'published',
      features: [
        '90-minute video call (recording provided)',
        'Architecture diagram or data model review',
        'Written summary of decisions and recommendations',
        'Tool and library suggestions with rationale',
        '7-day async follow-up window for questions',
      ],
      tags: ['Architecture', 'SaaS', 'API Design', 'Database'],
      buyUrl: 'https://cal.com/ardenb/architecture-consultation',
    },
    {
      id: 'svc_mvp_01',
      language: 'en',
      slug: 'saas-mvp-build',
      title: 'SaaS MVP Build',
      tagline: 'Validate your idea with a production-grade MVP — in 4 weeks.',
      description:
        'Full-stack development of a scoped SaaS MVP: auth, payments, core workflow, and production deployment. Built on Next.js + Prisma (or Supabase). Scope is locked at kickoff so timelines hold. You own the source code outright.',
      category: 'service',
      price: 4999,
      currency: 'USD',
      priceLabel: 'From $4,999',
      status: 'published',
      features: [
        'Authentication (email + social OAuth)',
        'Stripe subscription billing (monthly & annual)',
        'Core product feature (scoped and locked at kickoff)',
        'Admin dashboard with basic analytics',
        'Production deployment with CI/CD',
        'Full source code ownership (MIT license)',
        '30-day post-launch async support window',
      ],
      tags: ['Next.js', 'SaaS', 'Full-stack', 'Stripe'],
      buyUrl: 'https://cal.com/ardenb/saas-mvp-build',
    },
  ],
};

const SAMPLE_ORDERS = [
  {
    id: 'ord_seed_001',
    customerName: 'James Okonkwo',
    customerEmail: 'j.okonkwo@outlook.com',
    productId: 'prod_saas_01',
    productTitle: 'SaaS Starter Kit',
    status: 'PAID' as const,
    amount: 149,
    currency: 'USD',
    stripeId: 'pi_3Qm8Xs2eZvKYlo2C001',
    notes: null,
    createdAt: new Date('2025-04-12T14:32:00Z'),
  },
  {
    id: 'ord_seed_002',
    customerName: 'Sophie Dupont',
    customerEmail: 'sophie.dupont@gmail.com',
    productId: 'svc_audit_01',
    productTitle: 'Performance Audit',
    status: 'PAID' as const,
    amount: 299,
    currency: 'USD',
    stripeId: 'pi_3Qm8Xs2eZvKYlo2C002',
    notes: 'Next.js e-commerce app. Primary concern: checkout funnel latency.',
    createdAt: new Date('2025-04-20T09:15:00Z'),
  },
  {
    id: 'ord_seed_003',
    customerName: 'Kwame Asante',
    customerEmail: 'kwame@asante.io',
    productId: 'svc_mvp_01',
    productTitle: 'SaaS MVP Build',
    status: 'PAID' as const,
    amount: 4999,
    currency: 'USD',
    stripeId: 'pi_3Qm8Xs2eZvKYlo2C003',
    notes: 'B2B scheduling tool for healthcare. Auth + calendar integration + Stripe.',
    createdAt: new Date('2025-05-01T16:45:00Z'),
  },
  {
    id: 'ord_seed_004',
    customerName: 'Layla Hassan',
    customerEmail: 'layla.hassan@proton.me',
    productId: 'prod_api_guide_01',
    productTitle: 'API Integration Playbook',
    status: 'PENDING' as const,
    amount: 29,
    currency: 'USD',
    stripeId: null,
    notes: null,
    createdAt: new Date('2025-05-10T11:00:00Z'),
  },
  {
    id: 'ord_seed_005',
    customerName: 'Marc Lefevre',
    customerEmail: 'marc@lefevre.dev',
    productId: 'svc_deployment_01',
    productTitle: 'Production Deployment',
    status: 'PAID' as const,
    amount: 799,
    currency: 'USD',
    stripeId: 'pi_3Qm8Xs2eZvKYlo2C005',
    notes: 'Laravel app + Next.js frontend. Deploy to Hetzner. PostgreSQL.',
    createdAt: new Date('2025-05-08T08:30:00Z'),
  },
  {
    id: 'ord_seed_006',
    customerName: 'Aisha Ndiaye',
    customerEmail: 'aisha.ndiaye@gmail.com',
    productId: 'prod_iot_01',
    productTitle: 'IoT Dashboard Template',
    status: 'PENDING' as const,
    amount: 49,
    currency: 'USD',
    stripeId: null,
    notes: null,
    createdAt: new Date('2025-05-12T20:15:00Z'),
  },
];

async function main() {
  await prisma.content.upsert({
    where: { id: 1 },
    update: { data: SEED as object },
    create: { id: 1, data: SEED as object },
  });

  await prisma.order.createMany({
    data: SAMPLE_ORDERS,
    skipDuplicates: true,
  });

  console.log('Seed complete.');
  console.log(`  Content row: upserted`);
  console.log(`  Orders: up to ${SAMPLE_ORDERS.length} created (skipping duplicates)`);
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
