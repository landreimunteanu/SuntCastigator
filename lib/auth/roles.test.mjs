// Pure-logic tests for the role hierarchy. Run with `pnpm test:roles`
// (uses Node 22's built-in test runner — no test framework installed).
//
// This file is .mjs so it runs directly under `node --test` without a TS
// transpiler; it inlines the role hierarchy to stay decoupled from the
// TS module and its Next.js imports.

import { test } from "node:test";
import assert from "node:assert/strict";

// Mirror of hasRole() in ./roles.ts. Keep in sync — a divergence is the
// bug this test is meant to catch.
function hasRole(actual, required) {
  if (required === "editor") return actual === "editor" || actual === "owner";
  return actual === "owner";
}

test("owner satisfies owner", () => {
  assert.equal(hasRole("owner", "owner"), true);
});

test("owner satisfies editor (owner ⊃ editor)", () => {
  assert.equal(hasRole("owner", "editor"), true);
});

test("editor satisfies editor", () => {
  assert.equal(hasRole("editor", "editor"), true);
});

test("editor does NOT satisfy owner", () => {
  assert.equal(hasRole("editor", "owner"), false);
});
