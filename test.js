

  const projects: Project[] = [
    {
      id: 1,
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
    {
      id: 3,
      title: 'Ndako Book — Hotel Reservations',
      description: 'Search, compare, book — real-time availability & instant confirmations.',
      logoUrl: '/images/ndako-book.ico',
      url: 'https://ndako-book.vercel.app/',
      tags: ['saas'],
      tech: ['Next.js', 'Bookings', 'Payments'],
      metric: 'Demo traffic: 2k+ searches/day',
      caseFile: {
        problem: 'Fragmented booking flows and inconsistent availability data hurt conversions.',
        approach: [
          'Normalized room/inventory model, cached search index',
          'Atomic booking pipeline with payment intents and idempotency',
          'UX: one-page search → compare → book with optimistic UI',
        ],
        result: 'Cleaner flow, fewer abandoned carts, and a foundation for channel integrations.',
        images: [
          { src: '/case/ndako-search.jpg', alt: 'Ndako search' },
          { src: '/case/ndako-booking.jpg', alt: 'Ndako booking' },
        ],
        tags: ['hospitality'],
        tech: ['Next.js', 'Stripe', 'Redis'],
      },
    },
    {
      id: 6,
      title: 'Koverae Billing (Laravel)',
      description: 'Subscriptions, metered usage, and billing flows — simple and extensible.',
      logoUrl: '/images/wallet.png',
      url: 'https://developer.koverae.com/koverae-billing/?utm=ardenbouet',
      tags: ['open-source', 'saas'],
      tech: ['Laravel', 'Package'],
      caseFile: {
        problem: 'Teams re-implement subscription logic with subtle bugs in proration and metering.',
        approach: [
          'Composable plans/items with proration and trials',
          'Usage records + aggregation; webhooks for sync',
          'Test suite to lock billing math and edge cases',
        ],
        result: 'Drop-in billing primitives, faster time-to-market, fewer revenue leaks.',
        images: [],
        tags: ['billing'],
        tech: ['Laravel', 'PHPUnit'],
      },
    },
    { id: 2, title: 'Seabar — Store Locator', description: 'Find nearby shops with live geolocation and a frictionless map UI.', logoUrl: '/images/seabar.png', url: 'https://seabar.com/pages/store-locator', tags: ['client'], tech: ['Maps', 'Geolocation', 'Responsive UI'] },
    { id: 4, title: 'Ndako — PMS', description: 'Hybrid property/hotel ops: reservations, tenants, leases, invoicing, reporting.', logoUrl: '/images/ndako.png', url: 'https://ndako.koverae.com', tags: ['saas', 'open-source'], tech: ['Laravel', 'Livewire', 'MySQL'], metric: 'Automates billing & ops' },
    { id: 5, title: 'Koverae ERP', description: '12+ apps: Finance, HR, Logistics, Productivity. K-Wallet, Kredits, Quick Find.', logoUrl: '/images/koverae.png', url: 'https://koverae.com', tags: ['saas'], tech: ['Laravel', 'React', 'Cloud'] },
    { id: 7, title: 'Dr. Mahamat Adoum — Portfolio', description: 'Multilingual portfolio for research & publications — clear, accessible, fast.', logoUrl: '/images/mahamat.png', url: 'https://mahamat-portfolio.vercel.app/', tags: ['client'], tech: ['Next.js', 'i18n'] },
  ];

const SCENES: Scene[] = [
  {
    id: 1,
    company: 'Banking API Integration',
    role: 'Financial Software Engineer',
    period: 'Sept 2024 – Mar 2025 · 7 months',
    location: 'Freelance',
    logline: 'Built a clean ingestion & reconciliation pipeline for bank data with near-real-time reporting.',
    bullets: [
      'Designed Laravel ingestion for statements & webhooks',
      'Implemented ledger drill-downs & audits (Livewire)'
    ],
    outcomes: ['~40% faster month-end close'],
    poster: '/images/wallet.png',
    tags: ['Laravel', 'Livewire', 'Finance'],
  },
  {
    id: 2,
    company: 'Business Data Aggregation',
    role: 'API Developer',
    period: 'Jun 2024 – Aug 2024 · 3 months',
    location: 'Freelance',
    logline: 'Unified company data behind a small REST layer with quotas and consumer controls.',
    bullets: [
      'Laravel + Sanctum; scopes & rate limits',
      'Python enrichment workers; admin for consumers'
    ],
    outcomes: ['Research hours collapsed to minutes'],
    poster: '/images/koverae.png',
    tags: ['Laravel', 'Sanctum', 'Python'],
  },
  {
    id: 3,
    company: 'SuiteScript (Hotel SaaS)',
    role: 'Full-stack Developer',
    period: 'Dec 2023 – Mar 2024 · 4 months',
    location: 'Freelance',
    logline: 'Booking, billing, and guest flows with a calm UI to reduce ops friction.',
    bullets: [
      'Reservation engine, invoicing, notifications',
      'Availability calendar with caching (Livewire)'
    ],
    outcomes: ['Faster check-ins, fewer billing errors'],
    poster: '/images/ndako.png',
    tags: ['Laravel', 'Livewire', 'Hospitality'],
  },
  {
    id: 4,
    company: 'Velostar Organisation',
    role: 'Web Developer',
    period: 'Apr 2023 – Oct 2023 · 7 months',
    location: 'Remote',
    logline: 'Logistics dashboard that surfaces shipment health at a glance.',
    bullets: [
      'Real-time tracking view (Livewire)',
      'Alpine.js micro-interactions for ops speed'
    ],
    poster: '/images/seabar.png',
    tags: ['Laravel', 'Livewire', 'Alpine.js'],
  },
  {
    id: 5,
    company: 'Cowema — E-commerce',
    role: 'Full-Stack Developer (Intern)',
    period: 'Jan 2023 – Mar 2023 · 3 months',
    location: 'Intern',
    logline: 'Marketplace foundations: catalog, filters, carts, checkout.',
    bullets: [
      'Laravel + Livewire stack',
      'Stripe/PayPal payments & order lifecycle'
    ],
    poster: '/images/mahamat.png',
    tags: ['Laravel', 'Stripe', 'PayPal'],
  },
];