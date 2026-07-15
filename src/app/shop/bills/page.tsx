import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { billCustomerName } from "@/lib/bill-customer";
import {
  formatBillsPeriodLabel,
  resolveBillsListFilter,
} from "@/lib/bill-list-filter";
import { ShopBillsPanel } from "@/components/ShopBillsPanel";
import { getCachedShopBillsCounts, getCachedShopBillsList } from "@/lib/cached-shop-data";
import { withDbRetry } from "@/lib/safe-db";
import { ServerRetryPanel } from "@/components/ServerRetryPanel";

export default async function ShopBillsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; mode?: string; period?: string }>;
}) {
  const session = await requireSession(["SHOP"]);
  const locale = await getLocale();
  const shopId = session!.shopId!;
  const params = await searchParams;
  const { tab, mode, period } = resolveBillsListFilter(params.tab, params.mode, params.period);

  try {
    const [{ bills, total }, counts] = await withDbRetry(() =>
      Promise.all([
        getCachedShopBillsList(shopId, tab, mode, period),
        getCachedShopBillsCounts(shopId),
      ])
    );

    const periodLabel = tab === "paid" ? formatBillsPeriodLabel(mode, period) : "";

    return (
      <ShopBillsPanel
        locale={locale}
        tab={tab}
        mode={mode}
        period={period}
        periodLabel={periodLabel}
        total={total}
        counts={counts}
        bills={bills.map((b) => ({
          ...b,
          displayName: billCustomerName(b),
        }))}
      />
    );
  } catch (err) {
    console.error("[lk-studio] shop bills error:", err);
    return <ServerRetryPanel locale={locale} />;
  }
}
