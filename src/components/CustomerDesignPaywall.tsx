import Link from "next/link";
import { CreditCard } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { CUSTOMER_MONTHLY_PRICE_INR } from "@/lib/subscription";

export function CustomerDesignPaywall({ locale }: { locale: Locale }) {
  return (
    <div className="card-premium space-y-4 p-6 text-center">
      <CreditCard className="mx-auto h-12 w-12 text-brand-green" />
      <h1 className="page-title">{t(locale, "customerDesignPaywallTitle")}</h1>
      <p className="text-sm font-semibold text-amber-800">{t(locale, "paywallTrialEnded")}</p>
      <p className="text-sm text-zinc-600">
        {t(locale, "customerDesignPaywallHint", { amount: CUSTOMER_MONTHLY_PRICE_INR })}
      </p>
      <Link href="/customer/profile#subscription" className="btn-primary inline-block">
        {t(locale, "customerDesignPaywallCta")}
      </Link>
    </div>
  );
}
