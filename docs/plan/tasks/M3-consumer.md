# M3 — Consumer entry page (critical path)

> Agent preamble: see `M0-foundation.md`. This is the public attack surface: server-side validation is the source of truth; client validation is UX only. Mobile-first (PDF: consumers arrive from a package QR/code on their phone). Romanian copy per the mockup (page 6).

---

## T3.1 [sonnet] Public campaign page `/c/[slug]`

**Depends:** T0.4 (campaign can be seeded via SQL — does NOT wait for the wizard)
**Files:** `app/c/[slug]/page.tsx`, `components/EntryForm.tsx`, `lib/validations/entry.ts`, `lib/public/campaign.ts`.
**Spec:** Server component fetches the active campaign by slug (server client; only safe fields: name, brand name/logo, hero image, how-to text, code_regex, rules PDF URL, end date). Layout per mockup: brand logo + „Câștigă cu [Brand]!", campaign image, short how-to, form: COD PROMOȚIONAL (uppercase, auto-trim), NUME COMPLET, TELEFON SAU EMAIL, GDPR consent checkbox (required, links to regulament), „ÎNSCRIE CODUL" button. Client-side zod validation incl. live code-format check against the campaign regex. Footer: Regulament oficial · Termeni și condiții. One screen, no login.
**Acceptance:** on a 375 px viewport everything fits one scroll; invalid code format shows inline error before submit; expired/draft campaign slug → „Campania nu este activă" page, not the form.

## T3.2 [STRONG — do not delegate] `POST /api/entries`

**Depends:** T3.1
**Files:** `app/api/entries/route.ts`, `lib/entries/submit.ts`.
**Spec:** Route handler: zod-parse body (`campaignId, code, fullName, contact, gdprConsent`), normalize (trim, uppercase code), then call the `submit_entry` Postgres function (service-role client) which atomically enforces: campaign active + within dates, code matches stored regex, code not already used (when `single_use_codes`), per-IP/hour and per-contact/24h limits from `settings`. Responses: `201 {status:'valid'}`, `400 {error}` for format/window/validation, `409` duplicate, `429` rate-limited. Never leak internals; log server-side. IP from `x-forwarded-for` (Vercel).
**Acceptance:** curl matrix — valid code → 201 and row with `status='valid'`; same code again → 409 and row with `status='duplicate'`; malformed code → 400, row `status='invalid'` (when `block_invalid_format` records rejects); 21st request from one IP within an hour → 429; missing GDPR consent → 400; entry for a `draft` campaign → 400.

## T3.3 [haiku] Consumer UX states

**Depends:** T3.2
**Files:** `components/EntryForm.tsx` (extend), `app/c/[slug]/not-found.tsx`.
**Spec:** Map API responses to Romanian UX states per the PDF: success — „Înscrierea a fost înregistrată" with a clear visual confirmation; duplicate — „Acest cod a fost deja folosit"; invalid — „Codul nu are formatul corect"; rate-limited — „Prea multe încercări, revino mai târziu"; ended — „Campania s-a încheiat". Unknown slug → branded not-found page. No raw error strings anywhere.
**Acceptance:** each state reachable and visually distinct on mobile; form disabled while submitting; success state hides the form.
