"use client";

import { useEffect } from "react";
import { t } from "@/lib/i18n";
import { PageLoadingSkeleton } from "@/components/PageLoadingSkeleton";
import { ShopWorkPartnerRequestForm } from "@/components/ShopWorkPartnerRequestForm";
import { ShopWorkPartnerRequestsList } from "@/components/ShopWorkPartnerRequestsList";
import { useShopTabData } from "@/hooks/useShopTabData";
import { useShopShell } from "@/components/ShopShellProvider";
import { fetchShopTabData, invalidateAndPrefetchShopTabs } from "@/lib/shop-tab-client-cache";

export function ShopWorkersClient() {
  const { locale } = useShopShell();
  const { data, loading, error, refresh, setData } = useShopTabData("workers");

  // Keep checking for new acceptances while requests are open — silent SWR, no skeleton.
  useEffect(() => {
    const hasOpen = (data?.requests ?? []).some(
      (r) =>
        r.status === "OPEN" ||
        r.applications?.some((a) => ["APPLIED", "SUBMITTED"].includes(a.status))
    );
    if (!hasOpen) return;
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void fetchShopTabData("workers", "", { force: true })
        .then((fresh) => setData(fresh))
        .catch(() => {});
    }, 15_000);
    return () => window.clearInterval(id);
  }, [data?.requests, setData]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">{t(locale, "workers")}</h1>
          <p className="mt-1 text-sm text-zinc-600">{t(locale, "workerPartnerPageHint")}</p>
        </div>
        <PageLoadingSkeleton />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">{t(locale, "workers")}</h1>
        </div>
        <div className="card-premium mx-auto max-w-md space-y-4 p-6 text-center">
          <h2 className="text-lg font-bold text-brand-green">{t(locale, "serverTemporaryErrorTitle")}</h2>
          <p className="text-sm text-zinc-600">{t(locale, "serverTemporaryErrorHint")}</p>
          <button type="button" className="btn-primary w-full py-3" onClick={() => void refresh()}>
            {t(locale, "tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  const requests = data?.requests ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t(locale, "workers")}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t(locale, "workerPartnerPageHint")}</p>
      </div>
      <ShopWorkPartnerRequestForm
        locale={locale}
        onCreated={() => {
          invalidateAndPrefetchShopTabs("workers");
          void refresh();
        }}
      />
      <ShopWorkPartnerRequestsList
        locale={locale}
        requests={requests}
        onRefresh={() => {
          invalidateAndPrefetchShopTabs("workers");
          void refresh();
        }}
      />
    </div>
  );
}
