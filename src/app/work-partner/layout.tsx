import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLogoMark } from "@/components/BrandLogo";
import { getLocale } from "@/lib/locale-server";

/**
 * Shell for LK Tailoring Partner (separate Play Store APK).
 * Fluid width: phone → tablet → large tablet.
 */
export default async function WorkPartnerLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();

  return (
    <div className="partner-app-shell brand-page-bg min-h-dvh w-full min-w-0">
      <header className="sticky top-0 z-20 border-b border-brand-green/10 bg-brand-cream/95 backdrop-blur-sm">
        <div className="partner-app-frame flex items-center justify-between gap-3 py-2.5 sm:py-3 md:py-3.5">
          <Link href="/work-partner" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <BrandLogoMark locale={locale} className="!h-9 !w-9 sm:!h-10 sm:!w-10 md:!h-11 md:!w-11" />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-bold uppercase tracking-wide text-brand-green sm:text-base">
                LK Studio
              </span>
              <span className="block truncate text-xs font-medium text-brand-green-soft sm:text-sm">
                Tailoring Partner
              </span>
            </span>
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
