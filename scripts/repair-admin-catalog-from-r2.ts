/**
 * Restore admin catalog photos from R2 and fix visibility (size tier / part).
 * Use after seed placeholders removed some DB rows or overwrote image paths.
 *
 * Preview: npm run catalog:repair-admin
 * Apply:   npm run catalog:repair-admin -- --apply
 */
import { PrismaClient, type DesignSizeTier, type ServiceCategory } from "@prisma/client";
import { assignCatalogDesignPart } from "../src/lib/admin-assign-part";
import { assignCatalogDesignSizeTier } from "../src/lib/admin-assign-tier";
import { categoryHasCatalogParts } from "../src/lib/design-catalog-part";
import { categoryHasSizeTiers } from "../src/lib/design-size-tier";
import { CATALOG_CATEGORIES } from "../src/lib/design-access";
import {
  isAdminCatalogUploadImagePath,
  isSeedMaggamPlaceholderImagePath,
} from "../src/lib/seed-maggam-placeholder";
import { CATEGORY_STORAGE_FOLDERS } from "../src/lib/shop-storage";
import { storageKeyFromStoredUrl, storedUrlForKey } from "../src/lib/storage-url";
import { r2ListKeys } from "../src/lib/r2-object";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");

const FOLDER_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORY_STORAGE_FOLDERS).map(([cat, folder]) => [folder, cat as ServiceCategory])
) as Record<string, ServiceCategory>;

const SIZE_FOLDER: Record<string, DesignSizeTier> = {
  small: "SMALL",
  medium: "MEDIUM",
  big: "BIG",
};

type ParsedKey = {
  key: string;
  category: ServiceCategory;
  sizeTier: DesignSizeTier | null;
};

function parseCatalogUploadKey(key: string): ParsedKey | null {
  const m = key.match(/^uploads\/catalog\/([^/]+)(?:\/([^/]+))?\/[^/]+\.(jpe?g|png|webp)$/i);
  if (!m) return null;
  const [, folder, maybeSize] = m;
  const category = FOLDER_TO_CATEGORY[folder!];
  if (!category || !CATALOG_CATEGORIES.includes(category)) return null;

  const sizeTier = maybeSize ? SIZE_FOLDER[maybeSize.toLowerCase()] ?? null : null;
  return { key, category, sizeTier };
}

function collectStorageKeys(imagePath: string, imagesJson: string | null): string[] {
  const keys = new Set<string>();
  const add = (p: string) => {
    const k = storageKeyFromStoredUrl(p);
    if (k) keys.add(k);
  };
  add(imagePath);
  if (imagesJson) {
    try {
      const arr = JSON.parse(imagesJson) as unknown;
      if (Array.isArray(arr)) {
        for (const p of arr) {
          if (typeof p === "string") add(p);
        }
      }
    } catch {
      // ignore
    }
  }
  return [...keys];
}

async function listAllCatalogUploadKeys(): Promise<string[]> {
  const prefixes = [...new Set(Object.values(CATEGORY_STORAGE_FOLDERS))].map(
    (f) => `uploads/catalog/${f}/`
  );
  const keys: string[] = [];
  for (const prefix of prefixes) {
    const listed = await r2ListKeys(prefix);
    keys.push(...listed.filter((k) => /\.(jpe?g|png|webp)$/i.test(k)));
  }
  return keys.sort();
}

