/** Synthetic maggam rows/images created by scripts/seed-maggam-catalog.ts (not admin uploads). */

export function isAdminCatalogUploadImagePath(imagePath: string | null | undefined): boolean {
  if (!imagePath) return false;
  const p = imagePath.toLowerCase();
  return p.includes("/uploads/catalog/") || p.includes("uploads/catalog/");
}

/** Auto-generated SVG blouse placeholders under assets/catalog/maggam-*. */
export function isSeedMaggamPlaceholderImagePath(imagePath: string | null | undefined): boolean {
  if (!imagePath) return false;
  const p = imagePath.toLowerCase();
  return (
    p.includes("/assets/catalog/maggam-small/") ||
    p.includes("/assets/catalog/maggam-medium/") ||
    p.includes("/assets/catalog/maggam-big/") ||
    p.includes("/api/media/assets/catalog/maggam-small/") ||
    p.includes("/api/media/assets/catalog/maggam-medium/") ||
    p.includes("/api/media/assets/catalog/maggam-big/")
  );
}
