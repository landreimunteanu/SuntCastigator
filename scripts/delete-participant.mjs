#!/usr/bin/env node
// Operator-only GDPR erasure ("dreptul de a fi uitat"): anonymizes every
// code_entries row for a given contact, across ALL campaigns.
//
// Usage:
//   pnpm gdpr:erase --contact "0722 123 456"
//   pnpm gdpr:erase --contact person@example.com --dry-run
//
// Why ANONYMIZE and not DELETE:
//   * winners.entry_id references code_entries(id) with NO cascade — a hard
//     delete of a winning entry would fail the foreign key.
//   * draws.participants_hash is computed over the ordered entry-id list, so
//     nulling the PII columns keeps every past draw reproducible/auditable.
//   Anonymization removes the identifying data (name, contact, IP) while
//   preserving referential integrity and the audit trail. That satisfies the
//   erasure request without corrupting historical draws.
//
// Requires SUPABASE_SERVICE_ROLE_KEY in the environment (from .env.local when
// run locally). The service role bypasses RLS — operator-only, never shipped
// to the browser.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");

// Tombstone values written over the PII columns. code_entries.full_name and
// code_entries.contact are NOT NULL, so we overwrite with a marker rather than
// NULL; ip is nullable and is cleared outright.
const REDACTED_NAME = "[date șterse GDPR]";
const REDACTED_CONTACT = "[șters GDPR]";

function loadDotEnvLocal() {
  const path = resolve(REPO_ROOT, ".env.local");
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const [, key, rawVal] = m;
    if (process.env[key]) continue;
    let val = rawVal.trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!key?.startsWith("--")) {
      throw new Error(`Bad argument at position ${i}: ${key}`);
    }
    // boolean flag (no value / next token is another flag)
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      out[key.slice(2)] = true;
    } else {
      out[key.slice(2)] = next;
      i++;
    }
  }
  return out;
}

function die(msg, code = 1) {
  console.error(`ERROR: ${msg}`);
  process.exit(code);
}

loadDotEnvLocal();

const args = parseArgs(process.argv.slice(2));
const contact = typeof args.contact === "string" ? args.contact.trim() : "";
const dryRun = Boolean(args["dry-run"]);

if (!contact) {
  die(
    'Missing --contact. Usage: pnpm gdpr:erase --contact "email-sau-telefon" [--dry-run]',
  );
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) die("NEXT_PUBLIC_SUPABASE_URL not set");
if (!serviceKey) die("SUPABASE_SERVICE_ROLE_KEY not set");

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

try {
  // 1. Find every entry for this contact across all campaigns.
  const { data: matches, error: selErr } = await admin
    .from("code_entries")
    .select("id, campaign_id, code, status, created_at")
    .eq("contact", contact);
  if (selErr) throw selErr;

  if (!matches || matches.length === 0) {
    console.log(`Nicio înscriere găsită pentru contactul "${contact}". Nimic de șters.`);
    process.exit(0);
  }

  // 2. Report what was found, grouped by campaign.
  const byCampaign = new Map();
  for (const row of matches) {
    byCampaign.set(row.campaign_id, (byCampaign.get(row.campaign_id) ?? 0) + 1);
  }

  console.log(
    `Găsite ${matches.length} înscrieri pentru "${contact}" în ${byCampaign.size} campanie/campanii:`,
  );
  for (const [campaignId, count] of byCampaign) {
    console.log(`  - campania ${campaignId}: ${count} înscriere(i)`);
  }

  // 3. Flag entries that are recorded winners — anonymized, not removed, so the
  //    draw record and winners table stay intact.
  const entryIds = matches.map((r) => r.id);
  const { data: winnerRows, error: winErr } = await admin
    .from("winners")
    .select("entry_id")
    .in("entry_id", entryIds);
  if (winErr) throw winErr;
  if (winnerRows && winnerRows.length > 0) {
    console.log(
      `  (${winnerRows.length} dintre acestea sunt câștigătoare — vor fi anonimizate, dar rândul rămâne pentru auditul extragerii)`,
    );
  }

  if (dryRun) {
    console.log("\n--dry-run: nu s-a modificat nimic.");
    process.exit(0);
  }

  // 4. Anonymize: overwrite the PII columns, clear the IP.
  const { data: updated, error: updErr } = await admin
    .from("code_entries")
    .update({ full_name: REDACTED_NAME, contact: REDACTED_CONTACT, ip: null })
    .eq("contact", contact)
    .select("id");
  if (updErr) throw updErr;

  console.log(
    `\nGata. Am anonimizat ${updated?.length ?? 0} înscrieri (nume, contact, IP). ` +
      "Codurile și structura extragerilor rămân neschimbate.",
  );
} catch (err) {
  die(err?.message ?? String(err));
}
