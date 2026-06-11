import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { CreateShopOrderFlow } from "@/components/CreateShopOrderFlow";
import { DESIGN_LIST_LIMIT } from "@/lib/limits";

export default async function ShopNewOrderPage() {
  const session = await requireSession(["SHOP"]);
  const locale = await getLocale();
  const shopId = session!.shopId!;

  const [customers, designs] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CUSTOMER", orders: { some: { shopId } } },
      select: { id: true, name: true, phone: true, whatsapp: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.design.findMany({
      where: { shopId, active: true },
      select: { id: true, title: true, category: true, imagePath: true, imagesJson: true },
      orderBy: { createdAt: "desc" },
      take: DESIGN_LIST_LIMIT,
    }),
  ]);

  return <CreateShopOrderFlow locale={locale} customers={customers} designs={designs} />;
}
