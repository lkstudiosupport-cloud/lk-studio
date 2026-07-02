import { parseCatalogCode, renderMaggamBlouse, renderMaggamBlouseThumb } from "@/lib/maggam-catalog-image";
import { CATALOG_GENERATED_CACHE_MAX_AGE } from "@/lib/catalog-image-cache";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const parsed = parseCatalogCode(code);
  if (!parsed) {
    return new Response("Not found", { status: 404 });
  }

  const thumb = new URL(req.url).searchParams.get("size") === "thumb";

  try {
    let buffer = await renderMaggamBlouse(parsed.index, parsed.tier, parsed.catalogNumber);
    if (thumb) {
      buffer = await renderMaggamBlouseThumb(buffer);
    }
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": `public, max-age=${CATALOG_GENERATED_CACHE_MAX_AGE}, immutable`,
      },
    });
  } catch {
    return new Response("Failed to generate image", { status: 500 });
  }
}
