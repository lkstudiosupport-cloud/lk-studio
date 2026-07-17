import { Suspense } from "react";
import { cachedLocale } from "@/lib/cached-server";
import { ShopOrdersClient } from "@/components/ShopOrdersClient";
import { PageLoadingSkeleton } from "@/components/PageLoadingSkeleton";

export default async function ShopOrdersPage() {
  const locale = await cachedLocale();
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <ShopOrdersClient locale={locale} />
    </Suspense>
  );
}
