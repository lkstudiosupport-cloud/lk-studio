"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { PageLoadingSkeleton } from "@/components/PageLoadingSkeleton";
import { ShopBillsPanel } from "@/components/ShopBillsPanel";
import { useShopTabData } from "@/hooks/useShopTabData";
import type { BillsDateMode, BillsTab } from "@/lib/bill-list-filter";

export function ShopBillsClient({ locale }: { locale: Locale }) {
  const searchParams = useSearchParams();
  const query = useMemo(() => {
    const params = new URLSearchParams();
    const billsTab = searchParams.get("tab");
    const mode = searchParams.get("mode");
    const period = searchParams.get("period");
    if (billsTab) params.set("billsTab", billsTab);
    if (mode) params.set("mode", mode);
    if (period) params.set("period", period);
    return params.toString();
  }, [searchParams]);

  const { data, loading, error, refresh } = useShopTabData("bills", query);

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
    <ShopBillsPanel
      locale={locale}
      tab={data.tab as BillsTab}
      mode={data.mode as BillsDateMode}
      period={data.period}
      periodLabel={data.periodLabel}
      total={data.total}
      counts={data.counts}
      bills={data.bills}
    />
  );
}
