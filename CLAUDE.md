# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # prisma generate + migrate deploy + next build
npm run lint         # Next.js ESLint
npm run prisma:seed  # Seed DB with default content (tsx prisma/seed.ts)
npx prisma studio    # Visual DB browser
```

The `build` script always runs `prisma generate && prisma migrate deploy` before `next build`. Run `prisma:seed` after a fresh DB setup.

## Architecture

**Stack:** Next.js 14 App Router · TypeScript · Prisma (PostgreSQL prod / SQLite local) · Tailwind CSS · Shadcn UI · Framer Motion

### Content model

All portfolio content lives in a single `Content` row (`id = 1`) whose `data` column is a JSON blob typed as `ContentBundle`:

```typescript
type ContentBundle = {
  projects: Project[];
  experiences: Experience[];
  journey: JourneyItem[];
  notes: Note[];
};
```

Types are defined in [app/admin/types.ts](app/admin/types.ts) and defaults/seed data in [lib/defaultContent.ts](lib/defaultContent.ts).

### Admin CMS

[app/admin/page.tsx](app/admin/page.tsx) is a Master-Detail interface with:
- Tabbed navigation (Projects / Experience / Journey / Notes / Messages)
- Drawer-based editing (opens over the list to preserve context)
- Save states: `idle → dirty → saving → loaded → error`
- Debounced autosave (1500 ms) that persists to LocalStorage (`arden_cms_v2`) and the server via `PUT /api/admin/content`
- Export/import as JSON

Each tab has a dedicated editor component under [app/admin/components/](app/admin/components/).

### API routes

All content CRUD is at `/api/admin/content` (GET + PUT). Auth routes are `/api/admin/login` and `/api/admin/logout`.

### Authentication

[middleware.ts](middleware.ts) protects all `/admin` and `/api/admin/*` routes by checking the `admin_session` cookie. Login flow: `/admin/login` page → POST `/api/admin/login` → sets cookie → redirect.

### Markdown

Notes and messages render markdown via `markdown-it` (with anchor, container, task-lists plugins). The [lib/mardown.ts](lib/mardown.ts) utility wraps the renderer. Syntax highlighting uses `highlight.js`. The admin editor uses `@uiw/react-md-editor`.

### Styling conventions

- Tailwind + CSS variables (HSL format) defined in [app/globals.css](app/globals.css)
- Dark mode is class-based (`.dark` on `<html>`)
- Utility helper: `cn()` from [lib/utils.ts](lib/utils.ts) (clsx + tailwind-merge)
- Shadcn components live in [components/ui/](components/ui/); add new ones with `npx shadcn@latest add <component>`

### i18n

[app/i18n.tsx](app/i18n.tsx) configures react-i18next with EN/FR. Language preference is persisted in localStorage and auto-detected via `i18next-browser-languagedetector`. The `<LanguageSwitcher>` component in the header toggles it.

### Shop & Checkout

Products live inside `ContentBundle.products` (typed as `ShopProduct[]`). Each product has `id`, `slug`, `price`, `currency`, `priceLabel`, `category`, `features`, `media`, etc.

Checkout page: `/checkout?product=<slug>`. Flow stays entirely on-site — no redirect:
- **Stripe** — `CardElement` + `confirmCardPayment()` (on-page)
- **Paystack** — `window.PaystackPop.openIframe()` (modal over page; script loaded via `<Script>`)
- **M-Pesa** — Daraja STK Push → 3 s polling of `/api/checkout/mpesa/status`
- **PayPal** — `<PayPalButtons>` from `@paypal/react-paypal-js` (popup, page stays)

API routes: `app/api/checkout/{stripe,paystack/verify,mpesa/init,mpesa/status,paypal/create,paypal/capture}/route.ts`
Webhook receivers: `app/api/webhooks/{stripe,paystack,mpesa,paypal}/route.ts`

Order lifecycle: created as `PENDING` on checkout initiation, updated to `PAID` by webhook or verify call.

`npm install` must use `--ignore-scripts` if the dev server is running (Prisma DLL lock on Windows).

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma DB connection |
| `STRIPE_SECRET_KEY` | Stripe server key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe browser key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook HMAC secret |
| `PAYSTACK_SECRET_KEY` | Paystack server key |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Paystack browser key |
| `NEXT_PUBLIC_PAYSTACK_USD_TO_NGN` | Exchange rate for Paystack display (default 1600) |
| `MPESA_CONSUMER_KEY` / `MPESA_CONSUMER_SECRET` | Daraja API credentials |
| `MPESA_SHORTCODE` / `MPESA_PASSKEY` | STK Push shortcode and passkey |
| `MPESA_CALLBACK_URL` | Public URL for Safaricom STK callback |
| `NEXT_PUBLIC_MPESA_USD_TO_KES` | Exchange rate for M-Pesa display (default 130) |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | PayPal server credentials |
| `PAYPAL_BASE` | PayPal API base (sandbox vs live) |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | PayPal browser client ID |

Local dev uses `.env.local`; production uses `.env`.
