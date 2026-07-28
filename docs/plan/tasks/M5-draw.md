# M5 — Winner extraction (auditable)

> Agent preamble: see `M0-foundation.md`. The draw must be **reproducible**: given the recorded seed and the participant snapshot, anyone can replay it and get the same winners (defense in disputes — PDF page 12).

---

## T5.1 [STRONG — do not delegate] Draw engine

**Depends:** T4.1
**Files:** `lib/draw/engine.ts`, `lib/draw/engine.test.ts`, `app/api/campaigns/[id]/draw/route.ts`.
**Spec:** `runDraw(campaignId, prizeTierId)`: snapshot eligible entries (`status='valid'`, one row per entry) ordered deterministically by `id`; `participants_hash` = SHA-256 over the ordered entry-id list; seed = 16-hex-char from `crypto.getRandomValues`; seeded PRNG (mulberry32, implemented inline — no deps) + Fisher–Yates; take `quantity` winners; persist `draws` (seed, participant_count, participants_hash, ran_by, ran_at) + `winners` (position) in one transaction; a tier that already has a draw cannot be re-drawn (409). Route handler restricted to brand `owner`. Unit tests: same seed + same snapshot ⇒ identical winners; different seed ⇒ different order; hash changes if the snapshot changes.
**Acceptance:** tests pass; replaying with the stored seed against the stored snapshot reproduces the winners exactly; re-draw attempt → 409.

## T5.2 [sonnet] Extraction UI + winners CSV

**Depends:** T5.1
**Files:** `app/(dashboard)/dashboard/campaigns/[id]/draw/page.tsx`, `components/DrawPanel.tsx`, `app/api/draws/[id]/export/route.ts`.
**Spec:** Per mockup (page 12): eligible-participants count, prize-tier selector (instant tiers excluded — marked „auto"), „🎲 Rulează extragerea" button calling the draw endpoint, winners list (position, masked contact e.g. `07xx xxx 412`, code), audit note showing seed + timestamp + who ran it, CSV export of winners including `participants_hash` and seed in a header comment row.
**Acceptance:** running a draw shows winners and the audit line; the CSV contains hash + seed; already-drawn tier shows its past result instead of the button.

## T5.3 [haiku] Winner notification (manual at MVP)

**Depends:** T5.2
**Files:** `components/DrawPanel.tsx` (extend).
**Spec:** No automated sending at MVP (per PDF, prize delivery stays with the brand). Add: „Copiază lista" (clipboard, tab-separated) and, when contacts are emails, a `mailto:` link with BCC list prefilled. Romanian labels.
**Acceptance:** clipboard content pastes cleanly into Excel; mailto opens with winners in BCC.
