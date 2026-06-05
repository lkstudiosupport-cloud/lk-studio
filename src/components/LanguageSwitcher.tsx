"use client";

import { useRouter } from "next/navigation";
import { LOCALE_NAMES, LOCALES, type Locale } from "@/lib/i18n/locales";

export function LanguageSwitcher({ current }: { current: Locale }) {
  const router = useRouter();

  return (
    <select
      className="max-w-[4.25rem] rounded-lg border border-brand-gold/30 bg-brand-green/80 px-1.5 py-1 text-xs font-medium text-brand-gold shadow-sm sm:max-w-none sm:px-2 sm:text-sm"
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
