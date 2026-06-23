import { redirect } from "next/navigation";

/** Price quotes live on the Orders page now. */
export default function ShopPriceRequestsPage() {
  redirect("/shop/orders?tab=price-quotes");
}
