# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (Next.js with Turbopack)
pnpm build        # Production build
pnpm type-check   # TypeScript check (no emit)

pnpm db:generate  # Generate Drizzle migration from schema changes
pnpm db:migrate   # Run pending migrations
pnpm db:studio    # Open Drizzle Studio (DB GUI)
pnpm db:seed      # Seed DB with default user (test@test.com / admin123)
pnpm db:setup     # Interactive setup to create .env file
```

No test suite is configured.

## Architecture

This is a Next.js 15 (App Router) business management system for Cenma Pinto — an agricultural produce marketplace that tracks provider income, settlements, customer orders, and payments.

### Route Groups

- `app/(login)/` — sign-in / sign-up pages (unauthenticated)
- `app/(dashboard)/` — all authenticated pages under `/dashboard`
- `app/api/` — REST-style API routes used exclusively for client-side SWR data fetching

### Data Fetching Pattern

Two patterns coexist:
1. **Server components** call query functions directly (e.g. `lib/db/queries/income.ts`)
2. **Client components** fetch via SWR hooks (`components/hooks/`) which call the `app/api/` routes

### Server Actions

All mutations use Next.js Server Actions. Two wrappers in `lib/auth/middleware.ts` handle Zod validation:
- `validatedAction(schema, fn)` — no auth required
- `validatedActionWithUser(schema, fn)` — requires authenticated user; also auto-parses JSON-encoded FormData fields (arrays/objects submitted as strings)

### Database

Single schema file: `lib/db/schema.ts`. Query functions are split by domain in `lib/db/queries/`. The ORM is Drizzle with a `postgres` driver.

Key domain tables:
- `providers` + `income` + `income_details` — provider stock intake
- `provider_settlements` + `provider_settlement_details` + `provider_settlement_expenses` + `provider_payments` — settlement/liquidation flow
- `customers` + `customer_orders` + `customer_order_details` + `payments` — sales flow
- `products`, `containers`, `product_classification` — product catalog
- `cash_movements` — cash register
- `users`, `teams`, `team_members`, `activity_logs` — auth/multi-tenancy (from SaaS starter base)

### Auth

JWT stored in an `httpOnly` cookie named `session`. `middleware.ts` protects all `/dashboard` routes and all `/api` routes (returns 401 for API, redirects to `/sign-in` for pages). Token is refreshed on every GET page request.

### Environment Variables

Required in `.env`:
- `POSTGRES_URL` — PostgreSQL connection string
- `AUTH_SECRET` — JWT signing secret (`openssl rand -base64 32`)
- `BASE_URL` — app base URL
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Stripe (payments infra, may be unused in current feature set)
