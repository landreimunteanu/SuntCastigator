# CLAUDE.md — Project Context (SuntCastigator)

> Read this first. Working method: `claude md files/AI-CODING-PLAYBOOK.md`. Coding rules: `claude md files/CONVENTIONS.md`. Product blueprint: `claude md files/BackBoneNotion/SuntCastigator.pdf`. Work plan & task cards: `docs/plan/`.
> When something in here becomes wrong, fix it immediately.

## What we're building

A B2B2C platform where **mid-size Romanian brands (FMCG/retail) run "enter the promo code, win a prize" contests** without an agency rebuilding a microsite per campaign (suntcastigator.ro).

Three types of users:
- **Consumers** — open a public campaign page, enter a code + minimal contact info, no account.
- **Brand managers** — log in with a magic link, configure campaigns via a 4-step wizard, watch a live dashboard, run auditable winner draws.
- **Operator (us)** — onboards brands (no self-signup at MVP), moderates, runs the platform.

Core objects: `brands`, `campaigns` (a contest), `products` (eligible SKUs), `code_entries` (a consumer submission), `prize_tiers`, `draws`/`winners`, `settings`.

**MVP explicitly excludes:** native apps, receipt OCR, brand self-service signup, ML fraud detection, Stripe payments (brands are invoiced manually for now).

## Tech stack (do not change without asking)

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database + Auth + Storage:** Supabase (Postgres, Row Level Security, magic-link Auth, Storage for rules PDFs)
- **Hosting:** Vercel (GitHub Pages only serves the temporary landing until DNS cutover — see `docs/plan/HOSTING.md`)
- **Package manager:** pnpm — never mix with npm

## Golden rules for the AI

1. **Follow the stack above.** No new library, ORM, or auth system without asking. Allowed deps: next, react, tailwind, shadcn/ui (+ radix/recharts), @supabase/supabase-js, @supabase/ssr, zod.
2. **Small changes.** One task card (`docs/plan/tasks/`) at a time; say how to verify before moving on.
3. **Ask before deleting or rewriting** files that already work.
4. **Never invent APIs.** Unsure how a Supabase call works → say so.
5. **Security is not optional.** RLS on every table. Never trust the browser. Service key server-only. Public entry submissions go ONLY through `POST /api/entries` → `submit_entry()` SQL function.
6. **No secrets in code.** Keys live in `.env.local`, referenced by name.
7. **Never generate legal text** (regulament, T&C) — placeholders only; a human provides the wording.
8. Ambiguous request → **ask one clarifying question**, don't guess big.
9. Tasks marked **[STRONG]** in the task cards (schema/RLS, `/api/entries`, draw engine, security review) are not for weaker agents.

## Folder structure

```
/app
  /(marketing)        # public landing + legal pages
  /c/[slug]           # public consumer entry page (mobile-first, Romanian)
  /(dashboard)        # brand area (magic-link auth required)
  /api                # route handlers: entries, CSV export, draw, health
/components           # reusable UI (shadcn/ui based)
/lib
  /supabase           # server + browser clients (ALL db access goes through here)
  /validations        # zod schemas for every form/input
  /actions            # server actions (dashboard mutations)
/supabase/migrations  # SQL migrations + RLS policies
/types
/docs/plan            # roadmap, architecture, hosting, task cards
```

## Data model (keep in sync with supabase/migrations)

- **brands** — id, name, slug, logo_url
- **brand_users** — brand_id, user_id (→ auth), role owner/editor
- **products** — id, brand_id, sku, name (CSV-uploaded)
- **campaigns** — id, brand_id, name, slug, status draft/active/ended, starts_at, ends_at, code_length, code_charset, code_regex, single_use_codes, block_invalid_format, limit_per_contact_24h, rules_pdf_path
- **campaign_products** — m2m
- **prize_tiers** — campaign_id, name, quantity (null = unlimited), value_lei, kind instant/draw, taxable (>600 lei rule, threshold+rate in settings)
- **code_entries** — campaign_id, code, full_name, contact, ip, status valid/duplicate/invalid, gdpr_consent_at
- **draws** — campaign_id, prize_tier_id, seed, participant_count, participants_hash, ran_by, ran_at (auditable, reproducible)
- **winners** — draw_id, entry_id, position
- **settings** — key/value jsonb (tax threshold/rate, rate limits)

Full DDL and the requirement→mechanism map: `docs/plan/ARCHITECTURE.md`.

## Environment variables (names only — real values in .env.local)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY      # server only, never exposed to browser
```

## Definition of done for any feature

- Works end to end, verifiable in the browser (consumer flows checked at 375 px width).
- Inputs validated with a zod schema — client for UX, server for safety.
- Database access respects RLS; cross-brand access impossible.
- Romanian UI copy on consumer-facing pages.
- No secret keys client-side; no new dependencies without asking.
