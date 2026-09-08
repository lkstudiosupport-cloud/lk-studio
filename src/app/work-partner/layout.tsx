import type { ReactNode } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { BrandLogoMark } from "@/components/BrandLogo";
import { getLocale } from "@/lib/locale-server";
import { getSession } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { LocaleLocationBar } from "@/components/LocaleLocationBar";

/**
 * Shell for LK Tailoring Partner — brand below status bar; profile when logged in.
 */
export default async function WorkPartnerLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const session = await getSession();
  const isPartner = session?.role === "PARTNER";

  return (
    <div className="partner-app-shell brand-page-bg min-h-dvh w-full min-w-0">
      <header className="partner-app-header">
        <div className="partner-app-header-inner">
          <Link href="/work-partner" className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <BrandLogoMark
              locale={locale}
              className="!h-9 !w-9 shrink-0 sm:!h-10 sm:!w-10 md:!h-11 md:!w-11"
            />
            <span className="min-w-0 flex-1 text-left leading-tight">
              <span className="block truncate text-sm font-bold uppercase tracking-wide text-brand-green sm:text-base md:text-lg">
                {t(locale, "appName")}
              </span>
              <span className="block truncate text-xs font-medium text-brand-green-soft sm:text-sm">
                Tailoring Partner
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            <LocaleLocationBar locale={locale} />
            {isPartner && (
              <Link
                href="/work-partner/profile"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-gold/40 bg-brand-green text-brand-gold shadow-sm"
                aria-label={t(locale, "profile")}
                title={t(locale, "profile")}
              >
                <UserRound className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
