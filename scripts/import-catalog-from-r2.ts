/**
 * Method B: images in R2 → Maggam / Embroidery with auto codes MAG-0001, EMB-0001, …
 *
 * Upload photos to R2 folder (any filenames), then on Render Shell:
 *
 *   npm run db:import-catalog -- --category=maggam --manifest
 *
 * If S3 list works (no SSL error):
 *   npm run db:import-catalog -- --category=maggam
 *
 * Manifest mode (works when Render Shell has R2 SSL issues):
 * 1. Upload photos to uploads/catalog/maggam-work/
 * 2. Upload import-manifest.json in the same folder, e.g. ["photo1.jpg","photo2.jpg"]
 * 3. npm run db:import-catalog -- --category=maggam --manifest --dry-run
 */
import { PrismaClient, type ServiceCategory } from "@prisma/client";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { catalogCodePrefix, nextCatalogDesignNumber } from "../src/lib/catalog-design-number";
import {
  createS3Client,
  logS3ConfigHint,
  publicAssetBaseUrl,
  publicUrlForKey,
} from "../src/lib/s3-client";

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
  if (!v) throw new Error(`Missing ${name} — set env on Render.`);
  return v;
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

async function listImageKeysFromS3(prefix: string): Promise<string[]> {
  requireEnv("S3_BUCKET");
  const client = createS3Client();
  const bucket = process.env.S3_BUCKET!.trim();
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

async function listImageKeysFromManifest(prefix: string, manifestFile: string): Promise<string[]> {
  publicAssetBaseUrl();
  const url = publicUrlForKey(`${prefix}${manifestFile}`);
  console.log(`Reading manifest: ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Could not fetch ${url} (${res.status}). Upload ${manifestFile} to R2 folder ${prefix} with content like ["photo1.jpg","photo2.jpg"]`
    );
  }

  const data = (await res.json()) as unknown;
  const names: string[] = Array.isArray(data)
    ? data.filter((x): x is string => typeof x === "string")
    : typeof data === "object" &&
        data !== null &&
        Array.isArray((data as { files?: unknown }).files)
      ? ((data as { files: unknown[] }).files.filter((x): x is string => typeof x === "string"))
      : [];

  if (names.length === 0) {
    throw new Error(`${manifestFile} is empty or invalid. Use ["photo1.jpg","photo2.jpg"]`);
  }

  return names
    .filter((n) => /\.(jpe?g|png|webp)$/i.test(n))
    .map((n) => `${prefix}${n.replace(/^\//, "")}`)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function parseArgs() {
  const dryRun = process.argv.includes("--dry-run");
  const force = process.argv.includes("--force");
  const useManifest = process.argv.includes("--manifest");
  const manifestFile =
    process.argv.find((a) => a.startsWith("--manifest="))?.split("=")[1] ?? "import-manifest.json";
  const filesArg = process.argv.find((a) => a.startsWith("--files="))?.split("=")[1];
  const fileNames = filesArg
    ? filesArg.split(",").map((s) => s.trim()).filter(Boolean)
    : null;
  const catArg = process.argv.find((a) => a.startsWith("--category="))?.split("=")[1]?.toLowerCase();
  let filter: "all" | "maggam" | "embroidery" = "all";
  if (catArg === "maggam") filter = "maggam";
  else if (catArg === "embroidery" || catArg === "emb") filter = "embroidery";
  return { dryRun, force, filter, useManifest, manifestFile, fileNames };
}

async function resolveImageKeys(
  prefix: string,
  opts: { useManifest: boolean; manifestFile: string; fileNames: string[] | null }
): Promise<string[]> {
  if (opts.fileNames?.length) {
    return opts.fileNames
      .filter((n) => /\.(jpe?g|png|webp)$/i.test(n))
      .map((n) => `${prefix}${n.replace(/^\//, "")}`)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  if (opts.useManifest) {
    return listImageKeysFromManifest(prefix, opts.manifestFile);
  }

  try {
    return await listImageKeysFromS3(prefix);
  } catch (e) {
    const code = e && typeof e === "object" && "code" in e ? String(e.code) : "";
    if (code === "EPROTO") {
      console.error(
        "\nR2 S3 API SSL error on Render Shell — use manifest mode instead:\n" +
          "  1. Upload import-manifest.json to the same R2 folder as your photos\n" +
          '     Example: ["photo1.jpg","photo2.jpg"]\n' +
          "  2. npm run db:import-catalog -- --category=maggam --manifest --dry-run\n"
      );
    }
    throw e;
  }
}

async function importPrefix(
  entry: (typeof PREFIXES)[number],
  opts: { dryRun: boolean; force: boolean; useManifest: boolean; manifestFile: string; fileNames: string[] | null }
): Promise<{ created: number; updated: number; skipped: number }> {
  const keys = await resolveImageKeys(entry.prefix, opts);
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
    const existing = byUrl ?? (await prisma.design.findFirst({ where: { catalogNumber } }));

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

  if (opts.useManifest) {
    console.log(`Mode: manifest (${opts.manifestFile})`);
  } else if (opts.fileNames?.length) {
    console.log(`Mode: --files (${opts.fileNames.length} name(s), URLs via /api/media/)`);
  } else {
    logS3ConfigHint();
  }

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
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
