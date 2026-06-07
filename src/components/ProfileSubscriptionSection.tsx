"use client";

import { useEffect, useState } from "react";
import { ChevronDown, CreditCard } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import {
  isSubscriptionBlocked,
  isInTrial,
} from "@/lib/subscription";
import { SubscriptionPanel } from "@/components/SubscriptionPanel";
import type { SubscriptionStatus } from "@prisma/client";
import type { AutopayRole } from "@/lib/subscription-autopay";

export function ProfileSubscriptionSection({
  locale,
  status,
  endsAt,
  amountInr,
  roleLabel,
  role,
  autopayEnabled,
  razorpayConfigured,
  payeeLabel,
  defaultOpen = false,
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
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const blocked = isSubscriptionBlocked(status, endsAt);
  const trial = isInTrial(status, endsAt);

  const statusLabel = blocked
    ? t(locale, "subStatusExpired")
    : trial
      ? t(locale, "subStatusTrial")
      : t(locale, "subStatusActive");

  const statusClass = blocked
    ? "bg-red-100 text-red-800"
    : trial
      ? "bg-amber-100 text-amber-900"
      : "bg-emerald-100 text-emerald-800";

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#subscription") {
      setOpen(true);
    }
  }, []);

  return (
    <section id="subscription" className="mt-8 border-t border-brand-green/10 pt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-xl border-2 border-brand-green/20 bg-white px-4 py-3.5 text-left shadow-sm transition hover:bg-brand-cream/40 active:scale-[0.99]"
      >
        <span className="flex min-w-0 items-center gap-2">
          <CreditCard className="h-4 w-4 shrink-0 text-brand-green" />
          <span className="text-sm font-semibold text-brand-green">{t(locale, "subscriptionTab")}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${statusClass}`}>
            {statusLabel}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-brand-green transition ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div className="mt-4">
          <SubscriptionPanel
            locale={locale}
            status={status}
            endsAt={endsAt}
            amountInr={amountInr}
            roleLabel={roleLabel}
            role={role}
            autopayEnabled={autopayEnabled}
            razorpayConfigured={razorpayConfigured}
            payeeLabel={payeeLabel}
            inProfile
          />
        </div>
      )}
    </section>
  );
}
