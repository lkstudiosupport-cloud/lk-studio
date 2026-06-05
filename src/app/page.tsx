import Link from "next/link";
import { getLocale } from "@/lib/locale-server";
import { t } from "@/lib/i18n";
import { LocaleLocationBar } from "@/components/LocaleLocationBar";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";

export default async function HomePage() {
  const locale = await getLocale();
  const session = await getSession();

  if (session?.role === "SHOP") redirect("/shop");
  if (session?.role === "CUSTOMER") redirect("/customer");

  return (
    <main className="brand-page-bg app-page-shell mx-auto flex min-h-dvh w-full max-w-lg flex-col py-6 sm:max-w-xl sm:py-8 md:max-w-2xl">
      <div className="mb-4 flex justify-end">
        <LocaleLocationBar locale={locale} />
      </div>

      <div className="flex flex-1 flex-col justify-center text-center">
        <BrandLogo locale={locale} size="hero" className="mb-8" />

        <div className="grid gap-4">
          <Link href="/register" className="btn-primary block py-4 text-lg">
            {t(locale, "register")}
          </Link>
          <Link href="/login/shop" className="btn-secondary block py-3">
            {t(locale, "shopLogin")}
          </Link>
          <Link href="/login/customer" className="btn-secondary block py-3">
            {t(locale, "customerLogin")}
          </Link>
        </div>

        <p className="mt-8 text-xs text-brand-green-soft">{t(locale, "demoCredentials")}</p>
        {process.env.NODE_ENV !== "production" && (
          <p className="mt-2 text-xs text-brand-green-soft">
            Test on phone: <strong>npm run dev:anywhere</strong> · Send app to friends: <strong>SHARE-WITH-FRIENDS.md</strong>
          </p>
        )}
      </div>
    </main>
  );
}
