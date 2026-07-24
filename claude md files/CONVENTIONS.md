# CONVENTIONS.md — Coding Conventions

Minimal, opinionated rules so the codebase stays consistent even when an AI writes most of it. When in doubt, match existing code.

## Language & general

- TypeScript everywhere. No plain `.js` files in the app.
- Prefer clarity over cleverness. Readable code beats short code.
- Small files. If a component passes ~200 lines, split it.
- No dead code, no commented-out blocks left behind.

## Naming

- **Components:** PascalCase files and names — `CampaignCard.tsx`.
- **Functions & variables:** camelCase — `getActiveCampaigns`.
- **Constants:** UPPER_SNAKE_CASE — `MAX_CAMPAIGNS_PER_BUSINESS`.
- **Database tables/columns:** snake_case — `campaigns`, `starts_at`.
- **Booleans read like a question:** `isActive`, `hasSubscription`.
- Names say what things are, not how they're built. `campaign`, not `data2`.

## Components

- One component per file, default export.
- Server Components by default (App Router). Add `"use client"` only when you need state, effects, or browser events.
- Keep components dumb: they receive data via props and render. Fetch data in server components or dedicated functions, not scattered in the UI.
- Reuse shadcn/ui primitives (Button, Card, Input) instead of hand-rolling.
- Loading and empty states are part of the component, not an afterthought.

## Data layer (Supabase)

- All Supabase access goes through helpers in `/lib/supabase`. UI never builds raw queries inline.
- Use the **server** client for anything sensitive; the **anon** client only for public reads.
- Every table has Row Level Security ON with explicit policies. A business owner can only read/write their own rows.
- The `SUPABASE_SERVICE_ROLE_KEY` is server-only and bypasses RLS — use it rarely and never in client code.

## Validation

- Every form and API input is validated with a **zod** schema in `/lib/validations` before use.
- Validate on the server even if you also validate on the client. Client validation is UX; server validation is safety.
- Never insert unvalidated request data into the database.

## Payments (Stripe)

- All secret-key operations and webhook handling live in `/app/api` route handlers (server only).
- Verify the Stripe webhook signature with `STRIPE_WEBHOOK_SECRET` before trusting any webhook.
- Store Stripe IDs (`stripe_customer_id`, `stripe_subscription_id`) on the business; never store card details yourself.
- Develop against Stripe test mode; card `4242 4242 4242 4242` for testing.

## API routes

- Return proper status codes: 200/201 success, 400 bad input, 401 unauthenticated, 403 forbidden, 404 missing, 500 server error.
- Never leak internal errors or stack traces to the client. Log server-side, return a generic message.

## Error handling

- Handle the failure path explicitly — network errors, empty results, unauthorized users.
- User-facing messages are plain and helpful ("Couldn't save your campaign, try again"), not raw errors.

## Styling

- Tailwind utility classes in markup. No separate CSS files unless truly needed.
- Use design tokens/spacing consistently; don't invent random pixel values.
- Mobile-first: build for small screens, then scale up. Local business customers are mostly on phones.

## Git

- Commit small and often, present-tense messages: `add campaign claim flow`.
- One logical change per commit.
- Branch for risky work; merge only when it works.

## Environment & secrets

- All keys in `.env.local`, referenced by name.
- Only `NEXT_PUBLIC_*` variables may appear in browser code. Everything else is server-only.
- Never commit `.env.local`. Keep a `.env.example` with names but no values.
