import { cachedLocale } from "@/lib/cached-server";
import { ShopWorkersClient } from "@/components/ShopWorkersClient";

export default async function ShopWorkersPage() {
  const locale = await cachedLocale();
  return <ShopWorkersClient locale={locale} />;
}
