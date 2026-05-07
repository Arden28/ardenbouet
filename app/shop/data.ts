// shop/data.ts

// ─── Product type (digital goods) ───────────────────────────────────────────
export type Product = {
  category: 'product';
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  cover?: string;
  tags: string[];
  /** Shown in the quick-look hover overlay on the index card */
  stack?: string[];
  status: 'available' | 'coming-soon';
  type: 'template' | 'component' | 'boilerplate' | 'guide';
  demoUrl?: string;
  buyUrl?: string;
  features: string[];
};

// ─── Service type (bespoke engagements) ─────────────────────────────────────
export type Service = {
  category: 'service';
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  /** Display label — e.g. "From $4,999", "$199 / session" */
  priceLabel: string;
  cover?: string;
  tags: string[];
  status: 'available' | 'coming-soon';
  type: 'deployment' | 'optimization' | 'consulting' | 'build';
  /** 3-line preview shown on hover in the index list */
  deliverables: string[];
  /** Numbered steps shown on the detail page */
  process: { step: string; detail: string }[];
  duration: string;
  bookUrl?: string;
};

export type ShopItem = Product | Service;

// ─── Products ─────────────────────────────────────────────────────────────────
export const PRODUCTS: Product[] = [
  {
    category: 'product',
    slug: 'saas-starter-kit',
    name: 'SaaS Starter Kit',
    tagline: 'Full-stack Next.js boilerplate with auth, billing, and dashboard.',
    description:
      'Production-ready Next.js 14 starter with Prisma, Stripe, Next Auth, Tailwind CSS, and a pre-built admin dashboard. Skip the setup — ship in days, not weeks.',
    price: 79,
    cover: '/images/shop/saas-starter.jpg',
    tags: ['Next.js', 'Prisma', 'Stripe', 'TypeScript'],
    stack: ['Next.js 14', 'Prisma', 'PostgreSQL', 'Stripe', 'Tailwind'],
    status: 'coming-soon',
    type: 'boilerplate',
    features: [
      'Next.js 14 App Router with server actions',
      'Prisma + PostgreSQL schema, fully typed',
      'Stripe subscription billing (monthly & annual)',
      'Next Auth with Google & email magic link',
      'Pre-built admin dashboard with role gating',
      'Dark mode + Tailwind CSS design system',
      'Lifetime updates included',
    ],
  },
  {
    category: 'product',
    slug: 'api-integration-guide',
    name: 'API Integration Playbook',
    tagline: 'Patterns and recipes for robust third-party API integrations.',
    description:
      'A practical guide covering retry logic, webhook handling, rate-limit strategies, OAuth flows, and error budgeting — drawn from real production integrations.',
    price: 29,
    cover: '/images/shop/api-guide.jpg',
    tags: ['API', 'TypeScript', 'Patterns', 'DevOps'],
    stack: ['TypeScript', 'Node.js', 'REST', 'OAuth 2.0', 'Webhooks'],
    status: 'coming-soon',
    type: 'guide',
    features: [
      '60+ pages of battle-tested patterns',
      'Retry & circuit-breaker recipes',
      'Webhook validation & idempotency',
      'OAuth 2.0 flows with full code samples',
      'Rate-limit budgeting strategies',
      'TypeScript type patterns throughout',
    ],
  },
  {
    category: 'product',
    slug: 'iot-dashboard-template',
    name: 'IoT Dashboard Template',
    tagline: 'Real-time telemetry UI for device fleets.',
    description:
      'A Next.js + Recharts dashboard template built for IoT and telemetry use-cases. Includes live chart components, device status tables, and a WebSocket data layer.',
    price: 49,
    cover: '/images/shop/iot-dashboard.jpg',
    tags: ['IoT', 'Recharts', 'WebSocket', 'React'],
    stack: ['Next.js', 'Recharts', 'WebSocket', 'Tailwind CSS', 'TypeScript'],
    status: 'coming-soon',
    type: 'template',
    features: [
      'Live line & gauge charts (Recharts)',
      'Device status & alert table with sorting',
      'WebSocket data layer stub (plug in any source)',
      'Responsive dark-mode layout',
      'Configurable alert thresholds',
      'TypeScript + Tailwind CSS throughout',
    ],
  },
];

