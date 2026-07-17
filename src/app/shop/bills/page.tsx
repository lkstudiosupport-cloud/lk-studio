import { Suspense } from "react";
import { cachedLocale } from "@/lib/cached-server";
import { ShopBillsClient } from "@/components/ShopBillsClient";
import { PageLoadingSkeleton } from "@/components/PageLoadingSkeleton";

export default async function ShopBillsPage() {
  const locale = await cachedLocale();
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <ShopBillsClient locale={locale} />
    </Suspense>
  );
}
