import { parseCatalogCode, renderMaggamBlouse } from "@/lib/maggam-catalog-image";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const parsed = parseCatalogCode(code);
  if (!parsed) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const buffer = await renderMaggamBlouse(parsed.index, parsed.tier, parsed.catalogNumber);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=604800, immutable",
      },
    });
  } catch {
    return new Response("Failed to generate image", { status: 500 });
  }
}
