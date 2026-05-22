<div align="center">

# Arden CMS v2

**Portfolio · CRM · Shop, all in one self-hosted admin**

<p>
  <img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Tailwind-3-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/PostgreSQL-prod-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Status-Production-22c55e?style=flat-square" alt="Production" />
</p>

<p>
  A self-hosted CMS built for freelancers — manages a public portfolio, a shop with multi-gateway checkout, a media library backed by Cloudflare R2, and a private CRM for tracking clients, projects, and invoices.
</p>

[Live Site](https://ardenbouet.me) · [Report a Bug](https://github.com/arden28/ardenbouet/issues) · [Request a Feature](https://github.com/arden28/ardenbouet/issues)

</div>

---

## Screenshot

![Admin CMS preview](/public/images/preview.png)

*Master-Detail admin interface — dark sidebar, light editor area, drawer-based editing.*

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Database Setup](#database-setup)
  - [Environment Variables](#environment-variables)
- [Admin Guide](#admin-guide)
  - [Portfolio Content](#portfolio-content)
  - [Media Library](#media-library)
  - [Shop & Orders](#shop--orders)
  - [CRM](#crm)
  - [Settings](#settings)
- [Payments Configuration](#payments-configuration)
  - [Stripe](#stripe)
  - [Paystack](#paystack)
  - [M-Pesa (Daraja)](#m-pesa-daraja)
  - [PayPal](#paypal)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contact](#contact)

---

## Features

### Public Site
| Feature | Details |
|---|---|
| Portfolio | Projects with case studies, tech stack, media, and live links |
| Experience Timeline | Career & education history with dates and descriptions |
| Journey | Personal milestone timeline |
| Notes / Blog | Full Markdown with syntax highlighting, task lists, and callouts |
| Shop | Product catalog with slug-based pages, categories, and feature lists |
| Checkout | Stripe, Paystack, M-Pesa, and PayPal — all on-page (no redirect) |
| i18n | English / French toggle, auto-detected from browser, persisted in localStorage |
| Dark mode | Class-based (`dark` on `<html>`), persisted across sessions |

### Admin CMS
| Feature | Details |
|---|---|
| Portfolio editors | Drawer-based CRUD for Projects, Experience, Journey, Notes, Shop |
| Auto-save | 1500 ms debounce to localStorage + server (`PUT /api/admin/content`) |
| Media Library | Cloudflare R2 storage, folders, drag-to-move, rename, URL import, image compression, context menu, video hover-play |
| Orders | Track payment orders (Stripe / Paystack / M-Pesa / PayPal) with status management |
| CRM | Private client, project, and invoice management (never exposed publicly) |
| Export / Import | Full JSON export and re-import of the content bundle |

### CRM (admin-only)
| Feature | Details |
|---|---|
| Clients | Name, company, email, phone, country, status (Lead / Active / Inactive), tags, notes |
| Projects | Linked to clients; status pipeline from Discovery → Completed; budget + date tracking |
| Invoices | Auto-numbered (`INV-YYYY-NNN`), multi-currency, auto-`paidAt` when marked PAID |
| Dashboard | Revenue KPIs, month-over-month delta, active project list, recent invoice feed |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) — App Router, Server Components, API Routes |
| Language | [TypeScript 5](https://www.typescriptlang.org/) — strict end-to-end types |
| ORM | [Prisma](https://www.prisma.io/) — PostgreSQL (production), SQLite (local dev) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com/) + CSS variables (HSL) |
| Components | [Shadcn UI](https://ui.shadcn.com/) (headless, customized) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Markdown | [markdown-it](https://github.com/markdown-it/markdown-it) + anchor, container, task-lists plugins |
| MD Editor | [@uiw/react-md-editor](https://uiwjs.github.io/react-md-editor/) |
| Syntax HL | [highlight.js](https://highlightjs.org/) |
| Media storage | [Cloudflare R2](https://developers.cloudflare.com/r2/) (S3-compatible) |
| Payments | Stripe · Paystack · M-Pesa (Daraja) · PayPal |
| i18n | [react-i18next](https://react.i18next.com/) + browser language detector |
| Deployment | [Vercel](https://vercel.com/) |

---

## Architecture Overview

```
ardenbouet/
├── app/
│   ├── admin/             ← Admin CMS (cookie-protected)
│   │   ├── page.tsx       ← Master-Detail shell (tabs, autosave, sidebar)
│   │   ├── types.ts       ← ContentBundle + CRM type exports
│   │   ├── crm-types.ts   ← CrmClient / CrmProject / CrmInvoice / CrmStats
│   │   └── components/
│   │       ├── atoms.tsx  ← Shared: Button, TextField, SelectField, EditorDrawer, Chip, Toggle
│   │       ├── crm/       ← CrmEditor, panels, drawers
│   │       └── ...        ← ProjectsEditor, NotesEditor, MediaLibrary, ShopEditor, OrdersEditor
│   ├── api/
│   │   ├── admin/         ← Protected API routes (content, login, media, orders, CRM)
│   │   ├── checkout/      ← Payment initiation (Stripe, Paystack, M-Pesa, PayPal)
│   │   └── webhooks/      ← Payment webhook receivers
│   └── [public routes]    ← Portfolio pages, shop, checkout
├── prisma/
│   ├── schema.prisma      ← Content, Order, CrmClient, CrmProject, CrmInvoice models
│   └── migrations/        ← SQL migration history
├── lib/
│   ├── prisma.ts          ← Singleton PrismaClient
│   ├── defaultContent.ts  ← Seed data / defaults for ContentBundle
│   └── scanBundleUrls.ts  ← Extracts media URLs from content for the "Used" badge
└── middleware.ts           ← Cookie-based auth for /admin and /api/admin/*
```

### Content Model

All portfolio content lives in a single `Content` row (id = 1) whose `data` column is a typed JSON blob:

```typescript
type ContentBundle = {
  projects:    Project[];
  experiences: Experience[];
  journey:     JourneyItem[];
  notes:       Note[];
  products:    ShopProduct[];
  settings:    SiteSettings;
};
```

CRM data (clients, projects, invoices) is stored in separate relational tables — not inside the blob.

### Authentication

`middleware.ts` guards all `/admin` and `/api/admin/*` routes by checking the `admin_session` cookie (value `"1"`). The login flow is:

```
GET  /admin/login       → Login page
POST /api/admin/login   → Validates password, sets httpOnly cookie, redirects
POST /api/admin/logout  → Clears cookie, redirects to login
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** 9+
- **PostgreSQL** (for production) or SQLite (local dev, no extra install needed)
- A **Cloudflare R2** bucket (for media uploads)

### Installation

```bash
git clone https://github.com/arden28/ardenbouet.git
cd ardenbouet
npm install
```

> **Windows / running dev server:** If the dev server is already running, use `npm install --ignore-scripts` to avoid Prisma DLL lock errors.

### Database Setup

**Local development (SQLite — no config needed):**

```bash
# 1. Copy the example env
cp .env.example .env.local

# 2. Apply migrations and generate the client
npx prisma migrate dev

# 3. Seed default content
npm run prisma:seed
```

**Production (PostgreSQL):**

```bash
# Set DATABASE_URL in your environment, then:
npx prisma migrate deploy
npm run prisma:seed
```

Inspect the database visually at any time:

```bash
npx prisma studio
```

### Environment Variables

Create `.env.local` for local development or set these in your hosting provider's dashboard for production.

#### Core

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Prisma connection string. SQLite: `file:./dev.db` · PostgreSQL: `postgresql://user:pass@host:5432/db` |
| `ADMIN_PASSWORD` | Yes | Plain-text password for the `/admin/login` page |
| `ADMIN_COOKIE_NAME` | No | Cookie name (default: `admin_session`) |

#### Media — Cloudflare R2

| Variable | Required | Description |
|---|---|---|
| `R2_ACCOUNT_ID` | Yes | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | Yes | R2 API token key ID |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 API token secret |
| `R2_BUCKET_NAME` | Yes | R2 bucket name |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Yes | Public CDN URL for the bucket (e.g. `https://pub-xxx.r2.dev`) |

#### Stripe

| Variable | Required | Description |
|---|---|---|
| `STRIPE_SECRET_KEY` | Yes | Server-side secret key (`sk_live_…` or `sk_test_…`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Client-side publishable key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Webhook signing secret (from Stripe dashboard → Webhooks) |

#### Paystack

| Variable | Required | Description |
|---|---|---|
| `PAYSTACK_SECRET_KEY` | Yes | Server-side secret key |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Yes | Client-side public key |
| `NEXT_PUBLIC_PAYSTACK_USD_TO_NGN` | No | USD → NGN exchange rate shown to customers (default: `1600`) |

#### M-Pesa (Daraja API)

| Variable | Required | Description |
|---|---|---|
| `MPESA_CONSUMER_KEY` | Yes | Daraja app consumer key |
| `MPESA_CONSUMER_SECRET` | Yes | Daraja app consumer secret |
| `MPESA_SHORTCODE` | Yes | Business shortcode |
| `MPESA_PASSKEY` | Yes | STK Push passkey |
| `MPESA_CALLBACK_URL` | Yes | Publicly accessible URL Safaricom will POST the STK result to (e.g. `https://yourdomain.com/api/webhooks/mpesa`) |
| `NEXT_PUBLIC_MPESA_USD_TO_KES` | No | USD → KES exchange rate (default: `130`) |

#### PayPal

| Variable | Required | Description |
|---|---|---|
| `PAYPAL_CLIENT_ID` | Yes | Server-side client ID |
| `PAYPAL_CLIENT_SECRET` | Yes | Server-side client secret |
| `PAYPAL_BASE` | Yes | `https://api-m.sandbox.paypal.com` (sandbox) or `https://api-m.paypal.com` (live) |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | Yes | Client-side PayPal client ID |

---

## Admin Guide

Navigate to `/admin` — you'll be redirected to the login page on first visit.

### Portfolio Content

Each tab in the sidebar manages a section of `ContentBundle`. Changes trigger a 1500 ms auto-save to both `localStorage` (instant recovery on refresh) and the server. The status dot in the sidebar shows:

| Dot color | Meaning |
|---|---|
| Grey | Ready / idle |
| Amber (pulsing) | Unsaved local changes |
| Blue (pulsing) | Saving to server |
| Blue (solid) | All saved |
| Red (pulsing) | Save error — retry button appears |

Use the **Export JSON** button to download a full backup of your content bundle, and **Import JSON** to restore it.

### Media Library

The media library is backed by Cloudflare R2. Files are organized in folders using key prefixes (e.g. `photos/paris/image.jpg`).

**Uploading:**
- Drag files directly onto the library or into a folder
- Click **Upload** to use the file picker
- Paste a URL into **Import URL** to fetch a remote image

**Organizing:**
- Create folders with the **+ Folder** button
- Drag file cards onto folder cards or breadcrumb segments to move them
- Right-click any file for: Download · Open in new tab · Copy URL · Copy as Markdown · Copy as HTML · Rename · Move to folder · Delete

**Image compression** is applied automatically on upload (quality 0.82, max dimension 1920 px).

### Shop & Orders

Products are managed under the **Shop** tab and live inside `ContentBundle.products`. Each product has a `slug` used in the checkout URL: `/checkout?product=<slug>`.

**Orders** tab shows all purchases. Click a row to view details or update the order status. Payments are confirmed automatically via webhooks from each payment gateway.

### CRM

The CRM is private — it never touches the public site. Access it from the **CRM** tab.

| Section | What you can do |
|---|---|
| **Overview** | Revenue KPIs, month-over-month comparison, active projects list, recent invoices |
| **Clients** | Create and manage clients with status (Lead / Active / Inactive), tags, and notes |
| **Projects** | Track work with a 7-stage pipeline: Discovery → Proposal → Active → Review → Completed → On Hold → Cancelled |
| **Invoices** | Auto-numbered invoices (`INV-YYYY-NNN`), multi-currency, auto-set `paidAt` when marked PAID |

Deleting a client cascades all their projects and invoices.

### Settings

Controls global site settings (name, bio, social links, etc.) stored in `ContentBundle.settings`.

---

## Payments Configuration

### Stripe

1. Create a product and price in the [Stripe Dashboard](https://dashboard.stripe.com)
2. Add `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to your env
3. Create a webhook endpoint pointing to `https://yourdomain.com/api/webhooks/stripe` and subscribe to `payment_intent.succeeded`
4. Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`

### Paystack

1. Create an account at [paystack.com](https://paystack.com)
2. Add your keys from the Paystack dashboard
3. Create a webhook at `https://yourdomain.com/api/webhooks/paystack`
4. Set `NEXT_PUBLIC_PAYSTACK_USD_TO_NGN` if you want to display a custom exchange rate

### M-Pesa (Daraja)

1. Register at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create a Daraja app and note the Consumer Key / Secret
3. Your `MPESA_CALLBACK_URL` **must** be a publicly accessible HTTPS URL — use [ngrok](https://ngrok.com) for local testing
4. STK Push initiates at `/api/checkout/mpesa/init`; the status is polled every 3 s via `/api/checkout/mpesa/status`

### PayPal

1. Create a REST app at [developer.paypal.com](https://developer.paypal.com)
2. Set `PAYPAL_BASE` to the sandbox URL during testing, switch to live for production
3. The checkout uses `<PayPalButtons>` from `@paypal/react-paypal-js` — a popup appears over the page without redirecting

---

## Deployment

### Vercel (recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

1. Add all environment variables in the Vercel project dashboard (Settings → Environment Variables)
2. The `build` script runs `prisma generate && prisma migrate deploy` automatically before `next build`
3. Set `DATABASE_URL` to your production PostgreSQL connection string (e.g. Neon, Supabase, Railway)

### Self-hosted (Docker / VPS)

```bash
npm run build
npm start
```

Ensure `NODE_ENV=production` and all environment variables are set in your process manager (PM2, systemd, etc.).

### Build Script

```json
"build": "prisma generate && prisma migrate deploy && next build"
```

`prisma migrate deploy` applies any pending migrations on every deploy — safe to run in CI/CD.

---

## Project Structure

```
app/
├── admin/
│   ├── page.tsx                    ← Admin shell (tabs, autosave, nav)
│   ├── login/page.tsx              ← Login page
│   ├── types.ts                    ← ContentBundle, Order, CRM type re-exports
│   ├── crm-types.ts                ← CrmClient, CrmProject, CrmInvoice, CrmStats
│   └── components/
│       ├── atoms.tsx               ← Button, TextField, SelectField, EditorDrawer, Chip, Toggle
│       ├── MediaLibrary.tsx        ← R2-backed media with folders, drag-drop, context menu
│       ├── ProjectsEditor.tsx
│       ├── ExperienceEditor.tsx
│       ├── JourneyEditor.tsx
│       ├── NotesEditor.tsx
│       ├── ShopEditor.tsx
│       ├── OrdersEditor.tsx
│       ├── SettingsEditor.tsx
│       └── crm/
│           ├── CrmEditor.tsx       ← CRM root (sub-nav, data fetching)
│           ├── CrmOverview.tsx     ← KPI dashboard
│           ├── CrmClientsPanel.tsx + ClientDrawer.tsx
│           ├── CrmProjectsPanel.tsx + ProjectDrawer.tsx
│           └── CrmInvoicesPanel.tsx + InvoiceDrawer.tsx
├── api/
│   ├── admin/
│   │   ├── content/route.ts        ← GET + PUT ContentBundle
│   │   ├── login/route.ts
│   │   ├── logout/route.ts
│   │   ├── media/route.ts          ← R2 list, delete, rename, move
│   │   ├── media/upload/route.ts
│   │   ├── media/import/route.ts
│   │   ├── orders/route.ts
│   │   ├── orders/[id]/route.ts
│   │   └── crm/
│   │       ├── stats/route.ts
│   │       ├── clients/route.ts + [id]/route.ts
│   │       ├── projects/route.ts + [id]/route.ts
│   │       └── invoices/route.ts + [id]/route.ts
│   ├── checkout/
│   │   ├── stripe/route.ts
│   │   ├── paystack/verify/route.ts
│   │   ├── mpesa/init/route.ts
│   │   ├── mpesa/status/route.ts
│   │   ├── paypal/create/route.ts
│   │   └── paypal/capture/route.ts
│   └── webhooks/
│       ├── stripe/route.ts
│       ├── paystack/route.ts
│       ├── mpesa/route.ts
│       └── paypal/route.ts
prisma/
├── schema.prisma                   ← Content, Order, CrmClient, CrmProject, CrmInvoice
├── seed.ts
└── migrations/
lib/
├── prisma.ts                       ← Singleton PrismaClient
├── defaultContent.ts               ← Seed defaults for ContentBundle
├── markdown.ts                     ← markdown-it renderer
└── scanBundleUrls.ts
middleware.ts                       ← Auth guard for /admin + /api/admin/*
```

---

## Contact

**Arden BOUET** — Software Engineer · Nairobi, Kenya

| | |
|---|---|
| Email | [laudbouetoumoussa@gmail.com](mailto:laudbouetoumoussa@gmail.com) |
| LinkedIn | [linkedin.com/in/arden-bouet](https://www.linkedin.com/in/arden-bouet/) |
| GitHub | [@arden28](https://github.com/arden28) |
| Site | [ardenbouet.me](https://ardenbouet.me) |

---

<div align="center">
  <sub>Built with care in Nairobi, Kenya.</sub>
</div>
