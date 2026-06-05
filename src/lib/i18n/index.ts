import type { Locale } from "./locales";
import en from "./messages/en.json";
import te from "./messages/te.json";
import hi from "./messages/hi.json";

const bundles: Record<Locale, Record<string, unknown>> = { en, te, hi };

export function t(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const parts = key.split(".");
  let node: unknown = bundles[locale] ?? bundles.en;
  for (const p of parts) {
    if (node && typeof node === "object" && p in (node as object)) {
      node = (node as Record<string, unknown>)[p];
    } else {
      node = bundles.en;
      for (const q of parts) {
        if (node && typeof node === "object" && q in (node as object)) {
          node = (node as Record<string, unknown>)[q];
        } else return key;
      }
      break;
    }
  }
  let text = typeof node === "string" ? node : key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}
