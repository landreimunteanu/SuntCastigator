// Pure-logic tests for CSV serialization. Run with `pnpm test:csv`
// (Node's built-in test runner — no framework installed).
//
// This file is .mjs so it runs directly under `node --test` without a TS
// transpiler; it inlines the same logic as ./serialize.ts to stay decoupled
// from the TS module (see engine.test.mjs for the same pattern). Keep in
// sync with ./serialize.ts.

import { test } from "node:test";
import assert from "node:assert/strict";

const FORMULA_TRIGGER_RE = /^[=+\-@\t\r]/;

function neutralizeFormula(value) {
  return FORMULA_TRIGGER_RE.test(value) ? `'${value}` : value;
}

function quoteField(value) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function serializeCsv(header, rows) {
  const lines = [header, ...rows].map((row) =>
    row.map((field) => quoteField(neutralizeFormula(field))).join(",")
  );
  return lines.join("\r\n") + "\r\n";
}

test("formula-triggering fields get a leading apostrophe", () => {
  const csv = serializeCsv(
    ["nume", "contact"],
    [
      ['=HYPERLINK("http://evil.ro","click")', "x"],
      ["+1234", "x"],
      ["-1234", "x"],
      ["@cmd", "x"],
      ["\tcmd", "x"],
    ]
  );
  const rows = csv.split("\r\n").slice(1);
  assert.equal(rows[0], `"'=HYPERLINK(""http://evil.ro"",""click"")",x`);
  assert.equal(rows[1], "'+1234,x");
  assert.equal(rows[2], "'-1234,x");
  assert.equal(rows[3], "'@cmd,x");
  assert.equal(rows[4], "'\tcmd,x");
});

test("ordinary names are untouched", () => {
  const csv = serializeCsv(["nume"], [["Ana Popescu"], ["Ștefan-Marius"]]);
  const rows = csv.split("\r\n").slice(1);
  assert.equal(rows[0], "Ana Popescu");
  assert.equal(rows[1], "Ștefan-Marius");
});

test("a name that merely contains a comma is still quoted, not prefixed", () => {
  const csv = serializeCsv(["nume"], [["Popescu, Ana"]]);
  assert.equal(csv.split("\r\n")[1], '"Popescu, Ana"');
});

test("formula neutralization runs before RFC 4180 quoting", () => {
  // Starts with '=' AND contains a comma — must get both the apostrophe
  // prefix and the surrounding quotes, in that order.
  const csv = serializeCsv(["nume"], [["=A1,B1"]]);
  assert.equal(csv.split("\r\n")[1], '"\'=A1,B1"');
});
