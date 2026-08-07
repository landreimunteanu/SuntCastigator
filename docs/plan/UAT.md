# UAT — „Criteriu de gata" (T6.3)

> One continuous run-through of the whole product as a real brand would use it,
> on **test.suntcastigator.ro**. The point is to catch what only breaks when the
> pieces connect. Do it in one sitting (~30–45 min). Tick each box; anything that
> fails goes in the **Failures** section at the bottom and becomes a fix task.
>
> Rule that matters most: in step 2 the brand user configures a full campaign
> **without technical help**. If you get stuck and need to read code or ask, that
> is itself a finding — note it.

**Run date:** _______  **Run by:** _______  **Result:** ☐ PASS ☐ FAIL

---

## 0. Operator seeds the brand

The operator (you, with the service key) creates the brand and invites the user.
No self-signup exists at MVP — this is the only way a brand gets in.

```bash
pnpm seed:brand --name "UAT Brand" --slug uat-brand --email <your-inbox>@example.com --role owner
```

- ☐ Command prints `invited new user … magic-link email sent` (or `found existing user`)
- ☐ Command prints `created brand "UAT Brand"` and `membership … "owner"`
- ☐ Use an inbox you can actually open (the magic link lands there)

> Role **must be `owner`** — running a draw (step 6) is owner-only. An `editor`
> will be blocked at the draw step by design.

---

## 1. Magic-link login (no technical help)

- ☐ Open `https://test.suntcastigator.ro/` → click **„Sunt brand — Conectare"**
- ☐ On `/login`, enter the seeded email → submit
- ☐ Inline message confirms the link was sent
- ☐ Open the email, click the magic link
- ☐ Land on `/dashboard` showing **„Bun venit, UAT Brand"**
- ☐ Wrong email format shows an inline error (try `not-an-email` first)

---

## 2. Configure a full campaign through the wizard

Start: `/dashboard` → **„+ Campanie nouă"**. Four steps: Produse → Format cod →
Premii → Date & regulament.

### 2a. Produse eligibile
Prepare a small CSV (save as `produse.csv`):

```csv
sku,name
SKU-001,Suc de portocale 1L
SKU-002,Apă minerală 2L
SKU-003,Baton cereale 40g
```

- ☐ Upload the CSV → all 3 products appear
- ☐ (Optional) add a malformed row and confirm it's reported by row number, not silently dropped
- ☐ Search „apă" filters the list
- ☐ Select at least 1 product → footer shows „N produse selectate din M"
- ☐ Continue; go **Back** once and confirm the selection is still there

### 2b. Format cod
- ☐ Set **length = 10**, **charset = alphanumeric** (recommended — the test codes below match this)
- ☐ Live preview updates as you change length/charset
- ☐ Leave **„blochează formatele invalide"** ON (so invalid entries are recorded)
- ☐ Continue

### 2c. Premii
- ☐ Add a **draw** tier: name „Extragere finală", quantity **3**, value e.g. 200 lei
- ☐ (Optional) add an **instant** tier and a >600 lei tier — confirm the >600 one shows the tax warning
- ☐ Continue

### 2d. Date & regulament + lansare
- ☐ Set start = today, end = a few days out
- ☐ Upload any PDF as the regulament (≤10 MB)
- ☐ Tick the compliance checkbox
- ☐ Click **„Lansează campania"**
- ☐ If anything is missing, launch is **blocked with a per-step error list** (try it once with the PDF missing to confirm)
- ☐ On success: status becomes **activă** and the public `/c/<slug>` URL is shown
- ☐ Open the shown URL — the public page loads

---

## 3. 20+ consumer entries from a phone

Open `/c/<slug>` **on your phone**. The codes below match length-10 alphanumeric —
if you chose a different format in 2b, adjust them.

**Valid codes (type 20 different ones, each a real submission):**

```
ABCD1234EF  GHJK5678LM  NPQR9012ST  UVWX3456YZ  AB12CD34EF
GH56JK78LM  NP90QR12ST  UV34WX56YZ  A1B2C3D4E5  F6G7H8J9K0
L1M2N3P4Q5  R6S7T8U9V0  W1X2Y3Z4A5  B6C7D8E9F0  G1H2J3K4L5
M6N7P8Q9R0  S1T2U3V4W5  X6Y7Z8A9B0  C1D2E3F4G5  H6J7K8L9M0
```

- ☐ Submit ~20 valid codes → each shows **„Înscrierea a fost înregistrată"**
- ☐ Fill NUME COMPLET + a phone/email each time; the GDPR checkbox is required (try submitting without it → blocked)

**Duplicate:** re-submit `ABCD1234EF`
- ☐ Shows **„Acest cod a fost deja folosit"** (duplicate state)

**Invalid format:** submit `bad!code` and `SHORT`
- ☐ Shows **„Codul nu are formatul corect"** before/at submit

**Rate limit:** submit rapidly from the same phone past the limit
- ☐ Eventually shows **„Prea multe încercări, revino mai târziu"**

---

## 4. Dashboard numbers are correct

Back in the dashboard: `/dashboard/campaigns/<id>`.

- ☐ **ÎNSCRIERI TOTALE** = every submission you made (valid + duplicate + invalid)
- ☐ **CODURI VALIDE** = the ~20 distinct valid ones
- ☐ **RESPINSE** = duplicates + invalids
- ☐ **ZILE RĂMASE** matches the end date you set
- ☐ Entries table: newest first, correct status badges, filter by status works
- ☐ Chart shows today's entries; the count matches a hand-count for today

---

## 5. CSV export of participants

- ☐ Click the export button → a CSV downloads
- ☐ Row count = number of **valid** entries
- ☐ Opens in Excel with correct diacritics (ă/â/ț); a name with a comma stays in one cell

---

## 6. Draw + reproduce from seed

`/dashboard/campaigns/<id>` → **„🎲 Extragere câștigători"**.

- ☐ Instant tiers are marked „Automat" (not drawable)
- ☐ For the **draw** tier, click **„Rulează extragerea"**
- ☐ 3 winners appear with masked contacts + position
- ☐ Audit line shows **seed + timestamp + who ran it**
- ☐ Click the tier again → it shows the **past result**, not the run button (can't re-draw)
- ☐ **Reproducibility:** the seed is recorded; re-running the engine against the stored seed + snapshot yields the same winners (auditable — this is the dispute defense)

---

## 7. Export winners

- ☐ Export winners CSV
- ☐ File contains the **seed + participants_hash** header comment row
- ☐ Winner rows match what's shown on screen
- ☐ (Optional) „Copiază lista" pastes cleanly into Excel; if contacts are emails, the `mailto:` BCC link opens with winners prefilled

---

## Failures / findings

> Anything unticked above, plus anything confusing, slow, or that needed
> technical help. Each becomes a fix task before launch.

| # | Step | What happened | Expected |
|---|------|---------------|----------|
|   |      |               |          |
|   |      |               |          |

---

## Cleanup (after the run)

- ☐ The UAT campaign/entries can stay on `test.` or be removed via the service key
- ☐ To erase a test participant's PII: `pnpm gdpr:erase --contact "<value>" --dry-run` then without `--dry-run`
