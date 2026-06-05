import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/i18n/locales";

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const val = jar.get("lk_locale")?.value;
  if (val && LOCALES.includes(val as Locale)) return val as Locale;
  return DEFAULT_LOCALE;
}
