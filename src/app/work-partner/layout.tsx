import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLogoMark } from "@/components/BrandLogo";
import { getLocale } from "@/lib/locale-server";

/**
 * Shell for LK Tailoring Partner (separate Play Store APK starts here).
 * No shop/customer nav; home is /work-partner.
 */
export default async function WorkPartnerLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();

  return (
    <div className="brand-page-bg min-h-dvh">
      <header className="border-b border-brand-green/10 bg-brand-cream/80 px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <Link href="/work-partner" className="flex items-center gap-2">
            <BrandLogoMark locale={locale} />
            <span className="text-sm font-bold text-brand-green">LK Tailoring Partner</span>
          </Link>
        </div>
      </header>
      {children}
    </div>
  );
}
