"use client";

import { useRouter } from "next/navigation";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/lib/i18n/locales";

export function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter();

  return (
    <select
      className="shrink-0 rounded-lg border border-brand-gold/30 bg-brand-green/80 py-2 pl-2.5 pr-8 text-sm font-medium text-brand-gold shadow-sm"
      style={{ width: "auto", minWidth: "8.5rem" }}
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
