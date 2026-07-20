import type { Locale } from "@/lib/i18n/locales";

/** Google Input Tools language codes for phonetic Latin → Indic script. */
const INPUT_TOOL_CODES: Partial<Record<Locale, string>> = {
  te: "te-t-i0-und",
  hi: "hi-t-i0-und",
  bn: "bn-t-i0-und",
};

export function localeNeedsIndicTransliteration(locale: Locale): boolean {
  return locale === "te" || locale === "hi" || locale === "bn";
}

/** True when the string still has Latin letters that can be transliterated. */
export function hasLatinLetters(text: string): boolean {
  return /[A-Za-z]/.test(text);
}

/**
 * Phonetic transliteration via Google Input Tools (same engine as Google Indic typing).
 * Returns original text on failure or when locale is English / no Latin letters.
 */
export async function transliterateLatinToLocale(
  text: string,
  locale: Locale
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (!localeNeedsIndicTransliteration(locale)) return text;
  if (!hasLatinLetters(trimmed)) return text;

  const itc = INPUT_TOOL_CODES[locale];
  if (!itc) return text;

  try {
    const url =
      "https://inputtools.google.com/request?" +
      new URLSearchParams({
        text: trimmed,
        itc,
        num: "1",
        cp: "0",
        cs: "1",
        ie: "utf-8",
        oe: "utf-8",
        app: "demopage",
      }).toString();

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return text;

    const data = (await res.json()) as unknown;
    // ["SUCCESS",[["Ashok",["అశోక్",...],...]]]
    if (!Array.isArray(data) || data[0] !== "SUCCESS") return text;
    const rows = data[1];
    if (!Array.isArray(rows) || !Array.isArray(rows[0])) return text;
    const candidates = rows[0][1];
    if (!Array.isArray(candidates) || typeof candidates[0] !== "string") return text;

    const converted = candidates[0].trim();
    if (!converted) return text;

    // Preserve leading/trailing spaces from the original.
    const lead = text.match(/^\s*/)?.[0] ?? "";
    const trail = text.match(/\s*$/)?.[0] ?? "";
    return `${lead}${converted}${trail}`;
  } catch {
    return text;
  }
}