async function main() {
  const allDesigns = await prisma.design.findMany({
    where: { isCatalog: true, category: { in: CATALOG_CATEGORIES }, active: true },
    select: {
      id: true,
      catalogNumber: true,
      category: true,
      imagePath: true,
      imagesJson: true,
      sizeTier: true,
      catalogPart: true,
    },
  });

  const byStorageKey = new Map<string, (typeof allDesigns)[number]>();
  for (const d of allDesigns) {
    for (const k of collectStorageKeys(d.imagePath, d.imagesJson)) {
      byStorageKey.set(k, d);
    }
  }

  const seedLeft = allDesigns.filter((d) => isSeedMaggamPlaceholderImagePath(d.imagePath));
  const adminRows = allDesigns.filter((d) => isAdminCatalogUploadImagePath(d.imagePath));
  const brokenRows = allDesigns.filter(
    (d) =>
      !isAdminCatalogUploadImagePath(d.imagePath) &&
      !isSeedMaggamPlaceholderImagePath(d.imagePath) &&
      !d.imagePath.includes("placeholder")
  );

  console.log("Catalog audit:");
  console.log(`  Admin uploads in DB: ${adminRows.length}`);
  console.log(`  Seed placeholders still in DB: ${seedLeft.length}`);
  console.log(`  Other / broken paths: ${brokenRows.length}`);

  const r2Keys = await listAllCatalogUploadKeys();
  console.log(`  Admin photo files on R2: ${r2Keys.length}`);

  const missingOnDb: ParsedKey[] = [];
  const needsTierFix: { design: (typeof allDesigns)[number]; tier: DesignSizeTier }[] = [];

  for (const key of r2Keys) {
    const parsed = parseCatalogUploadKey(key);
    if (!parsed) continue;
    const existing = byStorageKey.get(key);
    if (!existing) {
      missingOnDb.push(parsed);
      continue;
    }
    if (
      parsed.sizeTier &&
      categoryHasSizeTiers(existing.category) &&
      existing.sizeTier !== parsed.sizeTier
    ) {
      needsTierFix.push({ design: existing, tier: parsed.sizeTier });
    }
  }

  const unassignedVisible = adminRows.filter((d) => {
    if (categoryHasSizeTiers(d.category)) return d.sizeTier == null;
    if (categoryHasCatalogParts(d.category)) return d.catalogPart == null;
    return false;
  });

  console.log(`\nTo restore (on R2, missing DB row): ${missingOnDb.length}`);
  console.log(`To fix tier from folder path: ${needsTierFix.length}`);
  console.log(`Unassigned admin uploads (hidden from customers): ${unassignedVisible.length}`);

  if (missingOnDb.length > 0) {
    console.log("\nSample missing:");
    for (const p of missingOnDb.slice(0, 5)) {
      console.log(`  ${p.category} ${p.sizeTier ?? "unassigned"} — ${p.key}`);
    }
  }

  if (!APPLY) {
    console.log("\nDry run. Re-run with --apply to restore and fix.");
    return;
  }

  let removedSeed = 0;
  for (const d of seedLeft) {
    await prisma.design.delete({ where: { id: d.id } });
    removedSeed++;
  }

  let restored = 0;
  for (const p of missingOnDb) {
    const imagePath = storedUrlForKey(p.key);
    const filename = p.key.split("/").pop()!;
    const title = filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").slice(0, 120);

    const design = await prisma.design.create({
      data: {
        isCatalog: true,
        shopId: null,
        title: title || "Design",
        category: p.category,
        workType: "STITCHING",
        imagePath,
        imagesJson: JSON.stringify([imagePath]),
        active: true,
      },
    });

    if (p.sizeTier && categoryHasSizeTiers(p.category)) {
      await assignCatalogDesignSizeTier(design.id, p.sizeTier);
    } else if (categoryHasCatalogParts(p.category)) {
      await assignCatalogDesignPart(design.id, "MAIN");
    }
    restored++;
  }

  let tierFixed = 0;
  for (const { design, tier } of needsTierFix) {
    await assignCatalogDesignSizeTier(design.id, tier);
    tierFixed++;
  }

  let assigned = 0;
  for (const d of unassignedVisible) {
    if (categoryHasSizeTiers(d.category)) {
      const key = storageKeyFromStoredUrl(d.imagePath);
      const tierFromPath =
        key?.includes("/small/") ? "SMALL" : key?.includes("/medium/") ? "MEDIUM" : key?.includes("/big/") ? "BIG" : null;
      if (tierFromPath) {
        await assignCatalogDesignSizeTier(d.id, tierFromPath);
        assigned++;
      }
    } else if (categoryHasCatalogParts(d.category) && d.catalogPart == null) {
      await assignCatalogDesignPart(d.id, "MAIN");
      assigned++;
    }
  }

  console.log(`\nDone:`);
  console.log(`  Removed ${removedSeed} seed placeholder row(s)`);
  console.log(`  Restored ${restored} design(s) from R2`);
  console.log(`  Fixed tier on ${tierFixed} design(s)`);
  console.log(`  Assigned ${assigned} previously unassigned design(s)`);
  console.log("\nRefresh Admin → Designs and customer Designs page.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
