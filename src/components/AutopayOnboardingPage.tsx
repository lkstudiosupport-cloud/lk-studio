"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import type { AutopayRole } from "@/lib/subscription-autopay";
import { AutoPayPanel } from "@/components/AutoPayPanel";
import { BrandLogo } from "@/components/BrandLogo";

export function AutopayOnboardingPage({
  locale,
  role,
  amountInr,
  razorpayConfigured,
  payeeLabel,
  homePath,
}: {
  locale: Locale;
  role: AutopayRole;
  amountInr: number;
  razorpayConfigured: boolean;
  payeeLabel: string;
  homePath: string;
}) {
  const router = useRouter();

  return (
    <main className="brand-page-bg app-page-shell min-h-dvh py-6 sm:py-8">
      <div className="mx-auto w-full max-w-md space-y-6 sm:max-w-lg">
        <BrandLogo locale={locale} size="sm" className="mx-auto" />
        <div className="card-premium space-y-4 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-green text-brand-gold">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-brand-green">{t(locale, "autopayOnboardingTitle")}</h1>
              <p className="mt-1 text-sm text-zinc-600">{t(locale, "autopayOnboardingHint")}</p>
            </div>
          </div>

          <ul className="space-y-2 rounded-xl bg-brand-cream/60 p-4 text-sm text-zinc-700">
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
        </div>
      </div>
    </main>
  );
}
