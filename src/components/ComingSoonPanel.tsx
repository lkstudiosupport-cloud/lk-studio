import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { Construction } from "lucide-react";

export function ComingSoonPanel({
  locale,
  titleKey,
  hintKey,
}: {
  locale: Locale;
  titleKey: string;
  hintKey?: string;
}) {
  return (
    <div className="card-premium flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-green/10 text-brand-green">
        <Construction className="h-8 w-8" />
      </span>
      <h1 className="page-title text-xl">{t(locale, titleKey)}</h1>
      <p className="mt-3 max-w-sm text-sm text-zinc-600">
        {t(locale, hintKey ?? "comingSoonHint")}
      </p>
    </div>
  );
}
