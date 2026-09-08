"use client";

import { useRouter } from "next/navigation";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/lib/i18n/locales";

export function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter();

  return (
    <select
      className="shrink-0 rounded-lg border border-brand-gold/30 bg-brand-green/80 py-1.5 pl-2 pr-7 text-xs font-medium text-brand-gold shadow-sm sm:py-2 sm:pl-2.5 sm:pr-8 sm:text-sm"
      style={{ minWidth: "7.25rem", maxWidth: "9.5rem" }}
      value={current}
      onChange={(e) => {
        document.cookie = `lk_locale=${e.target.value};path=/;max-age=31536000`;
        router.refresh();
      }}
      aria-label="Language"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {LOCALE_NAMES[l]}
        </option>
      ))}
    </select>
  );
}
