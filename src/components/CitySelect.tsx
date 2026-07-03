"use client";

import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { SERVICE_CITIES } from "@/lib/cities";

export function CitySelect({
  locale,
  name = "city",
  defaultValue = "",
  required = false,
  className = "input-premium w-full",
}: {
  locale: Locale;
  name?: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <select name={name} defaultValue={defaultValue} required={required} className={className}>
      <option value="">{t(locale, "selectCity")}</option>
      {SERVICE_CITIES.map((city) => (
        <option key={city} value={city}>
          {city}
        </option>
      ))}
    </select>
  );
}
