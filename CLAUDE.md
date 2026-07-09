# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

This app runs Next.js 16 (App Router) — per AGENTS.md above, consult `node_modules/next/dist/docs/` before writing framework-level code. Two breaking changes already in effect here:
- `src/proxy.ts` exporting a `proxy()` function is the replacement for `middleware.ts`. It guards `/admin/*` via the admin session cookie.
- `params` and `searchParams` in pages are Promises and must be awaited.

## Commands

- `npm run dev` — start dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run lint` — ESLint
- `node scripts/<name>.mjs` — one-off seed scripts (connect to MongoDB directly)

There is no test suite. Requires `.env.local` (MONGODB_URI, SESSION_SECRET, LINE_*, R2_*, SLIP2GO_SECRET_KEY, GOOGLE_PLACES_*).

## What this is

Management system + storefront for a Thai tire shop ("เดอะนัทยาง"). Two surfaces:
- **Public storefront** — `src/app/(public)`: tire catalog, other product categories via the `[...slug]` catch-all, booking, cart, news/promotions, and a customer account area that authenticates with LINE Login.
- **Admin ERP** — `src/app/admin`: products/warehouse/purchasing, bookings, customers, finance & financial documents, payroll/attendance/shifts/leave, warranty claims, settings.

UI text, comments, and domain terms are largely **Thai** — follow that convention in user-facing strings.

## Architecture

Data flow is consistently: **server page → lib query helper → client component → server action**.

- `src/models/*` — Mongoose schemas, one file per collection.
- `src/lib/mongodb.ts` — `connectDB()` singleton; call it before touching any model.
- `src/lib/*` — read-side query helpers. They normalize Mongoose docs to plain objects with `_id` → `id` (string) so they can cross the server/client boundary.
- `src/app/**/page.tsx` — server components that fetch via lib helpers and pass data to a client component (usually in `src/components/admin/*-client.tsx`). DB-backed pages declare `export const dynamic = 'force-dynamic'`.
- `src/app/actions/*` — `'use server'` mutations returning `{ ok: true } | { ok: false; error }`, calling `revalidatePath()` after writes.
- `src/app/api/*` — route handlers only for what actions can't do: file uploads, LINE webhook (`api/line`), LINE Login OAuth (`api/auth/line`), Google reviews.

### Auth

Two independent HMAC-signed cookie sessions using Web Crypto (no JWT/bcrypt libraries):
- **Admin**: `src/lib/auth.ts` — `admin_session` cookie, PBKDF2 password hashing, enforced by `src/proxy.ts` (login/setup pages exempt).
- **Customer**: `src/lib/customer-session.ts` — `customer_session` cookie, created after LINE Login.

Both fall back to a default `SESSION_SECRET` if unset.

### Integrations

- **LINE** — Messaging API notifications for bookings (`src/lib/line.ts`, webhook signature verification) and LINE Login for customers.
- **Cloudflare R2** — object storage via AWS S3 SDK (`src/lib/r2.ts`); public URLs use `NEXT_PUBLIC_R2_URL`.
- **Slip2Go** — Thai bank transfer slip verification (`src/lib/slip2go.ts`).

### UI

Tailwind CSS 4 (config lives in `src/app/globals.css`, no tailwind.config) with shadcn components in `src/components/ui`. Note: this shadcn setup uses the `base-nova` style built on `@base-ui/react`, **not Radix** — generate new components with the shadcn CLI rather than copying Radix-based snippets from memory.
