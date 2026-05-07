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

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma DB connection (postgres in prod, SQLite path in dev) |

Local dev uses `.env.development.local`; production uses `.env`.
