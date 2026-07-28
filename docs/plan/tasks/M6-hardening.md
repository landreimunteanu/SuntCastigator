# M6 — Hardening, legal, launch

> Agent preamble: see `M0-foundation.md`.

---

## T6.1 [STRONG — do not delegate] Security review

**Depends:** M2–M5 complete
**Files:** review only; fixes as separate follow-up tasks.
**Spec:** Full pass: (1) cross-tenant test — user of brand A attempts every dashboard route/action/API with brand B ids (expect 403/404 via RLS); (2) grep proof that `SUPABASE_SERVICE_ROLE_KEY` appears only in server-only modules; (3) every mutation has a zod schema server-side; (4) rate-limit tuning on `/api/entries` under a burst script; (5) storage bucket policies (rules PDFs public-read only, upload server-only); (6) security headers on `/c/[slug]` and API responses; (7) no internal errors leaked to clients.
**Acceptance:** written findings list with severity; all criticals fixed and re-verified before launch.

## T6.2 [sonnet] GDPR & legal pages

**Depends:** T3.2
**Files:** `app/(marketing)/termeni/page.tsx`, `app/(marketing)/confidentialitate/page.tsx`, `scripts/delete-participant.ts`.
**Spec:** Static Romanian pages for Termeni și condiții and Politica de confidențialitate — **content provided by Lucian/lawyer, NOT AI-generated** (explicit PDF requirement for legal text; use `[DE COMPLETAT]` placeholders where text is missing). Consumer entry already stores `gdpr_consent_at` (T0.4). `scripts/delete-participant.ts`: operator script (service key) that deletes/anonymizes all `code_entries` rows for a given contact — GDPR erasure request path.
**Acceptance:** pages linked from the consumer-page footer; erasure script removes the contact from all campaigns and prints a summary; placeholders clearly visible where legal text is pending.

## T6.3 [operator + STRONG] UAT — "criteriu de gata"

**Depends:** everything
**Files:** `docs/plan/UAT.md` (checklist, filled during the session).
**Spec:** Simulate the PDF's readiness criterion end-to-end with a real brand persona: operator seeds the brand; brand user logs in via magic link and configures a full campaign through the wizard **without technical help**; 20+ consumer entries from phones (valid, duplicate, invalid, rate-limit); dashboard numbers correct; CSV export; draw run + reproduced from seed; winners exported.
**Acceptance:** every checklist item passes; failures become tasks before launch.

## T6.4 [sonnet] Real marketing landing

**Depends:** T0.1 (independent of everything else — can run anytime)
**Files:** `app/(marketing)/page.tsx`, `components/marketing/*`.
**Spec:** Replace the „În construcție" content with a product landing (Romanian): hero („Concursuri cu coduri pentru brandul tău — live în zile, nu săptămâni"), 3 value props (configurare simplă, anti-fraudă automat, extragere auditabilă), how-it-works (3 steps), CTA contact (mailto — no form backend at MVP). Keep the existing visual identity (gradient/gold).
**Acceptance:** lighthouse mobile ≥ 90 performance; renders correctly at 375 px and 1440 px; single CTA above the fold.
