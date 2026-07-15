import { ShopDashboard } from "@/components/ShopDashboard";
import { cachedLocale, cachedShopSession } from "@/lib/cached-server";
import { getCachedShopDashboard } from "@/lib/cached-shop-data";
import { withDbRetry } from "@/lib/safe-db";
import { ServerRetryPanel } from "@/components/ServerRetryPanel";

export default async function ShopDashboardPage() {
  const session = await cachedShopSession();
  const locale = await cachedLocale();
  const shopId = session!.shopId!;

  try {
    const { orders, weeklyIncome, monthlyIncome, statusCounts } = await withDbRetry(() =>
      getCachedShopDashboard(shopId)
    );

    return (
      <ShopDashboard
        locale={locale}
        weeklyIncome={weeklyIncome}
        monthlyIncome={monthlyIncome}
        statusCounts={statusCounts}
        orders={orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          customerName: o.customer.name,
          personName: o.person?.name ?? o.customer.name,
          designTitle: o.design?.title ?? null,
        }))}
      />
    );
  } catch (err) {
    console.error("[lk-studio] shop dashboard error:", err);
    return <ServerRetryPanel locale={locale} />;
  }
}
