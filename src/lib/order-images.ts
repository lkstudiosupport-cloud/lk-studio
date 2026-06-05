import type { OrderImage } from "@prisma/client";

export function parseRefImages(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json) as string[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function allOrderImagePaths(
  images: OrderImage[],
  legacyJson: string | null | undefined,
  extras?: { cloth?: string | null; workDesign?: string | null; design?: string | null }
): { path: string; by: string; caption?: string | null }[] {
  const list = images.map((i) => ({
    path: i.imagePath,
    by: i.uploadedBy,
    caption: i.caption,
  }));
  for (const p of parseRefImages(legacyJson)) {
    if (!list.some((x) => x.path === p)) list.push({ path: p, by: "CUSTOMER", caption: null });
  }
  if (extras?.cloth) list.push({ path: extras.cloth, by: "SHOP", caption: "Cloth" });
  if (extras?.workDesign) list.push({ path: extras.workDesign, by: "SHOP", caption: "Work" });
  if (extras?.design) list.push({ path: extras.design, by: "SHOP", caption: "Design" });
  return list;
}
