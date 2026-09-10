import { Suspense } from "react";
import { ShopOrdersClient } from "@/components/ShopOrdersClient";
import { PageLoadingSkeleton } from "@/components/PageLoadingSkeleton";

/** Sync shell — avoids awaiting locale RSC on every Orders tab switch. */
export default function ShopOrdersPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <ShopOrdersClient />
    </Suspense>
  );
}