// ─── Services ─────────────────────────────────────────────────────────────────
export const SERVICES: Service[] = [
  {
    category: 'service',
    slug: 'production-deployment',
    name: 'Production Deployment',
    tagline: 'From local to live — properly, securely, and fast.',
    description:
      'End-to-end deployment of any web application to a cloud provider of your choice. Includes SSL, CI/CD pipeline, environment management, and a post-launch health check.',
    price: 799,
    priceLabel: '$799 flat',
    tags: ['DevOps', 'Cloud', 'CI/CD'],
    status: 'available',
    type: 'deployment',
    duration: '3–5 business days',
    deliverables: [
      'Cloud server setup (AWS, GCP, DigitalOcean, or Hetzner)',
      'SSL certificate + custom domain configuration',
      'CI/CD pipeline via GitHub Actions',
      'Environment variable & secrets management',
      'Database provisioning & automated backups',
      '30-day post-launch async support window',
    ],
    process: [
      {
        step: 'Discovery',
        detail:
          'We scope the stack, environment requirements, and target infrastructure in a 30-min async brief.',
      },
      {
        step: 'Setup',
        detail:
          'I provision the server, configure DNS, set up CI/CD, wire the secrets, and test the pipeline.',
      },
      {
        step: 'Deployment',
        detail:
          'The app goes live. I run a full health check, performance baseline, and confirm all endpoints.',
      },
      {
        step: 'Handoff',
        detail:
          'You receive a runbook, full credentials, and 30 days of async support for questions or issues.',
      },
    ],
  },
  {
    category: 'service',
    slug: 'performance-audit',
    name: 'Performance Audit',
    tagline: 'Find exactly what is making your app slow — with a clear fix plan.',
    description:
      'A deep-dive into your Next.js or Laravel application\'s performance. I profile database queries, API latency, frontend bundle size, and server response times, then deliver a prioritized remediation report.',
    price: 299,
    priceLabel: '$299 flat',
    tags: ['Performance', 'Next.js', 'Laravel', 'SQL'],
    status: 'available',
    type: 'optimization',
    duration: '2–3 business days',
    deliverables: [
      'Database query profiling (N+1 detection, slow queries)',
      'API latency analysis with waterfall breakdown',
      'Frontend bundle analysis (dead code, render-blocking)',
      'Core Web Vitals audit with Lighthouse',
      'Prioritized fix list ranked by impact and effort',
      'Optional: implementation of the top 3 highest-impact fixes',
    ],
    process: [
      {
        step: 'Access',
        detail:
          'You grant read access to the codebase and a staging or production environment.',
      },
      {
        step: 'Profiling',
        detail:
          'I run automated and manual profiling across the database, API, and frontend layers.',
      },
      {
        step: 'Report',
        detail:
          'You receive a detailed report with findings grouped by layer and ranked by expected impact.',
      },
      {
        step: 'Walkthrough',
        detail:
          'A 60-min call to walk through findings, prioritize fixes, and answer any questions.',
      },
    ],
  },
  {
    category: 'service',
    slug: 'architecture-consultation',
    name: 'Architecture Consultation',
    tagline: 'One focused session to get your technical decisions right.',
    description:
      'A 90-minute deep-dive to plan, review, or de-risk your system design. Ideal for: scaling a SaaS, choosing between stacks, designing an API contract, or reviewing your data model before you build.',
    price: 199,
    priceLabel: '$199 / session',
    tags: ['Architecture', 'SaaS', 'API Design', 'Database'],
    status: 'available',
    type: 'consulting',
    duration: '90 minutes',
    deliverables: [
      '90-minute video call (recording provided)',
      'Architecture diagram or data model review',
      'Written summary of decisions and recommendations',
      'Tool and library suggestions with rationale',
      '7-day async follow-up window for questions',
    ],
    process: [
      {
        step: 'Brief',
        detail:
          'You fill out a short async form covering your stack, current bottlenecks, and key questions.',
      },
      {
        step: 'Session',
        detail:
          'We meet for 90 minutes. I ask, challenge, draw, and help you work through the design live.',
      },
      {
        step: 'Summary',
        detail:
          'I deliver a written summary with decisions, diagrams, and actionable next steps within 24h.',
      },
    ],
  },
  {
    category: 'service',
    slug: 'saas-mvp-build',
    name: 'SaaS MVP Build',
    tagline: 'Validate your idea with a production-grade MVP — in 4 weeks.',
    description:
      'Full-stack development of a scoped SaaS MVP: auth, payments, core workflow, and production deployment. Built on Next.js + Supabase (or Prisma). Scope is fixed at kickoff so timelines hold.',
    price: 4999,
    priceLabel: 'From $4,999',
    tags: ['Next.js', 'SaaS', 'Full-stack', 'Stripe'],
    status: 'available',
    type: 'build',
    duration: '3–4 weeks',
    deliverables: [
      'Authentication (email + social OAuth)',
      'Stripe subscription billing (monthly & annual)',
      'Core product feature (scoped and locked at kickoff)',
      'Admin dashboard with basic analytics',
      'Production deployment with CI/CD',
      'Full source code ownership (MIT license)',
      '30-day post-launch async support window',
    ],
    process: [
      {
        step: 'Discovery',
        detail:
          'We spend 2 hours mapping your users, core loop, and success metric. Scope is locked after this.',
      },
      {
        step: 'Build',
        detail:
          'Weeks 1–3: feature development with a shared progress board and daily async updates.',
      },
      {
        step: 'Review',
        detail:
          'Week 4: QA round, a feedback cycle, and polish. You get a staging preview link.',
      },
      {
        step: 'Launch',
        detail:
          'Deploy to production, hand off source code and credentials, and open the 30-day support window.',
      },
    ],
  },
];

// ─── Combined + helpers ───────────────────────────────────────────────────────
export const ALL_ITEMS: ShopItem[] = [...PRODUCTS, ...SERVICES];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find(p => p.slug === slug);
}

export function getService(slug: string): Service | undefined {
  return SERVICES.find(s => s.slug === slug);
}

export function getShopItem(slug: string): ShopItem | undefined {
  return ALL_ITEMS.find(i => i.slug === slug);
}