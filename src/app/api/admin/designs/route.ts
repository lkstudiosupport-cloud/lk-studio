import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { persistAdminCatalogDesign, isAdminCatalogCategory } from "@/lib/admin-design-upload";
import { CATALOG_CATEGORIES } from "@/lib/design-access";
import { parseDesignImages } from "@/lib/design-images";
import { deleteStoredUpload } from "@/lib/storage";
import type { ServiceCategory } from "@prisma/client";

export const runtime = "nodejs";

function requireAdmin() {
  return getSession().then((s) => (s?.role === "ADMIN" ? s : null));
}

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = rateLimit(`admin-upload:${ip}`, 120);
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

    const result = await persistAdminCatalogDesign(category, file, title);
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
