export type CodeCharset = "letters" | "digits" | "alphanumeric";

const CHARSET_CLASSES: Record<CodeCharset, string> = {
  letters: "A-Za-z",
  digits: "0-9",
  alphanumeric: "A-Za-z0-9",
};

const CHARSET_SAMPLE_CHARS: Record<CodeCharset, string> = {
  letters: "ABCDEFGHJKMNPQRSTUVWXYZ",
  digits: "0123456789",
  alphanumeric: "ABCDEFGHJKMNPQRSTUVWXYZ0123456789",
};

export function buildCodeRegex(
  length: number,
  charset: CodeCharset
): string {
  if (!Number.isInteger(length) || length < 6 || length > 14) {
    throw new Error("length must be an integer between 6 and 14");
  }

  const cls = CHARSET_CLASSES[charset];
  return `^[${cls}]{${length}}$`;
}

// Deterministic sample used for the live format preview — not for real code
// generation, just illustrates length + charset to the brand manager.
export function buildCodePreview(
  length: number,
  charset: CodeCharset
): string {
  const chars = CHARSET_SAMPLE_CHARS[charset];
  const sample: string[] = [];
  for (let i = 0; i < length; i++) {
    sample.push(chars[i % chars.length]);
  }
  return sample.join(" ");
}
