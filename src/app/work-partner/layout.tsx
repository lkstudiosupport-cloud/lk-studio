import type { ReactNode } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { BrandLogoMark } from "@/components/BrandLogo";
import { getLocale } from "@/lib/locale-server";
import { getSession } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { LocaleLocationBar } from "@/components/LocaleLocationBar";

/**
 * Shell for LK Tailoring Partner — brand + language; profile when logged in.
 */
export default async function WorkPartnerLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const session = await getSession();
  const isPartner = session?.role === "PARTNER";

  return (
    <div className="partner-app-shell brand-page-bg min-h-dvh w-full min-w-0">
      <header className="sticky top-0 z-20 border-b border-brand-green/10 bg-brand-cream/95 backdrop-blur-sm">
        <div className="partner-app-frame flex items-center gap-2 py-2.5 sm:gap-3 sm:py-3 md:py-3.5">
          <Link href="/work-partner" className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <BrandLogoMark
              locale={locale}
              className="!h-9 !w-9 shrink-0 sm:!h-10 sm:!w-10 md:!h-11 md:!w-11"
            />
            <span className="min-w-0 text-left leading-tight">
              <span className="block truncate text-xs font-bold uppercase tracking-wide text-brand-green sm:text-sm md:text-base">
                {t(locale, "appName")}
              </span>
              <span className="block truncate text-[0.7rem] font-medium text-brand-green-soft sm:text-xs md:text-sm">
                Tailoring Partner
              </span>
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <LocaleLocationBar locale={locale} />
            {isPartner && (
              <Link
                href="/work-partner/profile"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-gold/40 bg-brand-green text-brand-gold shadow-sm sm:h-10 sm:w-10"
                aria-label={t(locale, "profile")}
                title={t(locale, "profile")}
              >
                <UserRound className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            )}
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
