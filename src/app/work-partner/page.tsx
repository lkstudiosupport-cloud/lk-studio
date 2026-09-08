import Link from "next/link";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { LocaleLocationBar } from "@/components/LocaleLocationBar";
import { BrandLogoMark } from "@/components/BrandLogo";
import { LegalFooter } from "@/components/LegalFooter";

/**
 * LK Tailoring Partner landing — Register + jobs only (no shop/customer login).
 * Scales for phone and tablet.
 */
export default async function WorkPartnerHomePage() {
  const locale = await getLocale();

  return (
    <main className="partner-app-frame flex min-h-[calc(100dvh-3.5rem)] w-full flex-col py-4 sm:py-6 md:py-10 lg:py-12">
      <div className="mb-4 flex justify-end sm:mb-6">
        <LocaleLocationBar locale={locale} />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center text-center sm:max-w-lg md:max-w-xl lg:max-w-2xl">
        <div className="mb-6 flex flex-col items-center sm:mb-8 md:mb-10">
          <BrandLogoMark
            locale={locale}
            className="!h-24 !w-24 !rounded-2xl sm:!h-28 sm:!w-28 md:!h-32 md:!w-32 lg:!h-36 lg:!w-36"
          />
          <h1 className="brand-title mt-4 text-brand-green text-2xl sm:mt-5 sm:text-3xl md:text-4xl">
            {t(locale, "appName")}
          </h1>
          <p className="mt-1 text-base font-semibold text-brand-green sm:mt-1.5 sm:text-lg md:text-xl">
            Tailoring Partner
          </p>
          <p className="mt-2 max-w-prose text-sm text-zinc-600 sm:mt-3 sm:text-base md:text-lg">
            {t(locale, "workPartnerAppHint")}
          </p>
        </div>

        <div className="mx-auto grid w-full max-w-sm gap-3 sm:max-w-md sm:gap-4 md:max-w-lg">
          <Link
            href="/register?app=partner"
            className="btn-primary block py-3.5 text-base sm:py-4 sm:text-lg md:text-xl"
          >
            {t(locale, "register")}
          </Link>
          <Link
            href="/work-partner/requests"
            className="btn-secondary block py-3 text-base sm:py-3.5 sm:text-lg md:py-4"
          >
            {t(locale, "workPartnerAppEntry")}
          </Link>
        </div>

        <LegalFooter locale={locale} className="mt-8 sm:mt-10" />
      </div>
    </main>
  );
}
