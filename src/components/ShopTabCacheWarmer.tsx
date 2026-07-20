"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { fetchShopTabData } from "@/lib/shop-tab-client-cache";
import { catalogBrowseApiQuery } from "@/lib/catalog-browse-query";
import { defaultSizeTierForCategory } from "@/lib/design-size-tier";
import {
  markShopBootDoneThisSession,
  markShopPriorityTabsReady,
  shopBootAlreadyDoneThisSession,
} from "@/lib/shop-boot";

type Phase = "tabs" | "designs" | "done";

/**
 * First APK/shop open: load Home → Orders → Bills → Partner, then Designs.
 * Shows a loading circle at the bottom of the page while preparing.
 */
export function ShopTabCacheWarmer({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(() =>
    shopBootAlreadyDoneThisSession() ? "done" : "tabs"
  );

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const quiet = shopBootAlreadyDoneThisSession();
      if (!quiet) setPhase("tabs");
      else markShopPriorityTabsReady();

      // Priority tabs — Home first, then Orders / Bills / Partner.
      try {
        await fetchShopTabData("dashboard");
      } catch {
        /* ignore */
      }
      if (cancelled) return;

      await Promise.all([
        fetchShopTabData("orders").catch(() => null),
        fetchShopTabData("bills").catch(() => null),
        fetchShopTabData("workers").catch(() => null),
      ]);
      if (cancelled) return;

      markShopPriorityTabsReady();

      if (!quiet) setPhase("designs");

      // Designs last — route + first catalog page (does not block priority tabs).
      try {
        router.prefetch("/shop/designs");
        const size = defaultSizeTierForCategory("MAGGAM");
        const q = catalogBrowseApiQuery({
          category: "MAGGAM",
          ...(size ? { sizeTier: size } : {}),
        });
        await fetch(`/api/catalog/designs?${q}&page=1`, {
          credentials: "include",
          cache: "no-store",
        });
      } catch {
        /* ignore */
      }
      if (cancelled) return;

      markShopBootDoneThisSession();
      setPhase("done");
    }

    void boot();

    const refresh = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void fetchShopTabData("dashboard", "", { force: true }).catch(() => {});
    }, 2 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(refresh);
    };
  }, [router]);

  if (phase === "done") return null;

  const label =
    phase === "designs"
      ? t(locale, "shopBootLoadingDesigns")
      : t(locale, "shopBootLoadingTabs");

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-3"
      style={{
        bottom: "max(calc(var(--app-bottom-nav-safe-offset) + 0.65rem), 4.75rem)",
      }}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="pointer-events-none flex max-w-[min(100%,20rem)] items-center gap-2 rounded-full bg-brand-green px-3.5 py-2 text-brand-gold shadow-lg ring-1 ring-brand-gold/30">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        <span className="truncate text-xs font-semibold sm:text-sm">{label}</span>
      </div>
    </div>
  );
}
