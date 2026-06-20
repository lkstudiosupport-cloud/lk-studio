import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { AdminCatalogPanel } from "@/components/AdminCatalogPanel";
import { DESIGN_LIST_LIMIT } from "@/lib/limits";
import { CATALOG_CATEGORIES } from "@/lib/design-access";

export default async function AdminDesignsPage() {
  await requireSession(["ADMIN"]);
  const locale = await getLocale();

  const designs = await prisma.design.findMany({
    where: { isCatalog: true, category: { in: CATALOG_CATEGORIES }, active: true },
    orderBy: { createdAt: "desc" },
    take: DESIGN_LIST_LIMIT,
  });

  return <AdminCatalogPanel locale={locale} designs={designs} />;
}
