import { MAX_DESIGN_IMAGES } from "@/lib/limits";

export { MAX_DESIGN_IMAGES };

export function parseDesignImages(imagesJson: string | null | undefined, coverPath: string): string[] {
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
