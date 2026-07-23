import { redirect } from "next/navigation";

/** Customers are free — no subscription page. */
export default function CustomerSubscriptionPage() {
  redirect("/customer/designs");
}
