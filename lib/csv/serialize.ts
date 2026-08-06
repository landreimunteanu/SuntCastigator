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
    row.map((field) => quoteField(field)).join(",")
  );
  return lines.join("\r\n") + "\r\n";
}

// UTF-8 BOM so Excel on Windows detects the encoding and renders Romanian
// diacritics (ă, â, î, ș, ț) correctly instead of mojibake.
export const CSV_BOM = "﻿";
