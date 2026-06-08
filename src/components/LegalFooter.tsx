import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";

export function LegalFooter({ locale, className = "" }: { locale: Locale; className?: string }) {
  return (
    <footer
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-brand-green-soft ${className}`}
    >
      <Link href="/privacy" className="underline-offset-2 hover:underline">
        {t(locale, "privacyPolicy")}
      </Link>
      <span aria-hidden="true">·</span>
      <Link href="/terms" className="underline-offset-2 hover:underline">
        {t(locale, "termsOfService")}
      </Link>
      <span aria-hidden="true">·</span>
      <a href="mailto:lkstudio.support@gmail.com" className="underline-offset-2 hover:underline">
        {t(locale, "supportEmail")}
      </a>
    </footer>
  );
}
