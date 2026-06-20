/**
 * Method B: images in R2 → Maggam / Embroidery catalog with auto design codes.
 *
 * 1. Upload ANY image names to R2 (PC browser):
 *    - uploads/catalog/maggam-work/   (any .jpg / .png names)
 *    - uploads/catalog/embroidery/
 * 2. Render Shell:
 *    npm run db:import-catalog -- --category=maggam
 *    npm run db:import-catalog -- --dry-run
 *
 * Codes are assigned automatically: MAG-0001, MAG-0002, … / EMB-0001, …
 * (Filenames like MAG-0001.jpg are also accepted.)
 */
import { PrismaClient, type ServiceCategory } from "@prisma/client";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { catalogCodePrefix, nextCatalogDesignNumber } from "../src/lib/catalog-design-number";
import { createS3Client, logS3ConfigHint } from "../src/lib/s3-client";

const prisma = new PrismaClient();

const PREFIXES: { prefix: string; category: ServiceCategory; codeRe: RegExp }[] = [
  {
    prefix: "uploads/catalog/maggam-work/",
    category: "MAGGAM",
    codeRe: /^MAG(?:-(?:S|M|B))?-\d{4}$/i,
  },
  {
    prefix: "uploads/catalog/embroidery/",
    category: "COMPUTER_EMBROIDERY",
    codeRe: /^EMB(?:-(?:S|M|B))?-\d{4}$/i,
  },
];

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`Missing ${name} — set R2/S3 env vars on Render first.`);
  return v;
}

function s3Client() {
  return createS3Client();
}

function publicUrlForKey(key: string): string {
  const base = requireEnv("S3_PUBLIC_URL").replace(/\/$/, "");
  return `${base}/${key.replace(/^\//, "")}`;
}

function catalogNumberFromFilename(filename: string): string | null {
  const base = filename.replace(/\.[^.]+$/, "").trim().toUpperCase();
  if (/^(MAG|EMB)(?:-(?:S|M|B))?-\d{4}$/.test(base)) return base;
  return null;
}

function titleFromFilename(filename: string, fallbackCode: string): string {
  const raw = filename.replace(/\.[^.]+$/, "").trim();
  if (/^(MAG|EMB)(?:-(?:S|M|B))?-\d{4}$/i.test(raw)) return fallbackCode;
  const title = raw.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return title.slice(0, 120) || fallbackCode;
}

function codeFromIndex(category: ServiceCategory, index: number): string {
  const prefix = catalogCodePrefix(category);
  return `${prefix}-${String(index).padStart(4, "0")}`;
}

function parseMaxIndex(category: ServiceCategory, catalogNumber: string): number {
  const prefix = catalogCodePrefix(category);
  if (!catalogNumber.startsWith(prefix)) return 0;
  const match = catalogNumber.match(/(\d{4})$/);
  if (!match) return 0;
  const n = parseInt(match[1]!, 10);
  return Number.isNaN(n) ? 0 : n;
}

async function listImageKeys(prefix: string): Promise<string[]> {
  const bucket = requireEnv("S3_BUCKET");
  const client = s3Client();
  const keys: string[] = [];
  let token: string | undefined;

  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
      })
    );
    for (const obj of res.Contents ?? []) {
      if (!obj.Key) continue;
      if (/\.(jpe?g|png|webp)$/i.test(obj.Key)) keys.push(obj.Key);
    }
    token = res.NextContinuationToken;
  } while (token);

  return keys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function parseArgs() {
  const dryRun = process.argv.includes("--dry-run");
  const force = process.argv.includes("--force");
  const catArg = process.argv.find((a) => a.startsWith("--category="))?.split("=")[1]?.toLowerCase();
  let filter: "all" | "maggam" | "embroidery" = "all";
  if (catArg === "maggam") filter = "maggam";
  else if (catArg === "embroidery" || catArg === "emb") filter = "embroidery";
  return { dryRun, force, filter };
}

async function importPrefix(
  entry: (typeof PREFIXES)[number],
  opts: { dryRun: boolean; force: boolean }
): Promise<{ created: number; updated: number; skipped: number }> {
  const keys = await listImageKeys(entry.prefix);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  console.log(`\n${entry.category}: ${keys.length} file(s) under ${entry.prefix}`);

  let autoIndex = parseMaxIndex(entry.category, await nextCatalogDesignNumber(prisma, entry.category));

  for (const key of keys) {
    const filename = key.split("/").pop()!;
    const imagePath = publicUrlForKey(key);

    const byUrl = await prisma.design.findFirst({ where: { imagePath } });
    if (byUrl && !opts.force) {
      skipped++;
      continue;
    }

    let catalogNumber = catalogNumberFromFilename(filename);
    if (!catalogNumber || !entry.codeRe.test(catalogNumber)) {
      catalogNumber = codeFromIndex(entry.category, autoIndex);
      autoIndex++;
    } else {
      autoIndex = Math.max(autoIndex, parseMaxIndex(entry.category, catalogNumber) + 1);
    }

    const title = titleFromFilename(filename, catalogNumber);
    const existing =
      byUrl ?? (await prisma.design.findFirst({ where: { catalogNumber } }));

    if (existing && !opts.force && existing.imagePath === imagePath) {
      skipped++;
      continue;
    }

    if (opts.dryRun) {
      console.log(`  would ${existing ? "update" : "create"}: ${catalogNumber} ← ${filename}`);
      if (existing) updated++;
      else created++;
      continue;
    }

    if (existing) {
      await prisma.design.update({
        where: { id: existing.id },
        data: {
          title,
          category: entry.category,
          catalogNumber,
          imagePath,
          imagesJson: JSON.stringify([imagePath]),
          isCatalog: true,
          shopId: null,
          active: true,
        },
      });
      updated++;
    } else {
      await prisma.design.create({
        data: {
          isCatalog: true,
          shopId: null,
          catalogNumber,
          title,
          category: entry.category,
          workType: "STITCHING",
          imagePath,
          imagesJson: JSON.stringify([imagePath]),
          active: true,
        },
      });
      created++;
    }
  }

  return { created, updated, skipped };
}

async function main() {
  const opts = parseArgs();
  const entries = PREFIXES.filter((p) => {
    if (opts.filter === "maggam") return p.category === "MAGGAM";
    if (opts.filter === "embroidery") return p.category === "COMPUTER_EMBROIDERY";
    return true;
  });

  console.log(
    opts.dryRun
      ? "Dry run — no database changes."
      : opts.force
        ? "Import (update existing rows)."
        : "Import (auto codes MAG-0001 / EMB-0001, skip already imported URLs)."
  );
  logS3ConfigHint();

  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const entry of entries) {
    const r = await importPrefix(entry, opts);
    totalCreated += r.created;
    totalUpdated += r.updated;
    totalSkipped += r.skipped;
    console.log(`  → ${r.created} created, ${r.updated} updated, ${r.skipped} skipped`);
  }

  console.log(
    `\nDone. ${totalCreated} created, ${totalUpdated} updated, ${totalSkipped} skipped.` +
      (opts.dryRun ? " (dry run)" : "")
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    if (e && typeof e === "object" && "code" in e && e.code === "EPROTO") {
      console.error(
        "\nR2 SSL error — check Render env vars:\n" +
          "  S3_ENDPOINT = https://<ACCOUNT_ID>.r2.cloudflarestorage.com  (NOT pub-xxx.r2.dev)\n" +
          "  S3_PUBLIC_URL = https://pub-xxx.r2.dev\n" +
          "  S3_REGION = auto\n"
      );
    }
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
