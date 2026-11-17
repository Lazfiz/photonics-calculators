/** Helpers for number fields: users type freely, and only finite in-range numbers reach physics. */

/** Parses field text. Empty, partial ("-", "1e") or non-finite input gives `null`. */
export function parseNumberInput(text: string): number | null {
  if (text.trim() === "") return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

export function isInRange(n: number, min?: number, max?: number): boolean {
  return (min === undefined || n >= min) && (max === undefined || n <= max);
}

export function clampToRange(n: number, min?: number, max?: number): number {
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
}

/**
 * The on-screen keypad for a number field. "decimal" has no minus key on iPhone, so it is only for fields that can't
 * go negative (min ≥ 0); a field that may take a negative value gets the full keyboard ("text"), and the usual
 * validation still rejects text that isn't a number.
 */
export function numberInputMode(min?: number): "decimal" | "text" {
  return min !== undefined && min >= 0 ? "decimal" : "text";
}
