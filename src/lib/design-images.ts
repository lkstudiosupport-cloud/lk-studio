import { MAX_DESIGN_IMAGES } from "@/lib/limits";
import { resolveDesignImageUrl, resolveDesignThumbUrl } from "@/lib/design-image-url";

export { MAX_DESIGN_IMAGES };

export type DesignImageSrc = { display: string; full: string };

function rawDesignPaths(imagesJson: string | null | undefined, coverPath: string): string[] {
  if (!imagesJson) return coverPath ? [coverPath] : [];
  try {
    const arr = JSON.parse(imagesJson) as unknown;
    if (!Array.isArray(arr)) return coverPath ? [coverPath] : [];
    const paths = arr.filter((p): p is string => typeof p === "string" && p.length > 0);
    if (paths.length > 0) return paths.slice(0, MAX_DESIGN_IMAGES);
    return coverPath ? [coverPath] : [];
  } catch {
    return coverPath ? [coverPath] : [];
  }
}

export function parseDesignImages(imagesJson: string | null | undefined, coverPath: string): string[] {
  return rawDesignPaths(imagesJson, coverPath).map(resolveDesignImageUrl);
}

export function parseDesignImageSrcs(
  imagesJson: string | null | undefined,
  coverPath: string
): DesignImageSrc[] {
  return rawDesignPaths(imagesJson, coverPath).map((path) => ({
    full: resolveDesignImageUrl(path),
    display: resolveDesignThumbUrl(path),
  }));
}

/** Use for any design thumbnail src (favorites, orders, etc.). */
export function designImageSrc(path: string): string {
  return resolveDesignThumbUrl(path);
}

/** Full-resolution src for detail views and lightbox. */
export function designImageFullSrc(path: string): string {
  return resolveDesignImageUrl(path);
}
