import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_DESIGN_IMAGES } from "@/lib/design-images";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { persistShopDesign } from "@/lib/shop-design-upload";
import { canShopUseApp } from "@/lib/subscription";
import { isDemoAccountUser } from "@/lib/demo-accounts";
import { isShopUploadCategory, SHOP_OWNED_UPLOAD_CATEGORY } from "@/lib/design-access";
import type { ServiceCategory } from "@prisma/client";

export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`upload:${ip}`, 60);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many uploads — please wait a minute" },
      { status: 429 }
    );
  }

  const session = await getSession();
  if (!session?.shopId || session.role !== "SHOP") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [shop, user] = await Promise.all([
    prisma.shopProfile.findUnique({
      where: { id: session.shopId },
      select: {
        shopName: true,
        shopCode: true,
        phone: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        createdAt: true,
        autopayEnabled: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: session.id },
      select: { phone: true, phoneNormalized: true },
    }),
  ]);
  if (!shop) {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }
  const demoBypass =
    isDemoAccountUser(user) || isDemoAccountUser({ phone: shop.phone });
  if (
    !demoBypass &&
    !canShopUseApp(
      shop.subscriptionStatus,
      shop.subscriptionEndsAt,
      shop.createdAt,
      shop.autopayEnabled
    )
  ) {
    return NextResponse.json(
      { error: "Shop subscription inactive — set up payment in Profile" },
      { status: 403 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Photos too large — try fewer photos or retake at lower quality" },
      { status: 413 }
    );
  }

  const category = (form.get("category") as ServiceCategory) || SHOP_OWNED_UPLOAD_CATEGORY;
  if (!isShopUploadCategory(category)) {
    return NextResponse.json(
      { error: "Upload is not allowed for this category" },
      { status: 400 }
    );
  }
  const title = String(form.get("title") ?? "").trim();

  const files: File[] = [];
  for (let i = 0; i < MAX_DESIGN_IMAGES; i++) {
    const entry = form.get(`designImage${i}`);
    if (entry instanceof File && entry.size > 0) files.push(entry);
  }

  if (files.length > MAX_DESIGN_IMAGES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_DESIGN_IMAGES} photos per design` },
      { status: 400 }
    );
  }

  try {
    const result = await persistShopDesign(session.shopId, shop, { category, title, files });
    revalidatePath("/shop/designs");
    revalidatePath("/customer/designs");
    revalidatePath("/customer/shops");

    return NextResponse.json({ ok: true, catalogNumber: result.catalogNumber });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
