import Sanscript from "@indic-transliteration/sanscript";
import type { Locale } from "@/lib/i18n/locales";
import { transliterateLatinToLocale } from "@/lib/indic-transliterate";

const LOCALE_SCRIPT: Record<Locale, string> = {
  en: "itrans",
  te: "telugu",
  hi: "devanagari",
  bn: "bengali",
};

/** Skip conversion for phone-like strings and bare numbers. */
export function shouldSkipLocaleTextConvert(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (/^\+?\d[\d\s\-()]{7,}$/.test(trimmed)) return true;
  if (/^\d+([./]\d+)?$/.test(trimmed)) return true;
  return false;
}

function detectScript(text: string): string | null {
  if (/[\u0C00-\u0C7F]/.test(text)) return "telugu";
  if (/[\u0900-\u097F]/.test(text)) return "devanagari";
  if (/[\u0980-\u09FF]/.test(text)) return "bengali";
  if (/[A-Za-z]/.test(text)) return "itrans";
  return null;
}

function simplifyLatin(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/["'~\\^]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function convertWithSanscript(text: string, fromScript: string, toScript: string): string {
  try {
    const out = Sanscript.t(text, fromScript, toScript);
    return toScript === "itrans" ? simplifyLatin(out) : out;
  } catch {
    return text;
  }
}

/**
 * Adapt user-entered text when the app language changes
 * (Latin ↔ Indic scripts, and between Telugu / Hindi / Bengali).
 */
export async function convertTextToLocale(text: string, toLocale: Locale): Promise<string> {
  if (shouldSkipLocaleTextConvert(text)) return text;

  const toScript = LOCALE_SCRIPT[toLocale];
  const fromScript = detectScript(text);
  if (!fromScript || fromScript === toScript) return text;

  if (fromScript === "itrans") {
    if (toLocale === "en") return text;
    return transliterateLatinToLocale(text, toLocale);
  }

  if (toLocale === "en") {
    return convertWithSanscript(text, fromScript, "itrans");
  }

  return convertWithSanscript(text, fromScript, toScript);
}
