import Link from "next/link";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { CUSTOMER_MONTHLY_PRICE_INR } from "@/lib/subscription";

export function CustomerDesignPaywall({ locale }: { locale: Locale }) {
  return (
    <div className="card-premium mx-auto max-w-md space-y-4 p-8 text-center">
      <h2 className="text-lg font-bold text-brand-green">{t(locale, "customerDesignPaywallTitle")}</h2>
      <p className="text-sm text-zinc-600">
        {t(locale, "customerDesignPaywallHint", { amount: CUSTOMER_MONTHLY_PRICE_INR })}
      </p>
      <Link
        href="/customer/profile?subscription=1#subscription"
        className="btn-primary inline-flex px-5 py-2.5 text-sm"
      >
        {t(locale, "customerDesignPaywallCta")}
      </Link>
      <Link href="/customer/shops" className="block text-sm font-semibold text-brand-green underline">
        ← {t(locale, "browseShops")}
      </Link>
    </div>
  );
}
