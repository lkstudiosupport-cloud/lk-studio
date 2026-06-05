export const LOCALES = ["en", "te", "hi"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  te: "తెలుగు",
  hi: "हिन्दी",
};

export const DEFAULT_LOCALE: Locale = "en";
