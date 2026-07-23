"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { AutopayRole } from "@/lib/subscription-autopay";
import { AutoPayPanel } from "@/components/AutoPayPanel";
import { BrandLogo } from "@/components/BrandLogo";
import { LocaleLocationBar } from "@/components/LocaleLocationBar";
import { ProfileLogout } from "@/components/ProfileLogout";

export function AutopayOnboardingPage({
  locale,
  role,
  amountInr,
  razorpayConfigured,
  payeeLabel,
  homePath,
  inTrial = true,
}: {
  locale: Locale;
  role: AutopayRole;
  amountInr: number;
  razorpayConfigured: boolean;
  payeeLabel: string;
  homePath: string;
  /** Active free trial — autopay optional; billing starts after trial ends. */
  inTrial?: boolean;
}) {
  const router = useRouter();

  return (
    <main className="brand-page-bg app-page-shell mx-auto flex min-h-dvh w-full max-w-lg flex-col py-6 sm:max-w-xl sm:py-8 md:max-w-2xl">
      <div className="mb-4 flex justify-end">
        <LocaleLocationBar locale={locale} />
      </div>

      <div className="mx-auto w-full flex-1 space-y-6">
        <BrandLogo locale={locale} size="sm" className="mx-auto" />
        <div className="card-premium space-y-4 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-green text-brand-gold">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-brand-green">
                {inTrial
                  ? t(locale, "autopayOnboardingTitle")
                  : t(locale, "paymentRequiredTitle")}
              </h1>
              <p className="mt-1 text-sm text-zinc-600">
                {inTrial
                  ? t(locale, "autopayOnboardingHintTrial")
                  : t(locale, "paymentRequiredHint", { amount: amountInr })}
              </p>
            </div>
          </div>

          <ul className="space-y-2 rounded-xl bg-brand-cream/60 p-4 text-sm text-zinc-700">
            {inTrial ? (
              <>
                <li>• {t(locale, "autopayOnboardingTrial")}</li>
                <li>• {t(locale, "autopayOnboardingAfterTrial", { amount: amountInr })}</li>
                <li>• {t(locale, "autopayOnboardingNoCancel")}</li>
              </>
            ) : (
              <>
                <li>• {t(locale, "paymentRequiredAutopay", { amount: amountInr })}</li>
                <li>• {t(locale, "paymentRequiredMonthly", { amount: amountInr })}</li>
                <li>• {t(locale, "paymentRequiredLock")}</li>
              </>
            )}
          </ul>

          <AutoPayPanel
            locale={locale}
            role={role}
            amountInr={amountInr}
            autopayEnabled={false}
            razorpayConfigured={razorpayConfigured}
            payeeLabel={payeeLabel}
            onboarding
            inTrial={inTrial}
            allowMonthlyPay={!inTrial}
            onSuccess={() => {
              router.push(homePath);
              router.refresh();
            }}
          />

          {inTrial && (
            <button
              type="button"
              onClick={() => {
                router.push(homePath);
                router.refresh();
              }}
              className="btn-secondary w-full py-3 text-sm"
            >
              {t(locale, "autopaySkipTrial")}
            </button>
          )}

          <div className="space-y-3 border-t border-zinc-200 pt-4 text-center text-sm">
            <ProfileLogout locale={locale} />
          </div>
        </div>
      </div>
    </main>
  );
}
