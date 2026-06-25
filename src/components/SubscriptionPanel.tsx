import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import {
  isSubscriptionActive,
  isSubscriptionBlocked,
  isInTrial,
  subscriptionDaysLeft,
  resolveSubscriptionEndsAt,
} from "@/lib/subscription";
import { AutoPayPanel } from "@/components/AutoPayPanel";
import type { SubscriptionStatus } from "@prisma/client";
import type { AutopayRole } from "@/lib/subscription-autopay";
import { Clock, IndianRupee } from "lucide-react";

export function SubscriptionPanel({
  locale,
  status,
  endsAt,
  amountInr,
  roleLabel,
  role,
  autopayEnabled,
  razorpayConfigured,
  payeeLabel,
  inProfile = false,
  accountCreatedAt = null,
}: {
  locale: Locale;
  status: SubscriptionStatus;
  endsAt: Date | null;
  amountInr: number;
  roleLabel: string;
  role: AutopayRole;
  autopayEnabled: boolean;
  razorpayConfigured: boolean;
  payeeLabel: string;
  inProfile?: boolean;
  accountCreatedAt?: Date | null;
}) {
  const effectiveEndsAt = resolveSubscriptionEndsAt(status, endsAt, accountCreatedAt);
  const active = isSubscriptionActive(status, endsAt, accountCreatedAt);
  const blocked = isSubscriptionBlocked(status, endsAt, accountCreatedAt);
  const trial = isInTrial(status, endsAt, accountCreatedAt);
  const daysLeft = subscriptionDaysLeft(endsAt, status, accountCreatedAt);

  const statusText = blocked
    ? t(locale, "subStatusExpired")
    : trial
      ? t(locale, "subStatusTrial")
      : t(locale, "subStatusActive");

  const statusClass = blocked
    ? "bg-red-100 text-red-800"
    : trial
      ? "bg-amber-100 text-amber-900"
      : "bg-emerald-100 text-emerald-800";

  return (
    <div className="space-y-4">
      {!inProfile && (
        <div>
          <h1 className="page-title">{t(locale, "subscriptionTab")}</h1>
          <p className="mt-1 text-sm text-zinc-600">{roleLabel}</p>
        </div>
      )}

      <div className="card-premium space-y-4 p-5">
        {inProfile && (
          <p className="text-sm text-zinc-600">{roleLabel}</p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}>
            {statusText}
          </span>
          {active && (
            <span className="flex items-center gap-1 text-sm font-semibold text-brand-green">
              <Clock className="h-4 w-4" />
              {t(locale, "subDaysLeft", { days: daysLeft })}
            </span>
          )}
        </div>

        <dl className="grid gap-3 text-sm">
          <div className="flex items-start gap-3 rounded-xl bg-brand-cream/60 p-3">
            <IndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
            <div>
              <dt className="text-xs font-semibold uppercase text-zinc-500">{t(locale, "subPriceLabel")}</dt>
              <dd className="font-bold text-brand-green">
                {t(locale, "subPricePerMonth", { amount: amountInr })}
              </dd>
            </div>
          </div>
          {effectiveEndsAt && (
            <div className="flex items-start gap-3 rounded-xl bg-brand-cream/60 p-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
              <div>
                <dt className="text-xs font-semibold uppercase text-zinc-500">{t(locale, "validUntil")}</dt>
                <dd className="font-semibold text-zinc-800">{effectiveEndsAt.toLocaleDateString()}</dd>
              </div>
            </div>
          )}
        </dl>

        {trial && !autopayEnabled && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
            {t(locale, "subRule1")}
          </p>
        )}

        {!autopayEnabled && (
          <div className="border-t border-zinc-100 pt-4">
            <p
              className={`mb-3 text-sm font-semibold ${
                blocked ? "text-red-700" : trial ? "text-amber-800" : "text-red-700"
              }`}
            >
              {trial
                ? role === "CUSTOMER"
                  ? t(locale, "customerSubTrialHint")
                  : t(locale, "subTrialAutopayHint")
                : role === "CUSTOMER"
                  ? blocked
                    ? t(locale, "customerSubExpired")
                    : t(locale, "customerSubUnlockDesigns")
                  : blocked
                    ? t(locale, "subEnableAutopayNow")
                    : t(locale, "subAutopayRequired")}
            </p>
            <AutoPayPanel
              locale={locale}
              role={role}
              amountInr={amountInr}
              autopayEnabled={autopayEnabled}
              razorpayConfigured={razorpayConfigured}
              payeeLabel={payeeLabel}
              embedded
              inTrial={trial}
            />
          </div>
        )}
      </div>
    </div>
  );
}
