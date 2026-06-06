/** Normalize user input to match stored shop codes (uppercase, trimmed). */
export function normalizeShopCode(input: string): string {
  return input.trim().toUpperCase();
}
