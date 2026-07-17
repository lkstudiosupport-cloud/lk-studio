import { cachedLocale } from "@/lib/cached-server";
import { ShopDashboardClient } from "@/components/ShopDashboardClient";

export default async function ShopDashboardPage() {
  const locale = await cachedLocale();
  return <ShopDashboardClient locale={locale} />;
}
