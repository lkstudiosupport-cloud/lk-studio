"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";

export function TermsAcceptanceField({
  locale,
  checked,
  onChange,
  name = "acceptTerms",
}: {
  locale: Locale;
  checked: boolean;
  onChange: (checked: boolean) => void;
  name?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-green/15 bg-brand-cream/40 p-3 text-sm text-zinc-700">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required
        className="mt-0.5 h-4 w-4 shrink-0 accent-brand-green"
      />
      <span>
        {t(locale, "acceptTermsPrefix")}{" "}
        <Link href="/terms" className="font-semibold text-brand-green underline-offset-2 hover:underline">
          {t(locale, "termsOfService")}
        </Link>{" "}
        {t(locale, "acceptTermsAnd")}{" "}
        <Link href="/privacy" className="font-semibold text-brand-green underline-offset-2 hover:underline">
          {t(locale, "privacyPolicy")}
        </Link>
        . {t(locale, "acceptTermsAiClause")}
      </span>
    </label>
  );
}
