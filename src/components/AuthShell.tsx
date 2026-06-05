import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { BrandLogo } from "@/components/BrandLogo";
import { DevAccessBanner } from "@/components/DevAccessBanner";
import { LocaleLocationBar } from "@/components/LocaleLocationBar";

/** Same centered layout as the home page — for login / register. */
export function AuthShell({
  locale,
  title,
  children,
}: {
  locale: Locale;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="brand-page-bg app-page-shell mx-auto flex min-h-dvh w-full max-w-lg flex-col py-6 sm:max-w-xl sm:py-8 md:max-w-2xl">
      <div className="mb-4 flex justify-end">
        <LocaleLocationBar locale={locale} />
      </div>

      <div className="flex flex-1 flex-col justify-center text-center">
        <BrandLogo locale={locale} size="hero" className="mb-6" />
        <h1 className="mt-2 text-xl font-bold text-brand-green">{title}</h1>
        {process.env.NODE_ENV !== "production" && (
          <div className="mt-4 w-full text-left">
            <DevAccessBanner />
          </div>
        )}
        <div className="mt-6 w-full text-left">{children}</div>
      </div>
    </main>
  );
}
