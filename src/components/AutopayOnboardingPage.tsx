"use client";

import Link from "next/link";
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
  allowSkip = false,
}: {
  locale: Locale;
  role: AutopayRole;
  amountInr: number;
  razorpayConfigured: boolean;
  payeeLabel: string;
  homePath: string;
  /** Free trial active — user may enter the app without mandate for now. */
  allowSkip?: boolean;
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
              <h1 className="text-xl font-bold text-brand-green">{t(locale, "autopayOnboardingTitle")}</h1>
              <p className="mt-1 text-sm text-zinc-600">
                {allowSkip ? t(locale, "autopayOnboardingHintTrial") : t(locale, "autopayOnboardingHint")}
              </p>
            </div>
          </div>

          <ul className="space-y-2 rounded-xl bg-brand-cream/60 p-4 text-sm text-zinc-700">
            {allowSkip && (
              <>
                <li>• {t(locale, "autopayOnboardingTrial")}</li>
                <li>• {t(locale, "autopayOnboardingAfterTrial", { amount: amountInr })}</li>
              </>
            )}
            <li>• {t(locale, "autopayOnboardingNoCancel")}</li>
          </ul>

          <AutoPayPanel
            locale={locale}
            role={role}
            amountInr={amountInr}
            autopayEnabled={false}
            razorpayConfigured={razorpayConfigured}
            payeeLabel={payeeLabel}
            onboarding
            onSuccess={() => {
              router.push(homePath);
              router.refresh();
            }}
          />

          <div className="space-y-3 border-t border-zinc-200 pt-4 text-center text-sm">
            {allowSkip && (
              <Link
                href={homePath}
                className="block font-semibold text-brand-green underline-offset-2 hover:underline"
              >
                {t(locale, "autopaySkipForNow")}
              </Link>
            )}
            <ProfileLogout locale={locale} />
          </div>
        </div>
      </div>
    </main>
  );
}
