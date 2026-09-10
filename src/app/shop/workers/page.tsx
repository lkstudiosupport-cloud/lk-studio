import { ShopWorkersClient } from "@/components/ShopWorkersClient";

/** Sync shell — avoids awaiting locale RSC on every Workers tab switch. */
export default function ShopWorkersPage() {
  return <ShopWorkersClient />;
}
