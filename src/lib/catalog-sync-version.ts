import { prisma } from "@/lib/prisma";

const SYNC_ID = "global";

/** Ensure singleton row exists and return current version. */
export async function getCatalogSyncVersion(): Promise<number> {
  const row = await prisma.designSync.upsert({
    where: { id: SYNC_ID },
    create: { id: SYNC_ID, version: 0 },
    update: {},
    select: { version: true },
  });
  return row.version;
}

/**
 * If version is still 0 but catalog rows exist, bump to 1 and backfill
 * so clients can finish a full sync at a stable version > 0.
 */
export async function ensureCatalogSyncReady(): Promise<number> {
  let version = await getCatalogSyncVersion();
  if (version > 0) return version;

  const catalogCount = await prisma.design.count({
    where: { isCatalog: true, active: true },
  });
  if (catalogCount === 0) return version;

  version = await bumpCatalogSyncVersion();
  await prisma.design.updateMany({
    where: { isCatalog: true, syncVersion: 0 },
    data: { syncVersion: version, createdSyncVersion: version },
  });
  return version;
}

/**
 * Atomically bump global catalog version. Call inside the same logical
 * transaction as the design mutation when possible.
 */
export async function bumpCatalogSyncVersion(
  tx: { designSync: typeof prisma.designSync } = prisma
): Promise<number> {
  const row = await tx.designSync.upsert({
    where: { id: SYNC_ID },
    create: { id: SYNC_ID, version: 1 },
    update: { version: { increment: 1 } },
    select: { version: true },
  });
  return row.version;
}

/** Record a hard-deleted catalog design for incremental client sync. */
export async function recordCatalogDesignDeletion(
  designId: string,
  version: number,
  tx: { designDeletion: typeof prisma.designDeletion } = prisma
): Promise<void> {
  await tx.designDeletion.upsert({
    where: { id: designId },
    create: { id: designId, version },
    update: { version, deletedAt: new Date() },
  });
}
