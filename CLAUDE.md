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

### Public site

The whole public site uses the Medium visual language of the blog: the root layout ([app/layout.tsx](app/layout.tsx)) renders `SiteHeader`/`SiteFooter` and wraps everything in `SiteProviders` ([components/site/SiteProviders.tsx](components/site/SiteProviders.tsx)), which exposes `useSite()` (locale, `ui()` strings, `href()` for localized links, the reader's `me` summary from `/api/me`, `openSignIn()`, `openBooking()`). The sign-in dialog and booking modal are lazy-loaded.

- **Home** ([app/page.tsx](app/page.tsx), [components/home/](components/home/)): hero with profile buttons (links in [lib/site.ts](lib/site.ts)) and the booking action, work, experience, contact (`POST /api/contact` stores a `Message` and notifies `OWNER_EMAIL`).
- **Projects** `/projects/[id]`: story-style case study with the bento + lightbox [components/gallery/Gallery.tsx](components/gallery/Gallery.tsx).
- **Shop** `/shop`, `/shop/[slug]`, checkout (see below) and `/download/[token]`.
- **Dark mode:** class-based (`.dark` on `<html>`, key `arden_theme`, no-flash script in [lib/theme.ts](lib/theme.ts), View Transitions reveal from the toggle). The UI uses a small fixed palette of arbitrary hex classes (`text-[#242424]`, `bg-[#f2f2f2]`, …); `.dark` overrides are **generated** into [app/dark.css](app/dark.css) by `npm run gen:dark` ([scripts/gen-dark-css.mjs](scripts/gen-dark-css.mjs)). After using a new hex class, add it to the script's `MAP` and rerun. Colours that must not change in dark mode (white chips behind brand logos, overlays) use values outside the map, e.g. `bg-[#ffffff]`.
- **Copy:** no em dashes in user-facing text, use commas.

### Admin CMS

All admin pages live under the persistent frame in [app/admin/layout.tsx](app/admin/layout.tsx) (`AdminFrame` in [components/admin/AdminShell.tsx](components/admin/AdminShell.tsx): collapsible sidebar, state in localStorage `admin_sidebar_collapsed`, nav badges from `/api/admin/badges`). Each page renders `<AdminShell title actions>` for its header and content. Shared primitives are in [components/admin/ui.tsx](components/admin/ui.tsx).

- `/admin` is the dashboard (`/api/admin/dashboard`: metrics, filters, quick actions).
- Projects / experience / journey / products are schema-driven [components/admin/collection/CollectionManager.tsx](components/admin/collection/CollectionManager.tsx) pages that save one section of the Content bundle with `PATCH /api/admin/content {section, value}`, with EN/FR tabs for translatable fields.
- Orders, CRM, messages, bookings, users/writers, blog and settings have their own pages. Settings includes **backup & restore** ([lib/backup.ts](lib/backup.ts), `/api/admin/backup`): JSON export of content/blog/CRM/booking, and import with a dry-run preview and merge or replace mode.

### CRM (admin-only)

Relational, not part of the content bundle. `CrmClient` has many `CrmProject` and `CrmInvoice` (both cascade-delete when the client is deleted). `CrmProject` has a 7-stage status pipeline (`DISCOVERY → PROPOSAL → ACTIVE → REVIEW → COMPLETED`, plus `ON_HOLD`/`CANCELLED`). `CrmInvoice` is auto-numbered (`INV-YYYY-NNN`) and auto-sets `paidAt` when marked `PAID`. Routes: `/api/admin/crm/{clients,projects,invoices}[/[id]]` and `/api/admin/crm/stats` (dashboard KPIs), all guarded by the same admin middleware.

### Media Library (Cloudflare R2)

Media is stored in an S3-compatible Cloudflare R2 bucket under `media/`, organized by key prefixes as pseudo-folders (a folder exists via a `.keep` object). [lib/r2.ts](lib/r2.ts) wraps the S3 client and accepts both `R2_*` and `CLOUDFLARE_R2_*` env names; [lib/getR2Config.ts](lib/getR2Config.ts) falls back to the R2 fields in `ContentBundle.settings` when env vars are absent.

Routes: `/api/admin/media` (GET list / `?search=` / `?all=1`; POST `createFolder` or `copy`; PATCH rename/move a file or a whole folder via `oldPrefix`/`newPrefix`; DELETE files or a folder prefix), `/api/admin/media/upload` (presigned PUT), `/api/admin/media/import`, `/api/admin/media/usage` (which site content references each URL, for the "In use" badge).

The UI is a Drive-style file manager in [components/admin/media/](components/admin/media/): `MediaLibrary` (left nav + folder tree, Recent and type views, context menus via `Menu`, keyboard shortcuts, drag to move, folder upload), `Preview` (full-screen viewer), `Details` (right panel), dialogs in `shared.tsx`. Every admin upload goes through it: `openMediaPicker({ accept, multiple })` from `MediaPicker.tsx` opens the same library in pick mode, and `MediaField` wraps that for forms. Writers (non-admins) upload through `/api/me/upload` instead.

### API routes

Content CRUD is at `/api/admin/content` (GET + PUT). Auth routes are `/api/admin/login` and `/api/admin/logout`. See CRM and Media sections above for their routes; commerce routes are under Shop & Checkout below.

### Authentication

[middleware.ts](middleware.ts) guards every `/admin/*` page (redirect to login) and every `/api/admin/*` route (401), except login/logout. The `admin_session` cookie (name via `ADMIN_COOKIE_NAME`) holds an HMAC-signed, expiring token from [lib/adminSession.ts](lib/adminSession.ts) (Web Crypto, so it runs in Edge middleware too); routes also re-check it with `verifyAdminToken()`. Login flow: `/admin/login` → POST `/api/admin/login` (checks `ADMIN_USER` + `ADMIN_PASS`) → sets the signed httpOnly cookie (8 h).

### Blog (Medium-style)

Posts are relational, **not** in the Content bundle: `Post` (+ `PostRevision`, `Series`), and reader data `Reader`, `Comment` (+ `CommentLike`), `Clap`, `Highlight`, `Bookmark`, `Subscriber`. Migration `20261014000000_add_blog` copied the old `Content.notes` into `Post` (non-destructive; the notes JSON is left as a backup, and `/notes/*` 308-redirects to `/blog/*` via `next.config.mjs`).

- **Body format:** `Post.content` is TipTap/ProseMirror JSON. [lib/blog/render.tsx](lib/blog/render.tsx) renders it server-side to React, and the editor's custom nodes live in [app/admin/blog/editor/nodes.tsx](app/admin/blog/editor/nodes.tsx). **Any new node type must be added to both, with the same attrs.** `contentCard` nodes embed products, projects, experiences or other posts by id; they are resolved at render time from the Content bundle / Post table ([lib/blog/queries.ts](lib/blog/queries.ts) `resolveEmbeds`), so deleted or unpublished items silently drop out. Iframe embeds only come from the provider allow-list in [lib/blog/embeds.ts](lib/blog/embeds.ts).
- **Typography:** [app/blog/story.css](app/blog/story.css) is shared by the public `.story` article and the editor (`.story-editor`), so the editor is WYSIWYG. The serif comes from `next/font` as `--font-serif` on a wrapper element (blog layout / admin blog layout); reference it where used, never via a `:root` variable.
- **Visibility:** always filter with `visibleWhere()` — `PUBLISHED`, or `SCHEDULED` whose `scheduledAt` has passed (scheduling needs no cron). Admins (`isAdminRequest()`) can open drafts at `/blog/<slug>` as a preview.
- **Readers:** next-auth (JWT, no adapter) in [lib/readerAuth.ts](lib/readerAuth.ts), social-only sign-in at `/signin` (and the `AuthPanel` dialog). Each provider (Google, GitHub, LinkedIn, Discord, X, Facebook) is enabled only when its env pair is set, plus a `dev` credentials provider under `next dev` only. `getReader()` returns null for banned readers. This is separate from the admin session.
- **Accounts & writers:** `/me/*` is the reader's account (profile, library, stories, writer status, earnings, settings). Writing needs a `WriterGrant` (scope `UNLIMITED`, `LIMITED` count or `SPECIFIC` posts, optional expiry; without `canPublish` a submit goes to `REVIEW`). Grants come from admin invites (`/api/admin/invites`, accepted at `/join/writer`) or approved writer requests. Writers use the same editor at `/write/[id]` through an environment adapter ([app/admin/blog/editor/env.ts](app/admin/blog/editor/env.ts)) and a writer media adapter.
- **Donations:** Medium-style tips on posts with `donationsEnabled`, paid through Stripe and routed to the writer's Stripe Connect account ([lib/stripe.ts](lib/stripe.ts), `settleDonation()` is idempotent; `/api/webhooks/stripe` handles donation intents and `account.updated`).
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

### i18n (EN / FR)

- **Routing:** French lives under `/fr/*`. [middleware.ts](middleware.ts) rewrites `/fr/...` to the unprefixed route and passes the locale in `x-locale`. The `arden_lang` cookie remembers the choice (`?lang=en` skips the French redirect). Helpers are in [lib/i18n/config.ts](lib/i18n/config.ts) (`localizeHref`, `splitLocale`). On the server, use `getLocale()`, `lhref()` and `alternates()` from [lib/i18n/server.ts](lib/i18n/server.ts); on the client, use `useSite().href()`.
- **UI strings:** most new strings are flat keys in [lib/i18n/ui.ts](lib/i18n/ui.ts) (`uiT(locale)`, `{var}` interpolation; a French entry is required for every key). Blog strings are in [lib/blog/strings.ts](lib/blog/strings.ts). Older sections still use [lib/serverT.ts](lib/serverT.ts) and the i18next resources in [lib/i18n/resources.ts](lib/i18n/resources.ts). Don't import react-i18next from server components.
- **Content:** items in the Content bundle can carry `translations.fr`, which `localize()` in [lib/i18n/content.ts](lib/i18n/content.ts) merges over the English fields. Empty French fields fall back to English.

### Booking

Calendly-style booking modal (`openBooking()`), no `/book` page. `BookingConfig` (weekly rules, notice, horizon, timezone) and `MeetingType` live in Prisma. Slots are computed in [lib/booking/slots.ts](lib/booking/slots.ts) (DST-safe zone math in `time.ts`), excluding existing bookings plus buffers and Google Calendar free/busy when connected (`/admin/bookings/settings`). A booking creates a CRM lead and is self-service at `/booking/[token]` (cancel, .ics).

### Shop, Checkout & Fulfillment

Products live inside `ContentBundle.products` (typed as `ShopProduct[]`). Each product has `id`, `slug`, `price`, `currency`, `priceLabel`, `category` (`platform`/`app`/`document`/`service`), `features`, `media`, optional `fileUrl` (digital download) and `discountCodes`.

Checkout page: `/checkout?product=<slug>` (optional `&code=` or `&ref=` applies a promo code). [app/checkout/page.tsx](app/checkout/page.tsx) loads the product on the server and shows only the payment methods whose keys are configured; `CHECKOUT_METHODS` (comma list) can narrow them further. Flow stays entirely on-site, no redirect:
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
| `GITHUB_ID` / `GITHUB_SECRET`, `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`, `{LINKEDIN,DISCORD,TWITTER,FACEBOOK}_CLIENT_ID` / `_CLIENT_SECRET` | OAuth apps for reader sign-in; each provider appears only when set. The Google app also powers booking Calendar sync (connected from `/admin/bookings/settings`) |
| `STRIPE_CONNECT_WEBHOOK_SECRET` / `DONATION_FEE_PERCENT` | Connect webhook secret (writer payouts) and the platform fee on donations |
| `OWNER_EMAIL` (or `CONTACT_EMAIL`) | Where contact messages, bookings and writer requests are notified |
| `CHECKOUT_METHODS` | Optional comma list restricting checkout methods (`stripe,paystack,mpesa,paypal`) |
| `NEXT_PUBLIC_SITE_URL` | Absolute site URL for emails, RSS, canonical/OG (default `https://ardenbouet.me`) |

Local dev uses `.env.local`; production uses `.env`. R2 credentials can alternatively be set via the Settings tab in the admin UI (stored in `ContentBundle.settings`), which [lib/getR2Config.ts](lib/getR2Config.ts) falls back to when the `R2_*` env vars are absent.
