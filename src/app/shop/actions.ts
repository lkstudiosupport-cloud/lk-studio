"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { revalidateShopTabCache } from "@/lib/cached-shop-data";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appendOrderImagesFromForm } from "@/lib/save-order-images";
import { saveUpload, deleteStoredUpload } from "@/lib/storage";
import { persistShopDesign } from "@/lib/shop-design-upload";
import { MAX_DESIGN_IMAGES, parseDesignImages } from "@/lib/design-images";
import { billItemsTotal, parseBillItems } from "@/lib/bill-items";
import { billFullyPaid, billPending } from "@/lib/bill-payment";
import { isShopActive, canShopUseApp, extendSubscriptionEnd, SHOP_MONTHLY_PRICE_INR } from "@/lib/subscription";
import { isDemoAccountUser } from "@/lib/demo-accounts";
import { findUserByPhone, findUserByPhoneAnyRole, phoneFieldsForRegister } from "@/lib/auth-user";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import type { ActionState } from "@/lib/action-state";
import type { OrderStatus, ServiceCategory, WorkType } from "@prisma/client";
import { CATALOG_CATEGORIES, shopManageableDesignWhere, isShopUploadCategory } from "@/lib/design-access";
import { parseShopMeasurementsFromForm, inferOrderCategoryFromMeasurements } from "@/lib/shop-measurements";
import { normalizeCity } from "@/lib/cities";
import {
  parseNeededFromDate,
  parseWorkerPartnerDurationType,
  WORKER_PARTNER_DURATION_TYPES,
} from "@/lib/work-partner-duration";
import { isSelectableWorkerPartnerRole } from "@/lib/work-partner-roles";
import {
  cancelWorkRequirementForPartnerRequest,
  cancelWorkRequirementById,
  createWorkRequirementForPartnerRequest,
} from "@/lib/work-requirement-sync";
import {
  shopAcceptWorkerApplication,
  shopRejectWorkerApplication,
} from "@/lib/shop-submission-actions";

export type BillActionResult = { ok: false; error: string };

const MAX_ORDER_DESIGN_PICKS = 3;
const WALKIN_EMAIL_SUFFIX = "@lkstudio.walkin";

function isWalkInCustomerEmail(email: string) {
  return email.endsWith(WALKIN_EMAIL_SUFFIX);
}

async function createWalkInCustomer(name: string, rawPhone: string): Promise<string> {
  const phoneFields = phoneFieldsForRegister(rawPhone);
  const digits = (phoneFields.phoneNormalized ?? rawPhone).replace(/\D/g, "") || randomUUID().slice(0, 12);
  let email = `walkin+${digits}${WALKIN_EMAIL_SUFFIX}`;
  let attempt = 0;
  while (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    attempt += 1;
    email = `walkin+${digits}.${attempt}${WALKIN_EMAIL_SUFFIX}`;
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(randomUUID(), 10),
      name: name.trim(),
      role: "CUSTOMER",
      phone: phoneFields.phone,
      phoneNormalized: phoneFields.phoneNormalized || null,
      whatsapp: phoneFields.whatsapp,
    },
    select: { id: true },
  });
  return user.id;
}

async function fetchShopOrderCustomer(shopId: string, userId: string) {
  return prisma.user.findFirst({
    where: { id: userId, role: "CUSTOMER" },
    select: {
      id: true,
      name: true,
      phone: true,
      whatsapp: true,
      email: true,
      favorites: {
        where: { shopId },
        orderBy: { createdAt: "desc" },
        select: {
          designId: true,
          category: true,
          design: {
            select: {
              id: true,
              title: true,
              imagePath: true,
              imagesJson: true,
              category: true,
            },
          },
        },
      },
      persons: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          relation: true,
          measurements: true,
        },
      },
    },
  });
}

export type ShopOrderCustomerFavorite = {
  designId: string;
  category: ServiceCategory;
  design: {
    id: string;
    title: string;
    imagePath: string;
    imagesJson: string | null;
    category: ServiceCategory;
  };
};

