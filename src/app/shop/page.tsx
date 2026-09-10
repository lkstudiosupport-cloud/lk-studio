import { ShopDashboardClient } from "@/components/ShopDashboardClient";

/** Sync shell — locale comes from ShopShellProvider; data from client tab cache. */
export default function ShopDashboardPage() {
  return <ShopDashboardClient />;
}
