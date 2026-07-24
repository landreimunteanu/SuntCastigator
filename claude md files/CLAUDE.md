# CLAUDE.md — Project Context

> This is the single most important file for vibe coding. Your AI assistant reads it first.
> Keep it accurate and up to date. When something in here becomes wrong, fix it immediately.

## What we're building

A web platform where **local businesses post promotional campaigns** and **customers browse and claim deals**.

Three types of users:
- **Visitors / customers** — browse campaigns, view deal details, claim/redeem offers.
- **Business owners** — sign up, create and manage their own campaigns, pay to list.
- **Admins** — moderate campaigns and businesses.

Core objects: `Business`, `Campaign` (a promotion/deal), `Claim` (a customer claiming a deal), `Subscription`/`Payment`.

## Tech stack (do not change without asking)

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database + Auth:** Supabase (Postgres, Row Level Security, Supabase Auth)
- **Payments:** Stripe (Checkout + webhooks)
- **Hosting:** Vercel
- **Package manager:** pnpm (or npm — pick one and never mix)

## Golden rules for the AI

1. **Follow the stack above.** Don't introduce a new library, ORM, or auth system to solve a problem the stack already solves. If you think we need one, say so and wait.
2. **Small changes.** Change one thing at a time. After each change, tell me how to verify it works before moving on.
3. **Ask before deleting or rewriting** files that already work.
4. **Never invent APIs.** If unsure how a Supabase or Stripe call works, say so — don't guess a method name.
5. **Security is not optional.** Every database table has Row Level Security. Never trust data coming from the browser. Never put secret keys in client code.
6. **No secrets in code.** All keys live in `.env.local` and are referenced by name only.
7. If a request is ambiguous, **ask one clarifying question** instead of guessing big.

## Folder structure

```
/app
  /(marketing)        # public landing + campaign browsing pages
  /(dashboard)        # business owner area (auth required)
  /api                # route handlers (Stripe webhooks, etc.)
/components           # reusable UI (shadcn/ui lives here too)
/lib
  /supabase           # client + server Supabase helpers
  /stripe             # Stripe helpers
  /validations        # zod schemas for all forms/inputs
/types                # shared TypeScript types
```

## Data model (keep in sync with the DB)

- **businesses** — id, owner_id (→ auth user), name, description, logo_url, created_at
- **campaigns** — id, business_id, title, description, discount, starts_at, ends_at, status (draft/active/expired), created_at
- **claims** — id, campaign_id, customer_id, claimed_at, redeemed (bool)
- **subscriptions** — id, business_id, stripe_customer_id, stripe_subscription_id, status

## Environment variables (names only — real values in .env.local)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY      # server only, never exposed to browser
STRIPE_SECRET_KEY              # server only
STRIPE_WEBHOOK_SECRET         # server only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

## Definition of done for any feature

- Works end to end and I could verify it in the browser.
- Inputs validated with a zod schema.
- Database access respects Row Level Security.
- No secret keys in client-side code.
- No new dependencies added without asking.
