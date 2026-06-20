/**
 * Method B: register images already uploaded to R2 as catalog designs.
 *
 * 1. Upload files to R2 (from PC browser):
 *    - uploads/catalog/maggam-work/MAG-0001.jpg, MAG-0002.jpg, …
 *    - uploads/catalog/embroidery/EMB-0001.jpg, EMB-0002.jpg, …
 * 2. Run on Render Shell (uses S3_* env vars):
 *    npm run db:import-catalog
 *    npm run db:import-catalog -- --category=embroidery
 *    npm run db:import-catalog -- --dry-run
 */
import { PrismaClient, type ServiceCategory } from "@prisma/client";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
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

function titleFromCode(code: string): string {
  return code;
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

  return keys.sort();
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

  for (const key of keys) {
    const filename = key.split("/").pop()!;
    const catalogNumber = catalogNumberFromFilename(filename);
    if (!catalogNumber || !entry.codeRe.test(catalogNumber)) {
      console.warn(`  skip (bad name): ${filename}`);
      skipped++;
      continue;
    }

    const imagePath = publicUrlForKey(key);
    const title = titleFromCode(catalogNumber);
    const existing = await prisma.design.findFirst({ where: { catalogNumber } });

    if (existing && !opts.force) {
      skipped++;
      continue;
    }

    if (opts.dryRun) {
      console.log(`  would ${existing ? "update" : "create"}: ${catalogNumber} → ${imagePath}`);
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
        ? "Import (update existing catalog numbers)."
        : "Import (skip existing catalog numbers)."
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
