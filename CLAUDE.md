# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # prisma generate + migrate deploy + next build
npm run lint         # Next.js ESLint (not configured yet: prompts interactively — use `npx tsc --noEmit` to type-check)
npm run prisma:seed  # Seed DB with default content (tsx prisma/seed.ts)
npx prisma studio    # Visual DB browser
npx prisma migrate dev   # Apply/create migrations against the DATABASE_URL Postgres DB
```

The `build` script always runs `prisma generate && prisma migrate deploy` before `next build`. Run `prisma:seed` after a fresh DB setup.

There is no configured test runner (no test script, no Jest/Vitest config) — verify changes via `npm run lint`, `npm run build`, and manual testing.

**Windows note:** if the dev server is already running, `npm install` will fail with a Prisma DLL lock error — use `npm install --ignore-scripts` instead. `prisma generate` hits the same lock; renaming `node_modules/.prisma/client/query_engine-windows.dll.node` aside first works without stopping the server.

### Local database (never point dev at prod)

`.env` holds **production** credentials (DB, Mailgun). Local dev uses a Docker Postgres and `.env.local` overrides:

```bash
docker run -d --name ardenbouet-pg -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=ardenbouet -p 54329:5432 postgres:16-alpine
# .env.local: DATABASE_URL="postgresql://postgres:dev@localhost:54329/ardenbouet?schema=public", MAILGUN_KEY="", ADMIN_SESSION_SECRET=...
export DATABASE_URL="postgresql://postgres:dev@localhost:54329/ardenbouet?schema=public"  # Prisma CLI does NOT read .env.local
npx prisma migrate deploy && npx prisma db push --skip-generate && npm run prisma:seed
```

`db push` is needed because `Order`, `Message` and `Budget` were never captured in a migration (prod got them via push). For the same reason, write new migrations as a diff — `npx prisma migrate diff --from-schema-datamodel <old schema> --to-schema-datamodel prisma/schema.prisma --script` — rather than `migrate dev`, which would try to recreate those tables. Don't run `npm run build` locally without overriding `DATABASE_URL`: it runs `migrate deploy`.

## Architecture

**Stack:** Next.js 14 App Router · TypeScript · Prisma (PostgreSQL — the schema and migration lock are Postgres-only; there is no SQLite mode) · Tailwind CSS · Shadcn UI · Framer Motion · Cloudflare R2 (media storage)

This app is a self-hosted portfolio + shop + CRM: a public site (portfolio, Medium-style blog, shop with checkout) backed by an admin CMS that also runs a private client/project/invoice CRM. The CRM is never exposed on public routes.

### Content model

Public-facing portfolio/shop content lives in a single `Content` row (`id = 1`) whose `data` column is a JSON blob typed as `ContentBundle`:

```typescript
type ContentBundle = {
  projects: Project[];
  experiences: Experience[];
  journey: JourneyItem[];
  notes: Note[];
  products: ShopProduct[];
  settings?: SiteSettings;   // site name/bio/social links + optional R2 fallback config
};
```

Types are defined in [app/admin/types.ts](app/admin/types.ts) (CRM types re-exported from [app/admin/crm-types.ts](app/admin/crm-types.ts)) and defaults/seed data in [lib/defaultContent.ts](lib/defaultContent.ts).

CRM data (`CrmClient`, `CrmProject`, `CrmInvoice`) and commerce data (`Order`, `DownloadToken`) live in their own Prisma tables, not inside the `Content` JSON blob — see [prisma/schema.prisma](prisma/schema.prisma).

### Public project pages

Each portfolio project has its own server-rendered detail page at `/projects/[id]` ([app/projects/[id]/page.tsx](app/projects/[id]/page.tsx), `force-dynamic`), which reads the project straight from the `Content` row via Prisma and renders `project.caseFile` (problem / approach / result / images). It replaced the old `CaseModal` — the "Case file" link in [app/components/Projects.tsx](app/components/Projects.tsx) is now a plain `<Link>`, shown for every project (projects without a `caseFile` get a "coming soon" state). Its strings live under the `projectDetail` namespace in [lib/serverT.ts](lib/serverT.ts). The `<Journey>` section is currently commented out in [app/page.tsx](app/page.tsx).

### Admin CMS

[app/admin/page.tsx](app/admin/page.tsx) is a Master-Detail interface with:
- Tabbed navigation (Projects / Experience / Journey / Shop / Media / Orders / CRM / Settings); the old Notes tab now links to `/admin/blog`, and `?tab=<key>` deep-links a tab
- Drawer-based editing (opens over the list to preserve context)
- Save states: `idle → dirty → saving → loaded → error`
- Debounced autosave (1500 ms) that persists to LocalStorage (`arden_cms_v2`) and the server via `PUT /api/admin/content`
- Export/import as JSON

Each tab has a dedicated editor component under [app/admin/components/](app/admin/components/); CRM panels/drawers live under [app/admin/components/crm/](app/admin/components/crm/).

### CRM (admin-only)

Relational, not part of the content bundle. `CrmClient` has many `CrmProject` and `CrmInvoice` (both cascade-delete when the client is deleted). `CrmProject` has a 7-stage status pipeline (`DISCOVERY → PROPOSAL → ACTIVE → REVIEW → COMPLETED`, plus `ON_HOLD`/`CANCELLED`). `CrmInvoice` is auto-numbered (`INV-YYYY-NNN`) and auto-sets `paidAt` when marked `PAID`. Routes: `/api/admin/crm/{clients,projects,invoices}[/[id]]` and `/api/admin/crm/stats` (dashboard KPIs), all guarded by the same admin middleware.

### Media Library (Cloudflare R2)

Media is stored in an S3-compatible Cloudflare R2 bucket, organized by key prefixes as pseudo-folders (e.g. `photos/paris/image.jpg`). [lib/r2.ts](lib/r2.ts) wraps the S3 client; [lib/getR2Config.ts](lib/getR2Config.ts) resolves config with env vars (`R2_*`) taking precedence over the R2 fields stored in `ContentBundle.settings` (DB fallback, useful when env vars aren't set). Routes: `/api/admin/media` (list/delete/rename/move), `/api/admin/media/upload`, `/api/admin/media/import` (fetch a remote URL into the bucket). [lib/scanBundleUrls.ts](lib/scanBundleUrls.ts) scans the content bundle for referenced media URLs to power the "in use" badge in the library UI.

### API routes

Content CRUD is at `/api/admin/content` (GET + PUT). Auth routes are `/api/admin/login` and `/api/admin/logout`. See CRM and Media sections above for their routes; commerce routes are under Shop & Checkout below.

### Authentication

[middleware.ts](middleware.ts) guards every `/admin/*` page (redirect to login) and every `/api/admin/*` route (401), except login/logout. The `admin_session` cookie (name via `ADMIN_COOKIE_NAME`) holds an HMAC-signed, expiring token from [lib/adminSession.ts](lib/adminSession.ts) (Web Crypto, so it runs in Edge middleware too); routes also re-check it with `verifyAdminToken()`. Login flow: `/admin/login` → POST `/api/admin/login` (checks `ADMIN_USER` + `ADMIN_PASS`) → sets the signed httpOnly cookie (8 h).

### Blog (Medium-style)

Posts are relational, **not** in the Content bundle: `Post` (+ `PostRevision`, `Series`), and reader data `Reader`, `Comment` (+ `CommentLike`), `Clap`, `Highlight`, `Bookmark`, `Subscriber`. Migration `20261014000000_add_blog` copied the old `Content.notes` into `Post` (non-destructive; the notes JSON is left as a backup, and `/notes/*` 308-redirects to `/blog/*` via `next.config.mjs`).

- **Body format:** `Post.content` is TipTap/ProseMirror JSON. [lib/blog/render.tsx](lib/blog/render.tsx) renders it server-side to React, and the editor's custom nodes live in [app/admin/blog/editor/nodes.tsx](app/admin/blog/editor/nodes.tsx). **Any new node type must be added to both, with the same attrs.** `contentCard` nodes embed products, projects, experiences or other posts by id; they are resolved at render time from the Content bundle / Post table ([lib/blog/queries.ts](lib/blog/queries.ts) `resolveEmbeds`), so deleted or unpublished items silently drop out. Iframe embeds only come from the provider allow-list in [lib/blog/embeds.ts](lib/blog/embeds.ts).
- **Typography:** [app/blog/story.css](app/blog/story.css) is shared by the public `.story` article and the editor (`.story-editor`), so the editor is WYSIWYG. The serif comes from `next/font` as `--font-serif` on a wrapper element (blog layout / admin blog layout); reference it where used, never via a `:root` variable.
- **Visibility:** always filter with `visibleWhere()` — `PUBLISHED`, or `SCHEDULED` whose `scheduledAt` has passed (scheduling needs no cron). Admins (`isAdminRequest()`) can open drafts at `/blog/<slug>` as a preview.
- **Readers:** next-auth (JWT, no adapter) in [lib/readerAuth.ts](lib/readerAuth.ts); providers are enabled only when `GITHUB_ID/SECRET` / `GOOGLE_CLIENT_ID/SECRET` are set, plus a `dev` credentials provider under `next dev` only. `getReader()` returns null for banned readers. This is separate from the admin session.
- **Claps** are keyed by `visitorKey` (`r:<readerId>` or `a:<ab_vid cookie>`), max 50 per visitor. Comments nest at most 3 levels, are rate-limited to 5 per minute per reader, are formatted by the escaping mini-formatter `formatComment()` (never raw HTML), and are soft-deleted by readers.
- **Newsletter:** double opt-in (`/api/blog/subscribe` → emailed confirm link). The admin sends a published post to `ACTIVE` subscribers from the publish dialog (`POST /api/admin/blog/posts/[id]/newsletter`, once per post). Email goes through `sendMail()` in [lib/mailer.ts](lib/mailer.ts); with Mailgun unset it logs and skips, and in dev it logs the confirm link.
- **Admin:** `/admin/blog` (stories), `/admin/blog/[id]` (editor), `/admin/blog/{comments,subscribers,series}`, all wrapped in [components/admin/AdminShell.tsx](components/admin/AdminShell.tsx). The site `Header`/`Footer` return null on `/blog*` and `/admin/blog*`. Editor autosave goes through `usePostSaver` (one request in flight at a time, 409 on stale `baseUpdatedAt`). `PUT /api/admin/blog/posts/[id]` derives word count, reading time, excerpt, publish timestamps and (for untitled drafts) the slug server-side. A revision is snapshotted on publish and at most every 10 minutes of autosave.
- **Static `/blog/*` routes** (`search`, `subscribe`, `reading-list`, `tag`, `series`, `rss.xml`) shadow post slugs; keep `RESERVED_SLUGS` in [lib/blog/admin.ts](lib/blog/admin.ts) in sync.
- **Strings:** public blog strings are in [lib/blog/strings.ts](lib/blog/strings.ts) (`blogT(locale)`, pure, used by both server and client components), not in `serverT.ts` or `app/i18n.tsx`.

### Markdown

Contact messages and posts migrated from the old notes (`Post.bodyMd`, until re-saved in the new editor) render markdown via `markdown-it` (with anchor, container, task-lists plugins). The [lib/mardown.ts](lib/mardown.ts) utility wraps the renderer. Syntax highlighting uses `highlight.js`. The messages editor uses `@uiw/react-md-editor`.

### Styling conventions

- Tailwind + CSS variables (HSL format) defined in [app/globals.css](app/globals.css)
- Dark mode is class-based (`.dark` on `<html>`)
- Utility helper: `cn()` from [lib/utils.ts](lib/utils.ts) (clsx + tailwind-merge)
- Shadcn components live in [components/ui/](components/ui/); add new ones with `npx shadcn@latest add <component>`

### i18n

There are two separate i18n mechanisms sharing the same `arden_lang` cookie:
- **Client components:** [app/i18n.tsx](app/i18n.tsx) configures react-i18next with EN/FR resource dictionaries, auto-detected via `i18next-browser-languagedetector` (cookie → localStorage → navigator) and persisted back to both. The `<LanguageSwitcher>` component in the header toggles it.
- **Server components:** [lib/serverT.ts](lib/serverT.ts) reads the `arden_lang` cookie directly (via `next/headers`) and looks up strings from its own small EN/FR dictionary through `makeT(locale)`. Its key namespaces (`blog`, `noteDetail`, `shopDetail`, …) are independent from — and not a full mirror of — the client-side i18next resources, so adding a server-rendered string requires adding it to `serverT.ts` specifically, not `app/i18n.tsx`.

### Shop, Checkout & Fulfillment

Products live inside `ContentBundle.products` (typed as `ShopProduct[]`). Each product has `id`, `slug`, `price`, `currency`, `priceLabel`, `category` (`platform`/`app`/`document`/`service`), `features`, `media`, optional `fileUrl` (digital download) and `discountCodes`.

Checkout page: `/checkout?product=<slug>`. Flow stays entirely on-site — no redirect:
- **Stripe** — `CardElement` + `confirmCardPayment()` (on-page)
- **Paystack** — `window.PaystackPop.openIframe()` (modal over page; script loaded via `<Script>`)
- **M-Pesa** — Daraja STK Push → 3 s polling of `/api/checkout/mpesa/status`
- **PayPal** — `<PayPalButtons>` from `@paypal/react-paypal-js` (popup, page stays)

API routes: `app/api/checkout/{stripe,paystack/verify,mpesa/init,mpesa/status,paypal/create,paypal/capture,fulfill}/route.ts`
Webhook receivers: `app/api/webhooks/{stripe,paystack,mpesa,paypal}/route.ts`

Order lifecycle: an `Order` row is created as `PENDING` on checkout initiation, then updated to `PAID` by webhook or verify/capture call. On success, [lib/fulfillment.ts](lib/fulfillment.ts)'s `fulfillOrder()` resolves the DB order from the provider-prefixed `paymentRef` (e.g. `stripe_<id>`), is idempotent (skips token creation if a `DownloadToken` already exists for the order), issues a 48-hour, download-limited `DownloadToken` for non-service products with a `fileUrl`, and emails the customer via [lib/mailer.ts](lib/mailer.ts) using the `PurchaseEmail` React Email template ([emails/PurchaseEmail.tsx](emails/PurchaseEmail.tsx)) — email failure is logged but non-fatal, it does not fail the order.

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma DB connection |
| `ADMIN_USER` / `ADMIN_PASS` | Admin credentials checked by `/api/admin/login` |
| `ADMIN_SESSION_SECRET` | HMAC key for admin session tokens (falls back to `ADMIN_PASS`) |
| `ADMIN_COOKIE_NAME` | Session cookie name (default `admin_session`) |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` | Cloudflare R2 credentials for the media library |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Public CDN URL for the R2 bucket |
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
| `MAILGUN_KEY` / `MAILGUN_DOMAIN` / `MAILGUN_FROM` | Transactional + newsletter email (unset = emails skipped) |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | Blog reader sign-in (secret falls back to `ADMIN_SESSION_SECRET`/`ADMIN_PASS`) |
| `GITHUB_ID` / `GITHUB_SECRET`, `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth apps for reader sign-in; each provider appears only when set |
| `NEXT_PUBLIC_SITE_URL` | Absolute site URL for emails, RSS, canonical/OG (default `https://ardenbouet.me`) |

Local dev uses `.env.local`; production uses `.env`. R2 credentials can alternatively be set via the Settings tab in the admin UI (stored in `ContentBundle.settings`), which [lib/getR2Config.ts](lib/getR2Config.ts) falls back to when the `R2_*` env vars are absent.
