# M4 — Dashboard & reports

> Agent preamble: see `M0-foundation.md`. Layout per the PDF dashboard mockup (page 7). All queries via `lib/supabase` server client — the brand member's own campaigns only (RLS enforces it; do not use the service client here).

---

## T4.1 [sonnet] Stat cards + entries table

**Depends:** T3.2 (needs real entries to display)
**Files:** `app/(dashboard)/dashboard/campaigns/[id]/page.tsx`, `app/(dashboard)/dashboard/campaigns/[id]/entries/page.tsx`, `components/StatCard.tsx`, `components/EntriesTable.tsx`.
**Spec:** Campaign overview per mockup: 4 stat cards — ÎNSCRIERI TOTALE, CODURI VALIDE, RESPINSE (duplicat/invalid), ZILE RĂMASE. Entries table: cod, participant, dată, status badge (valid/duplicat/invalid), newest first, server-side pagination (50/page), status filter.
**Acceptance:** numbers match SQL counts for the seeded campaign; pagination and filter work; another brand's campaign id → 404 (RLS), verified manually.

## T4.2 [sonnet] Entries-over-time chart

**Depends:** T4.1
**Files:** `components/EntriesChart.tsx`, `lib/queries/entries-by-day.ts`.
**Spec:** Daily entry counts (valid vs rejected stacked or two series) for the campaign window using shadcn/ui charts (recharts — already transitively allowed; no other chart lib). Server-aggregated (`date_trunc('day')`), passed to a client chart component. Empty state for campaigns with no entries.
**Acceptance:** chart matches a hand-checked day's count; renders on mobile width; no client-side fetching of raw entries.

## T4.3 [sonnet] CSV export — eligible participants

**Depends:** T4.1
**Files:** `app/api/campaigns/[id]/export/route.ts`, `lib/csv/serialize.ts`.
**Spec:** Route handler streams `text/csv` (UTF-8 BOM so Excel opens diacritics correctly) of `status='valid'` entries: cod, nume, contact, data. Auth: brand member of that campaign (401/403/404 as per CONVENTIONS). Hand-rolled serializer with proper quoting in `lib/csv/serialize.ts` (shared with T5.2).
**Acceptance:** `curl` as member downloads N rows = valid count; values containing commas/quotes round-trip correctly in Excel; anonymous request → 401.
