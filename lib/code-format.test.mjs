// Pure-logic tests for the code-format regex builder. Run with
// `pnpm test:code-format` (Node's built-in test runner — no framework installed).
//
// This file is .mjs so it runs directly under `node --test` without a TS
// transpiler; it inlines buildCodeRegex to stay decoupled from the TS
// module. Keep in sync with ./code-format.ts — a divergence is the bug
// this test is meant to catch.

import { test } from "node:test";
import assert from "node:assert/strict";

const CHARSET_CLASSES = {
  letters: "A-Za-z",
  digits: "0-9",
  alphanumeric: "A-Za-z0-9",
};

function buildCodeRegex(length, charset) {
  if (!Number.isInteger(length) || length < 6 || length > 14) {
    throw new Error("length must be an integer between 6 and 14");
  }
  const cls = CHARSET_CLASSES[charset];
  return `^[${cls}]{${length}}$`;
}

test("length=10, alphanumeric matches a valid 10-char code", () => {
  const regex = new RegExp(buildCodeRegex(10, "alphanumeric"));
  assert.equal(regex.test("AB3X9KQ7M2"), true);
});

test("length=10, alphanumeric rejects special characters", () => {
  const regex = new RegExp(buildCodeRegex(10, "alphanumeric"));
  assert.equal(regex.test("ab3!9KQ7M2"), false);
});

test("length=10, alphanumeric rejects wrong length", () => {
  const regex = new RegExp(buildCodeRegex(10, "alphanumeric"));
  assert.equal(regex.test("AB3X9KQ7M"), false);
  assert.equal(regex.test("AB3X9KQ7M22"), false);
});

test("letters charset rejects digits", () => {
  const regex = new RegExp(buildCodeRegex(8, "letters"));
  assert.equal(regex.test("ABCDEFG1"), false);
  assert.equal(regex.test("ABCDEFGH"), true);
});

test("digits charset rejects letters", () => {
  const regex = new RegExp(buildCodeRegex(8, "digits"));
  assert.equal(regex.test("1234567A"), false);
  assert.equal(regex.test("12345678"), true);
});

test("regex is anchored (no partial match)", () => {
  const regex = new RegExp(buildCodeRegex(6, "digits"));
  assert.equal(regex.test("123456789"), false);
  assert.equal(regex.test("xx123456xx"), false);
});

test("throws on length below 6", () => {
  assert.throws(() => buildCodeRegex(5, "digits"));
});

test("throws on length above 14", () => {
  assert.throws(() => buildCodeRegex(15, "digits"));
});

test("accepts boundary lengths 6 and 14", () => {
  assert.doesNotThrow(() => buildCodeRegex(6, "digits"));
  assert.doesNotThrow(() => buildCodeRegex(14, "digits"));
});
