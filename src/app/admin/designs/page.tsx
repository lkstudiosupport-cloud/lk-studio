import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { getLocale } from "@/lib/locale-server";
import { AdminCatalogPanel } from "@/components/AdminCatalogPanel";
import { CATALOG_CATEGORIES } from "@/lib/design-access";

export default async function AdminDesignsPage() {
  await requireSession(["ADMIN"]);
  const locale = await getLocale();

  const designs = await prisma.design.findMany({
    where: { isCatalog: true, category: { in: CATALOG_CATEGORIES }, active: true },
    orderBy: { createdAt: "desc" },
  });

  return <AdminCatalogPanel locale={locale} designs={designs} />;
}
