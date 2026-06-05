import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import {
  isSubscriptionActive,
  isInTrial,
  trialDaysLeft,
  SHOP_MONTHLY_PRICE_INR,
  CUSTOMER_MONTHLY_PRICE_INR,
} from "@/lib/subscription";
import type { SubscriptionStatus } from "@prisma/client";
import Link from "next/link";

export function SubscriptionBanner({
  locale,
  status,
  endsAt,
  shopCode,
  kind = "shop",
  profileHref,
}: {
  locale: Locale;
  status: SubscriptionStatus;
  endsAt: Date | null;
  shopCode?: string;
  kind?: "shop" | "customer";
  profileHref?: string;
}) {
  const active = isSubscriptionActive(status, endsAt);
  const trial = isInTrial(status, endsAt);
  const daysLeft = trialDaysLeft(endsAt);
  const monthlyPrice = kind === "shop" ? SHOP_MONTHLY_PRICE_INR : CUSTOMER_MONTHLY_PRICE_INR;
  const renewHref = profileHref ?? (kind === "shop" ? "/shop/profile#subscription" : "/customer/profile#subscription");

  return (
    <div
      className={`mb-4 rounded-xl px-4 py-3 text-sm ${
        active ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"
      }`}
    >
      <p className="font-semibold">
        {active
          ? trial
            ? t(locale, "subscriptionTrialActive", { days: String(daysLeft) })
            : t(locale, "subscriptionActive")
          : t(locale, "subscriptionExpired")}
      </p>
      <p className="mt-1 text-xs opacity-90">
        {shopCode && (
          <>
            {t(locale, "shopCode")}: <strong>{shopCode}</strong>
            {" · "}
          </>
        )}
        {endsAt && `${t(locale, "validUntil")} ${endsAt.toLocaleDateString()}`}
        {active && (
          <>
            {" · "}
            {t(locale, "subscriptionMonthlyPrice", { amount: String(monthlyPrice) })}
          </>
        )}
      </p>
      {!active && (
        <Link href={renewHref} className="mt-2 inline-block font-semibold underline">
          {t(locale, "renewSubscription")}
        </Link>
      )}
    </div>
  );
}
