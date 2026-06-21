import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { appCatalogDesignsWhere } from "@/lib/design-access";
import { DESIGN_CARD_SELECT } from "@/lib/design-queries";
import { CATALOG_LIST_LIMIT } from "@/lib/limits";

/** App catalog designs — deduped within a single server request. */
export const cachedAppCatalogDesigns = cache(() =>
  prisma.design.findMany({
    where: appCatalogDesignsWhere(),
    select: DESIGN_CARD_SELECT,
    orderBy: [{ catalogNumber: "asc" }, { createdAt: "desc" }],
    take: CATALOG_LIST_LIMIT,
  })
);
