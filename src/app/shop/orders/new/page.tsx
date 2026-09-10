import { cachedLocale } from "@/lib/cached-server";
import { CreateShopOrderFlow } from "@/components/CreateShopOrderFlow";

export const dynamic = "force-dynamic";

/** Instant shell — customers load in the client (orders + bill walk-ins). */
export default async function ShopNewOrderPage() {
  const locale = await cachedLocale();
  return <CreateShopOrderFlow locale={locale} customers={[]} />;
}
