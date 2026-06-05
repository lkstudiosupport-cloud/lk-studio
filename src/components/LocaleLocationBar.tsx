"use client";

import type { Locale } from "@/lib/i18n/locales";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

/** Language dropdown for header / auth toolbar. */
export function LocaleLocationBar({ locale }: { locale: Locale }) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <LanguageSwitcher current={locale} />
    </div>
  );
}
