import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ADMIN_CATALOG_UPLOAD_RATE_PER_MINUTE } from "@/lib/limits";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { persistAdminCatalogDesign, isAdminCatalogCategory } from "@/lib/admin-design-upload";
import { assignCatalogDesignSizeTier } from "@/lib/admin-assign-tier";
import { assignCatalogDesignPart } from "@/lib/admin-assign-part";
import { CATALOG_CATEGORIES } from "@/lib/design-access";
import { parseDesignImages } from "@/lib/design-images";
import { deleteStoredUpload } from "@/lib/storage";
import type { CatalogPart, DesignSizeTier, ServiceCategory } from "@prisma/client";

export const runtime = "nodejs";

function requireAdmin() {
  return getSession().then((s) => (s?.role === "ADMIN" ? s : null));
}

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = rateLimit(`admin-upload:${ip}`, ADMIN_CATALOG_UPLOAD_RATE_PER_MINUTE);
    if (!limited.ok) {
      return NextResponse.json({ error: "Too many uploads — wait a minute" }, { status: 429 });
    }

    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json({ error: "Photos too large" }, { status: 413 });
    }

    const category = form.get("category") as ServiceCategory;
    if (!category || !isAdminCatalogCategory(category)) {
      return NextResponse.json({ error: "Invalid catalog category" }, { status: 400 });
    }

    const title = String(form.get("title") ?? "").trim();
    const file = form.get("designImage0");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Add a design photo" }, { status: 400 });
    }

    const rawSizeTier = String(form.get("sizeTier") ?? "").toUpperCase();
    const sizeTier =
      rawSizeTier === "SMALL" || rawSizeTier === "MEDIUM" || rawSizeTier === "BIG"
        ? (rawSizeTier as DesignSizeTier)
        : null;
    const rawPart = String(form.get("catalogPart") ?? "").toUpperCase();
    const catalogPart =
      rawPart === "MAIN" || rawPart === "HAND_SLEEVES" ? (rawPart as CatalogPart) : null;

    const result = await persistAdminCatalogDesign(category, file, {
      title,
      sizeTier,
      catalogPart,
    });
    revalidatePath("/admin/designs");
    revalidatePath("/shop/designs");
    revalidatePath("/customer/designs");
    revalidatePath("/customer/shops");
    return NextResponse.json({ ok: true, catalogNumber: result.catalogNumber });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    const status =
      message.includes("not configured") || message.includes("Storage not configured") ? 503 : 400;
    console.error("[admin/designs POST]", message);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    id?: string;
    ids?: string[];
    sizeTier?: DesignSizeTier;
    catalogPart?: CatalogPart;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ids = (body.ids?.length ? body.ids : body.id ? [body.id] : [])
    .map((id) => id.trim())
    .filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ error: "Design id required" }, { status: 400 });
  }

  try {
    if (body.sizeTier && ["SMALL", "MEDIUM", "BIG"].includes(body.sizeTier)) {
      const results: string[] = [];
      for (const id of ids) {
        const result = await assignCatalogDesignSizeTier(id, body.sizeTier);
        results.push(result.catalogNumber);
      }
      revalidatePath("/admin/designs");
      revalidatePath("/shop/designs");
      revalidatePath("/customer/designs");
      revalidatePath("/customer/shops");
      return NextResponse.json({
        ok: true,
        catalogNumber: results[results.length - 1],
        count: results.length,
      });
    }

    if (body.catalogPart && ["MAIN", "HAND_SLEEVES"].includes(body.catalogPart)) {
      const results: string[] = [];
      for (const id of ids) {
        const result = await assignCatalogDesignPart(id, body.catalogPart);
        results.push(result.catalogNumber);
      }
      revalidatePath("/admin/designs");
      revalidatePath("/shop/designs");
      revalidatePath("/customer/designs");
      revalidatePath("/customer/shops");
      return NextResponse.json({
        ok: true,
        catalogNumber: results[results.length - 1],
        count: results.length,
      });
    }

    return NextResponse.json(
      { error: "Provide sizeTier (SMALL, MEDIUM, BIG) or catalogPart (MAIN, HAND_SLEEVES)" },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(req.url).searchParams.get("id")?.trim();
  if (!id) return NextResponse.json({ error: "Missing design id" }, { status: 400 });

  const design = await prisma.design.findFirst({
    where: {
      id,
      isCatalog: true,
      category: { in: CATALOG_CATEGORIES },
    },
  });
  if (!design) return NextResponse.json({ error: "Design not found" }, { status: 404 });

  const images = parseDesignImages(design.imagesJson, design.imagePath);
  await Promise.all(images.map((p) => deleteStoredUpload(p)));
  await prisma.design.delete({ where: { id } });

  revalidatePath("/admin/designs");
  revalidatePath("/customer/designs");
  revalidatePath("/customer/shops");

  return NextResponse.json({ ok: true });
}
