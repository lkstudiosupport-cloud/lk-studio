/** Browser cache for user uploads served via /api/media (7 days). */
export const UPLOAD_IMAGE_CACHE_MAX_AGE = 604800;

/** Long-lived cache for static catalog assets on R2 — G1 phone/browser cache (30 days). */
export const CATALOG_STATIC_CACHE_MAX_AGE = 2592000;

/** On-demand maggam fallback API (7 days). */
export const CATALOG_GENERATED_CACHE_MAX_AGE = 604800;

export function cacheControlForMediaKey(key: string): string {
  if (key.startsWith("assets/catalog/")) {
    return `public, max-age=${CATALOG_STATIC_CACHE_MAX_AGE}, immutable`;
  }
  return `public, max-age=${UPLOAD_IMAGE_CACHE_MAX_AGE}, immutable`;
}
