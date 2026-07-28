# M0 — Foundation (sequential)

> Agent preamble (paste with every task): *Follow `CLAUDE.md` and `claude md files/CONVENTIONS.md`. Make the smallest change that solves the task. No new dependencies. Touch only the files listed. Explain your approach before writing code. After the change, state exactly how to verify it.*

---

## T0.1 [sonnet] Scaffold Next.js + port landing page

**Depends:** — (first task)
**Files:** new app scaffold at repo root; `app/(marketing)/page.tsx`; keep `index.html` untouched (still serving GitHub Pages until DNS cutover).
**Spec:** Scaffold Next.js (App Router, TypeScript, Tailwind) with pnpm; init shadcn/ui; create the folder structure from `CLAUDE.md` (`app/(marketing)`, `app/(dashboard)`, `app/api`, `components`, `lib/supabase`, `lib/validations`, `types`). Port the existing `index.html` ("În construcție" page) into `app/(marketing)/page.tsx` preserving the visual design (gradient, card, trophy, names badges, year script → server-rendered year).
**Acceptance:** `pnpm dev` → `http://localhost:3000/` renders the landing visually identical to `index.html`; `pnpm build` passes; no `.js` files in `app/`.

## T0.2 [sonnet] Supabase clients + env plumbing + health check

**Depends:** T0.1 (and a Supabase project created by the operator)
**Files:** `lib/supabase/server.ts`, `lib/supabase/client.ts`, `.env.example`, `app/api/health/route.ts`.
**Spec:** Add `@supabase/supabase-js` + `@supabase/ssr`. Server client (cookies-aware) and browser client helpers per Supabase SSR docs — all DB access must go through these. `.env.example` lists `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (names only). `GET /api/health` runs `select 1` server-side and returns `{ ok: true }`.
**Acceptance:** `curl localhost:3000/api/health` → `200 {"ok":true}`; `.env.local` gitignored; service key referenced only in server code.

## T0.3 [haiku] Vercel deploy + DNS cutover runbook

**Depends:** T0.1
**Files:** `docs/plan/DEPLOY.md` (new).
**Spec:** Document (do not execute): create Vercel project from the GitHub repo, set env vars, get the preview URL; the DNS cutover steps from `docs/plan/HOSTING.md` (apex A `76.76.21.21`, `www` CNAME `cname.vercel-dns.com`, verify with `nslookup`, then disable GitHub Pages). Operator performs the clicks.
**Acceptance:** runbook is complete enough that the operator can execute it without asking anything.

## T0.4 [STRONG — do not delegate] Schema v1 + RLS

**Depends:** T0.2
**Files:** `supabase/migrations/0001_init.sql`, `supabase/seed.sql`.
**Spec:** Implement the full DDL from `docs/plan/ARCHITECTURE.md` (all tables, indexes, constraints), `is_brand_member()` helper, RLS ON for every table with the policies outlined there, `submit_entry()` SECURITY DEFINER function (format regex check, campaign active window, duplicate check, per-IP/hour and per-contact/24h rate checks from `settings`, insert with proper status), seed `settings` rows.
**Acceptance:** migration applies cleanly on a fresh project; SQL smoke tests prove: member of brand A cannot SELECT brand B rows; anon cannot INSERT into `code_entries` directly; `submit_entry` rejects duplicate and malformed codes and enforces rate limits.

## T0.5 [haiku] Update root CLAUDE.md with final data model

**Depends:** T0.4
**Files:** `CLAUDE.md`.
**Spec:** Sync the data-model section of root `CLAUDE.md` with the actually-applied migration (table names/columns as built). No other sections touched.
**Acceptance:** every table/column mentioned in `CLAUDE.md` exists in `0001_init.sql`.
