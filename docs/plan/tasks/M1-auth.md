# M1 — Auth & tenancy

> Agent preamble: see `M0-foundation.md`. All auth uses Supabase Auth — never hand-roll sessions or JWTs.

---

## T1.1 [sonnet] Magic-link login

**Depends:** T0.4
**Files:** `app/login/page.tsx`, `app/auth/callback/route.ts`, `lib/validations/auth.ts`, `components/LoginForm.tsx`.
**Spec:** `/login` with a single email field (zod-validated, Romanian copy: „Îți trimitem un link de conectare pe email"). `signInWithOtp` → email magic link → `/auth/callback` exchanges the code and redirects to `/dashboard`. Include sign-out (server action) exposed in the dashboard layout later.
**Acceptance:** full round-trip works against the dev Supabase project (use Supabase local email capture or a test inbox); wrong email format shows inline error; already-authenticated visit to `/login` redirects to `/dashboard`.

## T1.2 [sonnet] Dashboard shell + route protection + brand context

**Depends:** T1.1
**Files:** `middleware.ts`, `app/(dashboard)/layout.tsx`, `lib/supabase/get-brand.ts`.
**Spec:** Middleware refreshes the Supabase session and redirects unauthenticated users hitting `(dashboard)` routes to `/login`. Dashboard layout: sidebar (Campanii, Înscrieri, Extragere, Rapoarte, Setări — per the PDF mockup), header with brand name + user email + sign-out. `getCurrentBrand()` helper resolves the user's brand via `brand_users` (v1: first membership; error page if none).
**Acceptance:** anonymous `/dashboard` → redirected to `/login`; logged-in user with a seeded membership sees the shell with their brand name; user without membership sees a clear "no brand" message, not a crash.

## T1.3 [sonnet] Roles helper + brand seeding script

**Depends:** T1.2
**Files:** `lib/auth/roles.ts`, `scripts/seed-brand.ts`, `package.json` (script entry only).
**Spec:** `requireRole('owner' | 'editor')` helper for server actions/handlers (owner ⊃ editor). `scripts/seed-brand.ts` (run with service key, operator-only): creates a brand + invites a user by email + membership row — this is how brands onboard at MVP (no self-signup).
**Acceptance:** unit test for role logic; running the script creates brand + membership visible in the dashboard; editor calling an owner-only action gets 403.