export type ShopOrderCustomerLookup = {
  id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  favorites: ShopOrderCustomerFavorite[];
  persons: {
    id: string;
    name: string;
    relation: string | null;
    measurements: {
      type: string;
      shoulder: string | null;
      armHole: string | null;
      bust: string | null;
      overBust: string | null;
      underBust: string | null;
      chest: string | null;
      waist: string | null;
      hip: string | null;
      highHip: string | null;
      backWaist: string | null;
      frontWaist: string | null;
      inseam: string | null;
      trouserThreeQuarter: string | null;
      blouseLen: string | null;
      length: string | null;
      neckToAboveKnee: string | null;
      aboveKneeToAnkle: string | null;
      armLength: string | null;
      bicep: string | null;
      foreArm: string | null;
      wrist: string | null;
      sleeve: string | null;
      neck: string | null;
      frontNeck: string | null;
      backNeck: string | null;
      slit: string | null;
      custom: string | null;
    }[];
  }[];
};

export async function lookupShopOrderCustomer(input: {
  phone?: string;
  customerId?: string;
  name?: string;
}): Promise<
  | { ok: true; customer: ShopOrderCustomerLookup; isRegistered: boolean }
  | { ok: false; error: string }
> {
  const sid = await shopIdOnly();

  const phone = input.phone?.trim();
  const customerId = input.customerId?.trim();
  const name = input.name?.trim();

  let userId = customerId;
  let createdWalkIn = false;

  if (!userId && phone) {
    const found = await findUserByPhone("CUSTOMER", phone);
    if (found) {
      userId = found.id;
    } else {
      const otherRole = await findUserByPhoneAnyRole(phone);
      if (otherRole && otherRole.role !== "CUSTOMER") {
        return { ok: false, error: "phoneAlreadyShop" };
      }
      if (!name) return { ok: false, error: "enterCustomerName" };
      userId = await createWalkInCustomer(name, phone);
      createdWalkIn = true;
    }
  }

  if (!userId) return { ok: false, error: "enterCustomerPhone" };

  const row = await fetchShopOrderCustomer(sid, userId);
  if (!row) return { ok: false, error: "customerNotRegistered" };

  const { email, ...customer } = row;
  const isRegistered = !createdWalkIn && !isWalkInCustomerEmail(email);

  return { ok: true, customer, isRegistered };
}

