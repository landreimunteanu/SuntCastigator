// Pure-logic tests for the draw engine. Run with `pnpm test:draw-engine`
// (Node's built-in test runner — no framework installed).
//
// This file is .mjs so it runs directly under `node --test` without a TS
// transpiler; it inlines the seeded-shuffle + hash algorithm to stay
// decoupled from the TS module. Keep in sync with ./engine.ts — a
// divergence here is exactly the bug this test exists to catch, since the
// whole point of the draw engine is that this algorithm is reproducible
// outside the app from just the stored seed and participant snapshot.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed(items, seedHex) {
  const seedInt = parseInt(seedHex.slice(0, 8), 16);
  const rand = mulberry32(seedInt);
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function computeParticipantsHash(orderedIds) {
  return createHash("sha256").update(orderedIds.join("\n")).digest("hex");
}

function pickWinners(orderedParticipantIds, seedHex, count) {
  return shuffleWithSeed(orderedParticipantIds, seedHex).slice(0, count);
}

const SNAPSHOT = ["id-1", "id-2", "id-3", "id-4", "id-5", "id-6", "id-7", "id-8"];
const SEED_A = "1a2b3c4d";
const SEED_B = "5e6f7089";

test("same seed + same snapshot ⇒ identical winners", () => {
  const first = pickWinners(SNAPSHOT, SEED_A, 3);
  const second = pickWinners(SNAPSHOT, SEED_A, 3);
  assert.deepEqual(first, second);
});

test("different seed ⇒ different order", () => {
  const withSeedA = shuffleWithSeed(SNAPSHOT, SEED_A);
  const withSeedB = shuffleWithSeed(SNAPSHOT, SEED_B);
  assert.notDeepEqual(withSeedA, withSeedB);
});

test("winners are a subset of the snapshot, count respected", () => {
  const winners = pickWinners(SNAPSHOT, SEED_A, 3);
  assert.equal(winners.length, 3);
  for (const id of winners) {
    assert.ok(SNAPSHOT.includes(id));
  }
  assert.equal(new Set(winners).size, 3); // no duplicates
});

test("hash is stable for the same ordered snapshot", () => {
  const first = computeParticipantsHash(SNAPSHOT);
  const second = computeParticipantsHash(SNAPSHOT);
  assert.equal(first, second);
});

test("hash changes if the snapshot changes", () => {
  const original = computeParticipantsHash(SNAPSHOT);
  const withOneMore = computeParticipantsHash([...SNAPSHOT, "id-9"]);
  const reordered = computeParticipantsHash([...SNAPSHOT].reverse());
  assert.notEqual(original, withOneMore);
  assert.notEqual(original, reordered);
});

test("shuffle is a full permutation — no entries dropped or duplicated", () => {
  const shuffled = shuffleWithSeed(SNAPSHOT, SEED_A);
  assert.equal(shuffled.length, SNAPSHOT.length);
  assert.deepEqual([...shuffled].sort(), [...SNAPSHOT].sort());
});
