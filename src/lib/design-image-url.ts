import { normalizeStoredImageUrl } from "@/lib/storage-url";

const MAGGAM_STATIC_FULL =
  /^(\/api\/media\/assets\/catalog\/maggam-(?:small|medium|big)\/|\/assets\/catalog\/maggam-(?:small|medium|big)\/)(MAG-(?:S|M|B)-\d{4})\.jpg$/i;

/** Derive thumb URL from a full maggam catalog path (R2 proxy or local assets). */
export function maggamThumbUrlFromFullUrl(fullUrl: string): string | null {
  const match = fullUrl.match(MAGGAM_STATIC_FULL);
  if (!match) return null;
  const [, dir, code] = match;
  return `${dir}thumbs/${code}.jpg`;
}

/**
 * Resolve stored design path to a browser-loadable URL.
 * Prefers static R2/local files (Option B); on-demand API is fallback for bare codes only.
 */
export function resolveDesignImageUrl(path: string): string {
  if (!path?.trim()) return path;

  path = normalizeStoredImageUrl(path);

  if (
    path.startsWith("/api/media/") ||
    path.startsWith("/api/catalog/maggam/") ||
    path.startsWith("/uploads/") ||
    path.startsWith("/placeholder")
  ) {
    return path;
  }

  if (MAGGAM_STATIC_FULL.test(path)) {
    return path;
  }

  const codeOnly = path.match(/^(MAG-(?:S|M|B)-\d{4})$/i);
  if (codeOnly) return `/api/catalog/maggam/${codeOnly[1]!.toUpperCase()}`;

  return path;
}

/** Smaller image for design grids — static thumb on R2, or on-demand ?size=thumb fallback. */
export function resolveDesignThumbUrl(path: string): string {
  const full = resolveDesignImageUrl(path);
  const staticThumb = maggamThumbUrlFromFullUrl(full);
  if (staticThumb) return staticThumb;
  if (full.startsWith("/api/catalog/maggam/")) {
    return `${full}?size=thumb`;
  }
  return full;
}
