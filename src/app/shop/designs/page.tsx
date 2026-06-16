import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { ShopDesignsPanel } from "@/components/ShopDesignsPanel";
import { DESIGN_LIST_LIMIT } from "@/lib/limits";
import { visibleDesignsWhere } from "@/lib/design-access";

export default async function ShopDesignsPage() {
  const session = await requireSession(["SHOP"]);
  const locale = await getLocale();
  const shopId = session!.shopId!;
  const designs = await prisma.design.findMany({
    where: visibleDesignsWhere(shopId),
    orderBy: { createdAt: "desc" },
    take: DESIGN_LIST_LIMIT,
  });

  return <ShopDesignsPanel locale={locale} designs={designs} />;
}

