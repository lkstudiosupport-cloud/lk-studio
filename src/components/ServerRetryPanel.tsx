import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";

/** Shown when a server page hits a transient DB/load error instead of the global error boundary. */
export function ServerRetryPanel({ locale }: { locale: Locale }) {
  return (
    <div className="card-premium mx-auto max-w-md space-y-4 p-6 text-center">
      <h2 className="text-lg font-bold text-brand-green">{t(locale, "serverTemporaryErrorTitle")}</h2>
      <p className="text-sm text-zinc-600">{t(locale, "serverTemporaryErrorHint")}</p>
      <a href="." className="btn-primary inline-block w-full py-3">
        {t(locale, "tryAgain")}
      </a>
      <a href="/" className="btn-secondary inline-block w-full py-3">
        {t(locale, "backHome")}
      </a>
    </div>
  );
}
