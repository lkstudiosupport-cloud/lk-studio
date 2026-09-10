import { Suspense } from "react";
import { ShopBillsClient } from "@/components/ShopBillsClient";
import { PageLoadingSkeleton } from "@/components/PageLoadingSkeleton";

/** Sync shell — avoids awaiting locale RSC on every Bills tab switch. */
export default function ShopBillsPage() {
  return (
    <Suspense fallback={<PageLoadingSkeleton />}>
      <ShopBillsClient />
    </Suspense>
  );
}
