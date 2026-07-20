export const LOCALES = ["en", "te", "hi", "bn"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  te: "తెలుగు",
  hi: "हिन्दी",
  bn: "বাংলা",
};

export const DEFAULT_LOCALE: Locale = "en";
