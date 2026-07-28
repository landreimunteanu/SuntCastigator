# M2 — Campaign wizard

> Agent preamble: see `M0-foundation.md`. T2.1–T2.4 can run in parallel (different agents) once T2.0 is merged. All form inputs get zod schemas in `lib/validations/` and are re-validated in the server action. UI copy in Romanian, matching the PDF mockups (pages 8–11).

---

## T2.0 [sonnet] Wizard shell + draft autosave

**Depends:** T1.2
**Files:** `app/(dashboard)/dashboard/campaigns/new/page.tsx`, `components/wizard/WizardStepper.tsx`, `lib/actions/campaigns.ts`, `lib/validations/campaign.ts`.
**Spec:** 4-step stepper (Produse → Format cod → Premii → Date & regulament) per the PDF mockup. Creating a wizard creates a `campaigns` row with `status='draft'`; each step saves via a server action (`updateCampaignDraft`) so a half-finished campaign survives reload; steps 2–4 render placeholder content (filled by T2.2–T2.4). Back/Continue navigation; a draft can be reopened from the list.
**Acceptance:** starting the wizard creates a draft row; refresh mid-wizard restores state; navigation between steps works; campaign stays `draft`.

## T2.1 [sonnet] Step 1 — Eligible products (CSV + search + select)

**Depends:** T2.0
**Files:** `components/wizard/StepProducts.tsx`, `lib/actions/products.ts`, `lib/csv/parse.ts`, `lib/validations/product.ts`.
**Spec:** CSV upload (`sku,name` header row; hand-rolled parser in `lib/csv/parse.ts` — no new deps) upserting into `products` for the brand; searchable list (Postgres ILIKE on name/SKU, server-side); checkbox multi-select persisted to `campaign_products`; „N produse selectate din M disponibile" footer per mockup.
**Acceptance:** uploading a 50-row CSV shows 50 products; malformed rows are reported (row number + reason) not silently dropped; search „salam" filters; selection survives step navigation.

## T2.2 [sonnet] Step 2 — Code format

**Depends:** T2.0
**Files:** `components/wizard/StepCodeFormat.tsx`, `lib/code-format.ts`, `lib/code-format.test.ts`, `lib/validations/campaign.ts` (extend).
**Spec:** Pure function `buildCodeRegex(length: number, charset: 'letters'|'digits'|'alphanumeric'): string` in `lib/code-format.ts` with unit tests (6–14 enforced; anchors; charset classes). UI: length input, charset select, live format preview (e.g. `A B 3 X 9 K Q 7 M 2`), three toggles (single-use code, block invalid formats, limit entries per contact/24h) per mockup. Server action stores `code_regex` + toggles on the draft.
**Acceptance:** tests pass (`length=10, alphanumeric` → regex matches `AB3X9KQ7M2`, rejects `ab3!` and wrong lengths); preview updates live; values persist.

## T2.3 [sonnet] Step 3 — Prize tiers + tax

**Depends:** T2.0
**Files:** `components/wizard/StepPrizes.tsx`, `lib/actions/prizes.ts`, `lib/prize-tax.ts`, `lib/validations/prize.ts`.
**Spec:** Inline CRUD for `prize_tiers` (name, quantity — empty = „Nelimitat", value in lei, kind: `instant`/`draw` shown as Instant-win / Extragere finală). `lib/prize-tax.ts` reads threshold + rate from `settings` and computes withheld tax; rows above threshold get the `taxable` flag and the warning banner from the mockup („Premiile peste 600 lei/câștigător sunt impozitate…").
**Acceptance:** adding „Voucher 1.000 lei" marks it taxable and shows computed tax; a 500-lei prize does not; tiers persist and reorder via `sort_order`.

## T2.4 [sonnet] Step 4 — Dates, rules PDF, launch

**Depends:** T2.0 (uses storage bucket from T0.4)
**Files:** `components/wizard/StepLaunch.tsx`, `lib/actions/launch.ts`, `lib/storage/rules.ts`.
**Spec:** Start/end date pickers; PDF upload (max 10 MB, `application/pdf` only) via server action into the `regulamente` bucket, path stored on the campaign; campaign summary card (products count, code format, tiers, duration) per mockup; compliance checkbox (required); „Lansează campania" validates ALL steps complete (products ≥1, regex set, ≥1 tier, dates valid, PDF uploaded, checkbox) then sets `status='active'` and generates the public slug (`brand-slug + campaign name`, kebab-case, unique).
**Acceptance:** launch blocked with a per-step error list if anything is missing; on success status is `active` and `/c/[slug]` URL is shown; uploaded PDF opens from the summary.

## T2.5 [haiku] Campaign list page

**Depends:** T2.0
**Files:** `app/(dashboard)/dashboard/campaigns/page.tsx`, `components/CampaignCard.tsx`.
**Spec:** List the brand's campaigns with status badges (draft/activ/încheiat), dates, entry count, „+ Campanie nouă" button, link to the public page for active ones, „Continuă configurarea" for drafts.
**Acceptance:** seeded campaigns render with correct badges; empty state shows a friendly Romanian message with the CTA.
