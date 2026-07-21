import { cachedLocale } from "@/lib/cached-server";
import { CreateBillFlow } from "@/components/CreateBillFlow";

export const dynamic = "force-dynamic";

/** Instant shell — customers load in the client so create-bill opens fast. */
export default async function ShopCreateBillPage() {
  const locale = await cachedLocale();
  return <CreateBillFlow locale={locale} customers={[]} />;
}
