// Neutralizes CSV formula injection: a field opening with =, +, -, @, tab,
// or CR is a live formula/DDE trigger in Excel/Sheets once the file is
// opened. code_entries.full_name/contact are anonymous, unauthenticated
// consumer input (lib/validations/entry.ts only bounds length), so this
// runs before quoting on every export. Prefixing with a leading apostrophe
// forces text interpretation without changing the visible value.
const FORMULA_TRIGGER_RE = /^[=+\-@\t\r]/;

function neutralizeFormula(value: string): string {
  return FORMULA_TRIGGER_RE.test(value) ? `'${value}` : value;
}

// Quotes a field only when needed (contains comma, quote, or newline),
// doubling any embedded quotes — the RFC 4180 rule Excel expects.
function quoteField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function serializeCsv(header: string[], rows: string[][]): string {
  const lines = [header, ...rows].map((row) =>
    row.map((field) => quoteField(neutralizeFormula(field))).join(",")
  );
  return lines.join("\r\n") + "\r\n";
}

// UTF-8 BOM so Excel on Windows detects the encoding and renders Romanian
// diacritics (ă, â, î, ș, ț) correctly instead of mojibake.
export const CSV_BOM = "﻿";
