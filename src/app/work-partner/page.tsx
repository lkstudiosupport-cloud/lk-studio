import Link from "next/link";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { LocaleLocationBar } from "@/components/LocaleLocationBar";
import { BrandLogoMark } from "@/components/BrandLogo";
import { LegalFooter } from "@/components/LegalFooter";

/**
 * LK Tailoring Partner landing — Register + jobs only (no shop/customer login).
 */
export default async function WorkPartnerHomePage() {
  const locale = await getLocale();

  return (
    <main className="app-page-shell mx-auto flex min-h-[70dvh] w-full max-w-lg flex-col py-6 sm:max-w-xl sm:py-8">
      <div className="mb-4 flex justify-end">
        <LocaleLocationBar locale={locale} />
      </div>

      <div className="flex flex-1 flex-col justify-center text-center">
        <div className="mb-8 flex flex-col items-center">
          <BrandLogoMark locale={locale} className="!h-28 !w-28 !rounded-2xl" />
          <h1 className="mt-4 text-2xl font-bold uppercase tracking-wide text-brand-green">
            LK Tailoring Partner
          </h1>
          <p className="mt-2 text-sm text-zinc-600">{t(locale, "workPartnerAppHint")}</p>
        </div>

        <div className="grid gap-4">
          <Link href="/register?app=partner" className="btn-primary block py-4 text-lg">
            {t(locale, "register")}
          </Link>
          <Link href="/work-partner/requests" className="btn-secondary block py-3">
            {t(locale, "workPartnerAppEntry")}
          </Link>
        </div>

        <LegalFooter locale={locale} className="mt-8" />
      </div>
    </main>
  );
}
