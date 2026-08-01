#!/usr/bin/env node
// Operator-only seeding: creates a brand and invites a user as owner/editor.
// This is how brands are onboarded at MVP — there is NO self-signup UI.
//
// Usage:
//   pnpm seed:brand --name "Coca-Cola" --slug coca-cola \
//                   --email owner@brand.ro [--role owner|editor]
//
// Requires SUPABASE_SERVICE_ROLE_KEY in the environment (from .env.local
// when run locally, or set inline for one-off invocations).

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

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    const value = argv[i + 1];
    if (!key?.startsWith("--") || value === undefined) {
      throw new Error(`Bad argument at position ${i}: ${key} ${value}`);
    }
    out[key.slice(2)] = value;
  }
  return out;
}

function die(msg, code = 1) {
  console.error(`ERROR: ${msg}`);
  process.exit(code);
}

loadDotEnvLocal();

const args = parseArgs(process.argv.slice(2));
const { name, slug, email, role = "owner" } = args;

if (!name || !slug || !email) {
  die(
    'Missing args. Usage: pnpm seed:brand --name "Brand Name" --slug brand-slug --email user@example.com [--role owner|editor]',
  );
}
if (role !== "owner" && role !== "editor") {
  die(`Invalid --role "${role}" (must be owner or editor)`);
}
if (!/^[a-z0-9-]+$/.test(slug)) {
  die(`Invalid --slug "${slug}" (only lowercase letters, digits, hyphens)`);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) die("NEXT_PUBLIC_SUPABASE_URL not set");
if (!serviceKey) die("SUPABASE_SERVICE_ROLE_KEY not set");

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Find or invite the user. inviteUserByEmail is idempotent-ish: if the
// user already exists it errors, so we look them up first and only invite
// on a real miss.
async function findOrInviteUser(targetEmail) {
  // listUsers is paged; the dev project only has a handful of users, so
  // scanning is fine at MVP. Revisit if the user table grows past a few hundred.
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  const existing = data.users.find((u) => u.email?.toLowerCase() === targetEmail.toLowerCase());
  if (existing) return { user: existing, created: false };

  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(targetEmail);
  if (inviteErr) throw inviteErr;
  return { user: invited.user, created: true };
}

async function upsertBrand(brandName, brandSlug) {
  const { data: existing, error: selErr } = await admin
    .from("brands")
    .select("id, name, slug")
    .eq("slug", brandSlug)
    .maybeSingle();
  if (selErr) throw selErr;
  if (existing) return { brand: existing, created: false };

  const { data: inserted, error: insErr } = await admin
    .from("brands")
    .insert({ name: brandName, slug: brandSlug })
    .select("id, name, slug")
    .single();
  if (insErr) throw insErr;
  return { brand: inserted, created: true };
}

async function upsertMembership(brandId, userId, membershipRole) {
  const { data: existing, error: selErr } = await admin
    .from("brand_users")
    .select("brand_id, user_id, role")
    .eq("brand_id", brandId)
    .eq("user_id", userId)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing) {
    if (existing.role === membershipRole) return { membership: existing, action: "unchanged" };
    const { data: updated, error: updErr } = await admin
      .from("brand_users")
      .update({ role: membershipRole })
      .eq("brand_id", brandId)
      .eq("user_id", userId)
      .select("brand_id, user_id, role")
      .single();
    if (updErr) throw updErr;
    return { membership: updated, action: "updated" };
  }

  const { data: inserted, error: insErr } = await admin
    .from("brand_users")
    .insert({ brand_id: brandId, user_id: userId, role: membershipRole })
    .select("brand_id, user_id, role")
    .single();
  if (insErr) throw insErr;
  return { membership: inserted, action: "created" };
}

try {
  const { user, created: userCreated } = await findOrInviteUser(email);
  console.log(
    userCreated
      ? `-> invited new user ${email} (id: ${user.id}) — magic-link email sent`
      : `-> found existing user ${email} (id: ${user.id})`,
  );

  const { brand, created: brandCreated } = await upsertBrand(name, slug);
  console.log(
    brandCreated
      ? `-> created brand "${brand.name}" (id: ${brand.id}, slug: ${brand.slug})`
      : `-> reusing existing brand "${brand.name}" (id: ${brand.id}, slug: ${brand.slug})`,
  );

  const { action } = await upsertMembership(brand.id, user.id, role);
  console.log(`-> membership ${action}: ${email} is "${role}" on ${brand.slug}`);

  console.log("\nDone. The user can log in via /login and will see the dashboard shell.");
} catch (err) {
  die(err?.message ?? String(err));
}
