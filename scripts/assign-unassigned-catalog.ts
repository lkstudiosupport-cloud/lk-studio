/**
 * Assign unassigned admin catalog uploads so they appear in customer Designs.
 *
 * Maggam / embroidery → size tier (SMALL default)
 * Blouse / dress → catalog part (MAIN default)
 *
 * Preview: npm run catalog:assign-unassigned -- --category=maggam
 * Apply:   npm run catalog:assign-unassigned -- --category=maggam --tier=small --apply
 */
import { PrismaClient, type CatalogPart, type DesignSizeTier, type ServiceCategory } from "@prisma/client";
import { assignCatalogDesignPart } from "../src/lib/admin-assign-part";
import { assignCatalogDesignSizeTier } from "../src/lib/admin-assign-tier";
import { categoryHasCatalogParts } from "../src/lib/design-catalog-part";
import { categoryHasSizeTiers } from "../src/lib/design-size-tier";
import { CATALOG_CATEGORIES } from "../src/lib/design-access";
import { isSeedMaggamPlaceholderImagePath } from "../src/lib/seed-maggam-placeholder";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

function categoryArg(): ServiceCategory {
  const raw = process.argv.find((a) => a.startsWith("--category="))?.split("=")[1]?.toUpperCase();
  if (!raw) throw new Error("Pass --category=maggam|embroidery|blouse|dress|children");
  const map: Record<string, ServiceCategory> = {
    MAGGAM: "MAGGAM",
    EMBROIDERY: "COMPUTER_EMBROIDERY",
    COMPUTER: "COMPUTER_EMBROIDERY",
    COMPUTER_EMBROIDERY: "COMPUTER_EMBROIDERY",
    BLOUSE: "BLOUSE_DESIGN",
    BLOUSE_DESIGN: "BLOUSE_DESIGN",
    DRESS: "DRESS_MODEL",
    DRESS_MODEL: "DRESS_MODEL",
    CHILDREN: "CHILDREN_WEAR",
    CHILDREN_WEAR: "CHILDREN_WEAR",
  };
  const cat = map[raw];
  if (!cat || !CATALOG_CATEGORIES.includes(cat)) {
    throw new Error(`Unknown category "${raw}"`);
  }
  return cat;
}

function tierArg(): DesignSizeTier {
  const raw = process.argv.find((a) => a.startsWith("--tier="))?.split("=")[1]?.toUpperCase();
  if (raw === "MEDIUM" || raw === "M") return "MEDIUM";
  if (raw === "BIG" || raw === "B") return "BIG";
  return "SMALL";
}

function partArg(): CatalogPart {
  const raw = process.argv.find((a) => a.startsWith("--part="))?.split("=")[1]?.toUpperCase();
  if (raw === "HAND" || raw === "HAND_SLEEVES" || raw === "SLEEVES") return "HAND_SLEEVES";
  return "MAIN";
}

async function main() {
  const category = categoryArg();
  const tier = tierArg();
  const part = partArg();

  const rows = await prisma.design.findMany({
    where: { isCatalog: true, category, active: true },
    select: { id: true, catalogNumber: true, imagePath: true, sizeTier: true, catalogPart: true },
    orderBy: { createdAt: "asc" },
  });

  const unassigned = rows.filter((d) => {
    if (category === "MAGGAM" && isSeedMaggamPlaceholderImagePath(d.imagePath)) return false;
    if (categoryHasSizeTiers(category)) return d.sizeTier == null;
    if (categoryHasCatalogParts(category)) return d.catalogPart == null;
    return false;
  });

  console.log(`${category}: ${rows.length} catalog design(s), ${unassigned.length} unassigned`);

  if (unassigned.length === 0) {
    console.log("Nothing to assign.");
    return;
  }

  for (const d of unassigned.slice(0, 10)) {
    console.log(`  ${d.catalogNumber ?? d.id}`);
  }
  if (unassigned.length > 10) console.log(`  … and ${unassigned.length - 10} more`);

  if (!APPLY) {
    console.log("\nDry run. Re-run with --apply to assign.");
    return;
  }

  let assigned = 0;
  for (const d of unassigned) {
    if (categoryHasSizeTiers(category)) {
      await assignCatalogDesignSizeTier(d.id, tier);
    } else if (categoryHasCatalogParts(category)) {
      await assignCatalogDesignPart(d.id, part);
    }
    assigned++;
  }

  console.log(`\nAssigned ${assigned} design(s).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
