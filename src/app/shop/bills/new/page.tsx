import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { CreateBillFlow } from "@/components/CreateBillFlow";

export default async function ShopCreateBillPage() {
  const session = await requireSession(["SHOP"]);
  const locale = await getLocale();
  const shopId = session!.shopId!;

  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER", orders: { some: { shopId } } },
    select: { id: true, name: true, phone: true, whatsapp: true },
    orderBy: { name: "asc" },
    take: 500,
  });

  return <CreateBillFlow locale={locale} customers={customers} />;
}
