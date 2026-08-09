#!/usr/bin/env node
// Read-only report: lists every brand_users membership alongside the
// associated auth user's invite/creation metadata, and flags rows that look
// like they came through the auto-enroll escape hatch removed from
// lib/supabase/get-brand.ts rather than through scripts/seed-brand.mjs.
//
// The two membership paths leave a reliable, distinct fingerprint on the
// auth.users row:
//   - seed-brand.mjs calls admin.inviteUserByEmail(), which sets invited_at.
//   - the removed auto-enroll path rode on a user created by the public
//     signInWithOtp() call, which never sets invited_at.
// So any membership whose user has invited_at === null is a candidate for
// review — this script only reports, it changes nothing. Decide per-row
// whether to remove the membership (or the user) directly in the Supabase
// dashboard.
//
// Usage:
//   pnpm audit:memberships
//
// Requires SUPABASE_SERVICE_ROLE_KEY in the environment (from .env.local
// when run locally).

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..");

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

function die(msg, code = 1) {
  console.error(`ERROR: ${msg}`);
  process.exit(code);
}

loadDotEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) die("NEXT_PUBLIC_SUPABASE_URL not set");
if (!serviceKey) die("SUPABASE_SERVICE_ROLE_KEY not set");

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function listAllUsers() {
  // listUsers is paged; fine at MVP scale (see seed-brand.mjs — same note).
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  return data.users;
}

try {
  const { data: memberships, error: memErr } = await admin
    .from("brand_users")
    .select("brand_id, user_id, role, created_at, brands ( name, slug )")
    .order("created_at", { ascending: true });
  if (memErr) throw memErr;

  if (!memberships || memberships.length === 0) {
    console.log("Nicio membru de brand găsit.");
    process.exit(0);
  }

  const users = await listAllUsers();
  const userById = new Map(users.map((u) => [u.id, u]));

  let suspiciousCount = 0;

  console.log(`${memberships.length} membru/membri de brand:\n`);
  for (const m of memberships) {
    const user = userById.get(m.user_id);
    const brandLabel = m.brands ? `${m.brands.name} (${m.brands.slug})` : m.brand_id;
    const email = user?.email ?? "(cont șters)";
    const invited = Boolean(user?.invited_at);
    const flag = invited ? "" : "  <-- SUSPECT: fără invited_at, nu pare provenit din seed-brand";
    if (!invited) suspiciousCount++;

    console.log(
      `- ${email} | rol: ${m.role} | brand: ${brandLabel} | membru din: ${m.created_at} | ` +
        `invited_at: ${user?.invited_at ?? "null"}${flag}`
    );
  }

  console.log(
    `\n${suspiciousCount} membru/membri fără invited_at — verifică manual înainte de a elimina.`
  );
} catch (err) {
  die(err?.message ?? String(err));
}