export async function createShopOrder(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const sid = await shopId();
    const customerId = String(formData.get("customerId") ?? "").trim();
    const personId = String(formData.get("personId") ?? "").trim() || null;
    const measurementMode = String(formData.get("measurementMode") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim() || null;
    const designIds = formData.getAll("designId").map(String).filter(Boolean);
    const shopMeasurements = parseShopMeasurementsFromForm(formData);

    if (!customerId) {
      return { ok: false, error: "Select customer" };
    }
    if (designIds.length > MAX_ORDER_DESIGN_PICKS) {
      return { ok: false, error: `Select up to ${MAX_ORDER_DESIGN_PICKS} designs` };
    }

    if (measurementMode === "view") {
      if (!personId) return { ok: false, error: "Select a person to view measurements" };
      const person = await prisma.person.findFirst({ where: { id: personId, customerId } });
      if (!person) return { ok: false, error: "Select a person" };
    } else if (measurementMode === "manual") {
      if (!shopMeasurements) return { ok: false, error: "Enter shop measurements" };
    } else if (!personId && !shopMeasurements) {
      return { ok: false, error: "Add measurements or select a person" };
    }

    if (personId) {
      const person = await prisma.person.findFirst({ where: { id: personId, customerId } });
      if (!person) return { ok: false, error: "Select a person" };
    }

    const clothFile = formData.get("clothImage");
    let clothImagePath: string | undefined;
    if (clothFile instanceof File && clothFile.size > 0) {
      clothImagePath = await saveUpload(clothFile, "cloth");
    }

    const orderNumber = `ORD-${Date.now()}`;
    let orderedDesigns: { id: string; category: ServiceCategory }[] = [];

    if (designIds.length > 0) {
      const designRows = await prisma.design.findMany({
        where: {
          id: { in: designIds },
          active: true,
          OR: [
            { shopId: sid, isCatalog: false },
            { isCatalog: true, category: { in: CATALOG_CATEGORIES } },
            { favorites: { some: { customerId, shopId: sid } } },
          ],
        },
        select: { id: true, category: true },
      });
      const byId = new Map(designRows.map((d) => [d.id, d]));
      orderedDesigns = designIds
        .map((id) => byId.get(id))
        .filter((d): d is (typeof designRows)[number] => d != null);
      if (orderedDesigns.length !== designIds.length) {
        return { ok: false, error: "Some selected designs are not available" };
      }
    }

    const personMeasurements = personId
      ? (
          await prisma.person.findFirst({
            where: { id: personId, customerId },
            select: { measurements: { select: { type: true } } },
          })
        )?.measurements ?? null
      : null;

    const orderCategory = inferOrderCategoryFromMeasurements(
      orderedDesigns,
      shopMeasurements,
      personMeasurements
    );

    const shopMeasurementsJson =
      measurementMode === "manual" && shopMeasurements
        ? JSON.stringify(shopMeasurements)
        : null;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId,
        shopId: sid,
        personId,
        shopMeasurementsJson,
        designId: orderedDesigns[0]?.id ?? null,
        workType: "STITCHING",
        category: orderCategory,
        notes,
        status: "PENDING",
        ...(clothImagePath ? { clothImagePath } : {}),
        ...(orderedDesigns.length > 0
          ? {
              orderFavorites: {
                create: orderedDesigns.map((d) => ({
                  designId: d.id,
                  category: d.category,
                })),
              },
            }
          : {}),
      },
    });

    const uploaded = await appendOrderImagesFromForm(order.id, formData, "SHOP", "orderImg");

    if (!clothImagePath && uploaded.length === 0 && orderedDesigns.length === 0) {
      await prisma.order.delete({ where: { id: order.id } });
      return {
        ok: false,
        error: "Pick customer favorites or upload reference photos",
      };
    }

    revalidatePath("/shop/orders");
    revalidatePath("/shop");
    revalidatePath("/customer/orders");
    bumpShopTabs(sid);
    return { ok: true, message: "orderPlaced" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

async function shopIdOnly() {
  const session = await requireSession(["SHOP"]);
  if (!session?.shopId) throw new Error("Unauthorized");
  return session.shopId;
}

function bumpShopTabs(shopId: string) {
  revalidateShopTabCache(shopId);
}

async function shopId() {
  const session = await requireSession(["SHOP"]);
  if (!session?.shopId) throw new Error("Unauthorized");
  const id = session.shopId;

  const [shop, user] = await Promise.all([
    prisma.shopProfile.findUnique({
      where: { id },
      select: {
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

  if (!shop) throw new Error("Shop not found");

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
    throw new Error("Shop subscription inactive — set up payment in Profile");
  }
  return id;
}

/** Resolve an order link only when it belongs to this shop (avoids Prisma connect crashes). */
async function shopOwnedOrderId(shopId: string, orderId: string | null | undefined) {
  if (!orderId?.trim()) return null;
  const order = await prisma.order.findFirst({
    where: { id: orderId.trim(), shopId },
    select: { id: true },
  });
  return order?.id ?? null;
}

export async function createBill(formData: FormData): Promise<BillActionResult> {
  try {
    const shop = await shopId();
    const customerName = String(formData.get("customerName") ?? "").trim();
    const customerPhone = String(formData.get("customerPhone") ?? "").trim() || null;
    if (!customerName) return { ok: false, error: "Enter customer name" };

    const itemsJson = String(formData.get("itemsJson") ?? "[]");
    const items = parseBillItems(itemsJson);
    if (items.length === 0) {
      return { ok: false, error: "Add at least one item with name, quantity and price" };
    }

    const amount = parseFloat(String(formData.get("amount"))) || billItemsTotal(items);
    const advancePaid = parseFloat(String(formData.get("advancePaid") ?? "0")) || 0;
    const paidAmount = parseFloat(String(formData.get("paidAmount") ?? "0")) || 0;
    const notes = String(formData.get("notes") ?? "").trim() || null;
    const voiceText = notes;
    const linkedOrderId = await shopOwnedOrderId(
      shop,
      items.find((i) => i.orderId)?.orderId
    );
    const paid =
      formData.get("paid") === "on" || billFullyPaid(amount, advancePaid, paidAmount);

    const billNumber = `BILL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const bill = await prisma.bill.create({
      data: {
        billNumber,
        shop: { connect: { id: shop } },
        customerName,
        customerPhone,
        ...(linkedOrderId ? { order: { connect: { id: linkedOrderId } } } : {}),
        amount,
        advancePaid,
        paidAmount,
        paid,
        paidAt: paid ? new Date() : null,
        itemsJson,
        notes,
        voiceText,
      },
    });
    after(() => {
      revalidatePath("/shop/bills");
      revalidatePath("/shop");
      revalidatePath("/customer/bills");
      bumpShopTabs(shop);
    });
    // Navigate from the action so the create-bill page is not re-rendered
    // (avoids production "Server Components render" digest errors on the form).
    redirect(`/shop/bills/${bill.id}?share=1`);
  } catch (err) {
    // redirect() throws a special error — let Next.js handle navigation
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      String((err as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    console.error("[lk-studio] createBill failed:", err);
    const message =
      err instanceof Error && err.message && !err.message.includes("Server Components")
        ? err.message
        : "Could not save bill — please try again";
    return { ok: false, error: message };
  }
}

export async function updateBill(formData: FormData): Promise<BillActionResult> {
  try {
    const shop = await shopId();
    const billId = String(formData.get("billId") ?? "").trim();
    if (!billId) return { ok: false, error: "Bill not found" };

    const existing = await prisma.bill.findFirst({ where: { id: billId, shopId: shop } });
    if (!existing) return { ok: false, error: "Bill not found" };

    const itemsJson = String(formData.get("itemsJson") ?? "[]");
    const items = parseBillItems(itemsJson);
    if (items.length === 0) {
      return { ok: false, error: "Add at least one item with name, quantity and price" };
    }

    const amount = parseFloat(String(formData.get("amount"))) || billItemsTotal(items);
    const advancePaid = parseFloat(String(formData.get("advancePaid") ?? "0")) || 0;
    const paidAmount = parseFloat(String(formData.get("paidAmount") ?? "0")) || 0;
    const linkedOrderId = await shopOwnedOrderId(
      shop,
      items.find((i) => i.orderId)?.orderId
    );
    const paid =
      formData.get("paid") === "on" || billFullyPaid(amount, advancePaid, paidAmount);

    await prisma.bill.update({
      where: { id: billId },
      data: {
        amount,
        advancePaid,
        paidAmount,
        paid,
        paidAt: paid ? (existing.paidAt ?? new Date()) : null,
        itemsJson,
        ...(linkedOrderId ? { order: { connect: { id: linkedOrderId } } } : {}),
      },
    });

    revalidateBillPaths(billId, shop);
    redirect(`/shop/bills/${billId}?share=1`);
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      String((err as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    console.error("[lk-studio] updateBill failed:", err);
    const message =
      err instanceof Error && err.message && !err.message.includes("Server Components")
        ? err.message
        : "Could not update bill — please try again";
    return { ok: false, error: message };
  }
}

export async function updateShopProfile(formData: FormData) {
  const id = await shopIdOnly();
  const upiFile = formData.get("upiQrFile");
  const photoFile = formData.get("profilePhotoFile");
  let upiQrImage: string | undefined;
  let profilePhoto: string | undefined;
  if (upiFile instanceof File && upiFile.size > 0) {
    upiQrImage = await saveUpload(upiFile, "upi");
  }
  if (formData.get("removeProfilePhoto") === "true") {
    const shop = await prisma.shopProfile.findUnique({
      where: { id },
      select: { profilePhoto: true },
    });
    if (shop?.profilePhoto) {
      await deleteStoredUpload(shop.profilePhoto);
    }
    profilePhoto = null as unknown as undefined;
  } else if (photoFile instanceof File && photoFile.size > 0) {
    profilePhoto = await saveUpload(photoFile, `profile/shop-${id}`);
  }

  const latRaw = String(formData.get("latitude") ?? "").trim();
  const lngRaw = String(formData.get("longitude") ?? "").trim();

  await prisma.shopProfile.update({
    where: { id },
    data: {
      shopName: String(formData.get("shopName") ?? ""),
      city: normalizeCity(String(formData.get("city") ?? "")),
      address: String(formData.get("address") ?? "").trim() || null,
      locationLink: String(formData.get("locationLink") ?? "").trim() || null,
      latitude: latRaw ? parseFloat(latRaw) : null,
      longitude: lngRaw ? parseFloat(lngRaw) : null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
      instagram: String(formData.get("instagram") ?? "").trim() || null,
      upiId: String(formData.get("upiId") ?? "").trim() || null,
      ...(upiQrImage ? { upiQrImage } : {}),
      ...(profilePhoto !== undefined
        ? { profilePhoto }
        : formData.get("removeProfilePhoto") === "true"
          ? { profilePhoto: null }
          : {}),
    },
  });
  revalidatePath("/shop/profile");
  revalidatePath("/shop", "layout");
  revalidatePath("/customer/shops");
  revalidatePath("/customer/contact");
}

/** Demo: extend subscription (replace with payment gateway in production) */
export async function renewShopSubscription() {
  const id = await shopIdOnly();
  const shop = await prisma.shopProfile.findUnique({ where: { id } });
  await prisma.shopProfile.update({
    where: { id },
    data: {
      subscriptionStatus: "ACTIVE",
      subscriptionEndsAt: extendSubscriptionEnd(shop?.subscriptionEndsAt ?? null),
      monthlyPlan: `monthly-${SHOP_MONTHLY_PRICE_INR}`,
    },
  });
  revalidatePath("/shop", "layout");
  revalidatePath("/shop/profile");
  revalidatePath("/shop/profile");
}

export async function uploadDesign(formData: FormData) {
  const id = await shopId();
  const shop = await prisma.shopProfile.findUnique({
    where: { id },
    select: { shopName: true, shopCode: true },
  });
  if (!shop) throw new Error("Shop not found");

  const category = formData.get("category") as ServiceCategory;
  if (!isShopUploadCategory(category)) {
    throw new Error("Only stitched designs can be uploaded by shops");
  }
  const title = String(formData.get("title") ?? "").trim();

  const uploadFiles: File[] = [];
  for (let i = 0; i < MAX_DESIGN_IMAGES; i++) {
    const entry = formData.get(`designImage${i}`);
    if (entry instanceof File && entry.size > 0) uploadFiles.push(entry);
  }
  if (uploadFiles.length === 0) {
    const legacy = formData.get("image");
    if (legacy instanceof File && legacy.size > 0) uploadFiles.push(legacy);
  }
  if (uploadFiles.length > MAX_DESIGN_IMAGES) {
    throw new Error(`Maximum ${MAX_DESIGN_IMAGES} photos per design`);
  }

  await persistShopDesign(id, shop, {
    category,
    title,
    files: uploadFiles,
  });
  revalidatePath("/shop/designs");
  revalidatePath("/customer/designs");
  revalidatePath("/customer/shops");
}

export async function deleteDesignImage(formData: FormData) {
  const id = await shopIdOnly();
  const designId = String(formData.get("designId") ?? "").trim();
  const imagePath = String(formData.get("imagePath") ?? "").trim();
  if (!designId || !imagePath) throw new Error("Invalid request");

  const design = await prisma.design.findFirst({
    where: shopManageableDesignWhere(id, designId),
  });
  if (!design) throw new Error("Design not found");

  const images = parseDesignImages(design.imagesJson, design.imagePath);
  const remaining = images.filter((p) => p !== imagePath);
  if (remaining.length === images.length) throw new Error("Photo not found");

  await deleteStoredUpload(imagePath);

  if (remaining.length === 0) {
    for (const p of images) {
      if (p !== imagePath) await deleteStoredUpload(p);
    }
    await prisma.design.delete({ where: { id: designId } });
  } else {
    await prisma.design.update({
      where: { id: designId },
      data: {
        imagePath: remaining[0]!,
        imagesJson: JSON.stringify(remaining),
      },
    });
  }

  revalidatePath("/shop/designs");
  revalidatePath("/customer/designs");
  revalidatePath("/customer/shops");
}

export async function deleteDesign(designId: string) {
  const id = await shopIdOnly();
  const design = await prisma.design.findFirst({
    where: shopManageableDesignWhere(id, designId),
  });
  if (!design) throw new Error("Design not found");

  const images = parseDesignImages(design.imagesJson, design.imagePath);
  await Promise.all(images.map((p) => deleteStoredUpload(p)));
  await prisma.design.delete({ where: { id: designId } });

  revalidatePath("/shop/designs");
  revalidatePath("/customer/designs");
  revalidatePath("/customer/shops");
}

export async function deleteOrderImage(formData: FormData) {
  const shop = await shopId();
  const imageId = String(formData.get("imageId") ?? "").trim();
  if (!imageId) throw new Error("Invalid request");

  const row = await prisma.orderImage.findFirst({
    where: { id: imageId, order: { shopId: shop } },
  });
  if (!row || row.uploadedBy !== "SHOP") throw new Error("Photo not found");

  await deleteStoredUpload(row.imagePath);
  await prisma.orderImage.delete({ where: { id: imageId } });

  revalidatePath("/shop/orders");
  revalidatePath("/customer/orders");
  bumpShopTabs(shop);
}

export async function updateOrderStatus(formData: FormData) {
  const id = await shopId();
  const orderId = String(formData.get("orderId"));
  const status = formData.get("status") as OrderStatus;
  const order = await prisma.order.findFirst({
    where: { id: orderId, shopId: id },
  });
  if (!order) throw new Error("Order not found");

  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  });

  revalidatePath("/shop");
  revalidatePath("/shop/orders");
  revalidatePath("/customer/orders");
  bumpShopTabs(id);
}

export async function updateOrderWork(formData: FormData) {
  const shop = await shopId();
  const orderId = String(formData.get("orderId"));
  const order = await prisma.order.findFirst({ where: { id: orderId, shopId: shop } });
  if (!order) throw new Error("Order not found");

  const clothFile = formData.get("clothImage");
  let clothImagePath: string | undefined;

  if (clothFile instanceof File && clothFile.size > 0) {
    clothImagePath = await saveUpload(clothFile, "cloth");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      workType: (String(formData.get("workType") ?? order.workType) as WorkType),
      stitchType: String(formData.get("stitchType") ?? "") || null,
      clothDescription: String(formData.get("clothDescription") ?? "") || null,
      ...(clothImagePath ? { clothImagePath } : {}),
    },
  });

  await appendOrderImagesFromForm(orderId, formData, "SHOP", "workImg");

  revalidatePath("/shop/orders");
  revalidatePath("/customer/orders");
  bumpShopTabs(shop);
}

function revalidateBillPaths(billId: string, shopId: string) {
  revalidatePath("/shop");
  revalidatePath("/shop/bills");
  revalidatePath(`/shop/bills/${billId}`);
  revalidatePath("/shop/reports");
  revalidatePath("/customer/bills");
  revalidatePath(`/customer/bills/${billId}`);
  bumpShopTabs(shopId);
}

/** Shop marks customer payment — full balance or partial amount received now. */
export async function recordBillPayment(formData: FormData) {
  const shop = await shopId();
  const billId = String(formData.get("billId"));
  const bill = await prisma.bill.findFirst({ where: { id: billId, shopId: shop } });
  if (!bill) throw new Error("Bill not found");

  const pending = billPending(bill.amount, bill.advancePaid, bill.paidAmount);
  if (pending <= 0.01) {
    if (!bill.paid) {
      await prisma.bill.update({
        where: { id: billId },
        data: { paid: true, paidAt: bill.paidAt ?? new Date() },
      });
      revalidateBillPaths(billId, shop);
    }
    return;
  }

  const markFull = formData.get("markFull") === "true";
  let paidAmount = bill.paidAmount;

  if (markFull) {
    paidAmount = Math.max(0, bill.amount - bill.advancePaid);
  } else {
    const add = parseFloat(String(formData.get("amount") ?? "0")) || 0;
    if (add <= 0) throw new Error("Enter payment amount");
    paidAmount = Math.min(bill.paidAmount + add, Math.max(0, bill.amount - bill.advancePaid));
  }

  const paid = billFullyPaid(bill.amount, bill.advancePaid, paidAmount);

  await prisma.bill.update({
    where: { id: billId },
    data: {
      paidAmount,
      paid,
      paidAt: paid ? (bill.paidAt ?? new Date()) : null,
    },
  });

  revalidateBillPaths(billId, shop);
  return { paid };
}

export async function replyPriceRequest(formData: FormData) {
  const shop = await shopId();
  const requestId = String(formData.get("requestId"));
  const quotedPrice = parseFloat(String(formData.get("quotedPrice") ?? ""));
  const shopReply = String(formData.get("shopReply") ?? "").trim() || null;

  if (!Number.isFinite(quotedPrice) || quotedPrice < 0) {
    throw new Error("Enter a valid price");
  }

  const row = await prisma.priceRequest.findFirst({
    where: { id: requestId, shopId: shop },
  });
  if (!row) throw new Error("Request not found");

  await prisma.priceRequest.update({
    where: { id: requestId },
    data: {
      quotedPrice,
      shopReply,
      status: "QUOTED",
    },
  });

  revalidatePath("/shop/orders");
  revalidatePath("/shop/price-requests");
  revalidatePath("/customer/price-requests");
  bumpShopTabs(shop);
}

export async function createWorkerPartnerRequest(formData: FormData) {
  const id = await shopIdOnly();
  const roleRaw = String(formData.get("role") ?? "").trim().toUpperCase();
  if (!isSelectableWorkerPartnerRole(roleRaw)) {
    throw new Error("Select a worker type");
  }
  const role = roleRaw;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const neededFromRaw = String(formData.get("neededFrom") ?? "").trim();
  const durationRaw = String(formData.get("durationType") ?? "").trim().toUpperCase();
  const durationType = parseWorkerPartnerDurationType(durationRaw);
  if (!durationType || !WORKER_PARTNER_DURATION_TYPES.includes(durationType)) {
    throw new Error("Select how many days you need the worker");
  }
  const neededFrom = parseNeededFromDate(neededFromRaw);
  let customDays: number | null = null;
  if (durationType === "CUSTOM_DAYS") {
    const n = Number(formData.get("customDays"));
    if (!Number.isInteger(n) || n < 3 || n > 90) {
      throw new Error("Enter number of days (3–90)");
    }
    customDays = n;
  }

  const shop = await prisma.shopProfile.findUnique({
    where: { id },
    select: { city: true, shopName: true },
  });
  if (!shop) throw new Error("Shop not found");
  const city = normalizeCity(shop.city);
  if (!city) {
    throw new Error("Set your shop city in Profile before sending a worker request");
  }

  const created = await prisma.workerPartnerRequest.create({
    data: {
      shopId: id,
      role,
      customRole: null,
      neededFrom,
      durationType,
      customDays,
      notes,
      city,
      status: "OPEN",
    },
  });

  try {
    await createWorkRequirementForPartnerRequest({
      shopId: id,
      shopName: shop.shopName,
      workerPartnerRequestId: created.id,
      role,
      city,
      notes,
      neededFrom,
      durationType,
      customDays,
    });
  } catch (err) {
    console.error("[lk-studio] WorkRequirement sync failed:", err);
  }

  revalidatePath("/shop/workers");
  revalidatePath("/work-partner/requests");
  revalidatePath("/api/work-partner/requests");
  bumpShopTabs(id);
}

export async function cancelWorkerPartnerRequest(requestId: string) {
  const id = await shopIdOnly();
  const row = await prisma.workerPartnerRequest.findFirst({
    where: { id: requestId, shopId: id, status: "OPEN" },
  });
  if (!row) throw new Error("Request not found");

  await prisma.workerPartnerRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED" },
  });

  try {
    await cancelWorkRequirementForPartnerRequest(requestId);
  } catch (err) {
    console.error("[lk-studio] WorkRequirement cancel sync failed:", err);
  }

  revalidatePath("/shop/workers");
  revalidatePath("/work-partner/requests");
  bumpShopTabs(id);
}

/** Shop rates the work partner who accepted this request (1–5). */
export async function rateAcceptedWorkPartner(formData: FormData) {
  const shopId = await shopIdOnly();
  const requestId = String(formData.get("requestId") ?? "").trim();
  const rating = Number(formData.get("rating"));
  if (!requestId) throw new Error("Missing request");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Pick a rating from 1 to 5");
  }

  const req = await prisma.workerPartnerRequest.findFirst({
    where: {
      id: requestId,
      shopId,
      status: "FILLED",
      acceptedPartnerId: { not: null },
    },
    select: {
      id: true,
      acceptedPartnerId: true,
      ratings: { where: { shopId }, select: { id: true, rating: true }, take: 1 },
    },
  });
  if (!req?.acceptedPartnerId) throw new Error("No accepted partner on this request");

  const existing = req.ratings[0];
  await prisma.$transaction(async (tx) => {
    if (existing) {
      const delta = rating - existing.rating;
      await tx.workPartnerRating.update({
        where: { id: existing.id },
        data: { rating },
      });
      if (delta !== 0) {
        await tx.workPartnerProfile.update({
          where: { id: req.acceptedPartnerId! },
          data: { ratingSum: { increment: delta } },
        });
      }
    } else {
      await tx.workPartnerRating.create({
        data: {
          partnerId: req.acceptedPartnerId!,
          shopId,
          requestId,
          rating,
        },
      });
      await tx.workPartnerProfile.update({
        where: { id: req.acceptedPartnerId! },
        data: {
          ratingSum: { increment: rating },
          ratingCount: { increment: 1 },
        },
      });
    }
  });

  revalidatePath("/shop/workers");
  bumpShopTabs(shopId);
}

export async function acceptWorkerPartnerApplication(submissionId: string) {
  const shopId = await shopIdOnly();
  await shopAcceptWorkerApplication(submissionId, shopId);
  revalidatePath("/shop/workers");
  bumpShopTabs(shopId);
}

export async function rejectWorkerPartnerApplication(submissionId: string) {
  const shopId = await shopIdOnly();
  await shopRejectWorkerApplication(submissionId, shopId);
  revalidatePath("/shop/workers");
  bumpShopTabs(shopId);
}

export async function cancelShopWorkRequirement(requirementId: string) {
  const id = await shopIdOnly();
  await cancelWorkRequirementById(requirementId, id);
  revalidatePath("/shop/workers");
  bumpShopTabs(id);
}
