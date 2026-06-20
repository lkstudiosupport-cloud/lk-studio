import { MAX_DESIGN_IMAGES } from "@/lib/limits";
import { resolveDesignImageUrl } from "@/lib/design-image-url";

export { MAX_DESIGN_IMAGES };

export function parseDesignImages(imagesJson: string | null | undefined, coverPath: string): string[] {
  if (!imagesJson) return coverPath ? [resolveDesignImageUrl(coverPath)] : [];
  try {
    const arr = JSON.parse(imagesJson) as unknown;
    if (!Array.isArray(arr)) return coverPath ? [resolveDesignImageUrl(coverPath)] : [];
    const paths = arr.filter((p): p is string => typeof p === "string" && p.length > 0);
    if (paths.length > 0) {
      return paths.slice(0, MAX_DESIGN_IMAGES).map(resolveDesignImageUrl);
    }
    return coverPath ? [resolveDesignImageUrl(coverPath)] : [];
  } catch {
    return coverPath ? [resolveDesignImageUrl(coverPath)] : [];
  }
}

/** Use for any design thumbnail src (favorites, orders, etc.). */
export function designImageSrc(path: string): string {
  return resolveDesignImageUrl(path);
}
