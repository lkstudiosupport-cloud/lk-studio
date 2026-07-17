"use client";

import { ShopDashboard } from "@/components/ShopDashboard";
import { PageLoadingSkeleton } from "@/components/PageLoadingSkeleton";
import { useShopTabData } from "@/hooks/useShopTabData";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";

export function ShopDashboardClient({ locale }: { locale: Locale }) {
  const { data, loading, error, refresh } = useShopTabData("dashboard");

  if (loading && !data) return <PageLoadingSkeleton />;
  if (error && !data) {
    return (
      <div className="card-premium mx-auto max-w-md space-y-4 p-6 text-center">
        <h2 className="text-lg font-bold text-brand-green">{t(locale, "serverTemporaryErrorTitle")}</h2>
        <p className="text-sm text-zinc-600">{t(locale, "serverTemporaryErrorHint")}</p>
        <button type="button" className="btn-primary w-full py-3" onClick={() => void refresh()}>
          {t(locale, "tryAgain")}
        </button>
      </div>
    );
  }
  if (!data) return <PageLoadingSkeleton />;

  return (
    <ShopDashboard
      locale={locale}
      weeklyIncome={data.weeklyIncome}
      monthlyIncome={data.monthlyIncome}
      statusCounts={data.statusCounts}
      orders={data.orders}
    />
  );
}
