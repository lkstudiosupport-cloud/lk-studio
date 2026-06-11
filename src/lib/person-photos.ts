import { MAX_PERSON_PHOTOS } from "@/lib/limits";

export { MAX_PERSON_PHOTOS };

export function parsePersonPhotos(photosJson: string | null | undefined): string[] {
  if (!photosJson) return [];
  try {
    const arr = JSON.parse(photosJson) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((p): p is string => typeof p === "string" && p.length > 0)
      .slice(0, MAX_PERSON_PHOTOS);
  } catch {
    return [];
  }
}
