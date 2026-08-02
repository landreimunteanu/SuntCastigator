export type CsvParseError = {
  row: number;
  reason: string;
};

export type CsvParseResult<T> = {
  rows: T[];
  errors: CsvParseError[];
};

// Splits a single CSV line into fields, honoring double-quoted fields
// (with "" as an escaped quote) so product names containing commas work.
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(field);
      field = "";
    } else {
      field += char;
    }
  }
  fields.push(field);

  return fields;
}

// Parses a `sku,name` CSV (header row required). Malformed rows are
// collected as errors (1-indexed against the data rows, header excluded)
// rather than silently dropped.
export function parseProductsCsv(
  content: string
): CsvParseResult<{ sku: string; name: string }> {
  const lines = content
    .split(/\r\n|\n|\r/)
    .filter((line) => line.trim().length > 0);

  const rows: { sku: string; name: string }[] = [];
  const errors: CsvParseError[] = [];

  if (lines.length === 0) {
    return { rows, errors: [{ row: 0, reason: "Fișierul CSV este gol" }] };
  }

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const skuIndex = header.indexOf("sku");
  const nameIndex = header.indexOf("name");

  if (skuIndex === -1 || nameIndex === -1) {
    return {
      rows,
      errors: [
        {
          row: 1,
          reason: 'Antetul trebuie să conțină coloanele „sku” și „name”',
        },
      ],
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const rowNumber = i + 1; // 1-indexed, includes header row for user-facing reference
    const fields = splitCsvLine(lines[i]);

    if (fields.length <= Math.max(skuIndex, nameIndex)) {
      errors.push({ row: rowNumber, reason: "Rând incomplet" });
      continue;
    }

    const sku = fields[skuIndex]?.trim() ?? "";
    const name = fields[nameIndex]?.trim() ?? "";

    if (!sku) {
      errors.push({ row: rowNumber, reason: "SKU lipsă" });
      continue;
    }
    if (!name) {
      errors.push({ row: rowNumber, reason: "Nume produs lipsă" });
      continue;
    }

    rows.push({ sku, name });
  }

  return { rows, errors };
}
