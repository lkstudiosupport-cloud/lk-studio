"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appendOrderImagesFromForm } from "@/lib/save-order-images";
import { saveUpload } from "@/lib/upload";
import { persistShopDesign } from "@/lib/shop-design-upload";
import { MAX_DESIGN_IMAGES } from "@/lib/design-images";
import { billItemsTotal, parseBillItems } from "@/lib/bill-items";
import { billFullyPaid, billPending } from "@/lib/bill-payment";
import { isShopActive, extendSubscriptionEnd, SHOP_MONTHLY_PRICE_INR } from "@/lib/subscription";
import type { OrderStatus, ServiceCategory, WorkType } from "@prisma/client";

async function shopIdOnly() {
  const session = await requireSession(["SHOP"]);
  if (!session?.shopId) throw new Error("Unauthorized");
  return session.shopId;
}

async function shopId() {
  const id = await shopIdOnly();
  const shop = await prisma.shopProfile.findUnique({ where: { id } });
  if (!shop || !isShopActive(shop.subscriptionStatus, shop.subscriptionEndsAt)) {
    throw new Error("Shop subscription inactive — renew in Profile");
  }
  return id;
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
  if (photoFile instanceof File && photoFile.size > 0) {
    profilePhoto = await saveUpload(photoFile, `profile/shop-${id}`);
  }

  const latRaw = String(formData.get("latitude") ?? "").trim();
  const lngRaw = String(formData.get("longitude") ?? "").trim();

  await prisma.shopProfile.update({
    where: { id },
    data: {
      shopName: String(formData.get("shopName") ?? ""),
      address: String(formData.get("address") ?? "").trim() || null,
      locationLink: String(formData.get("locationLink") ?? "").trim() || null,
      latitude: latRaw ? parseFloat(latRaw) : null,
      longitude: lngRaw ? parseFloat(lngRaw) : null,
      shopTimings: String(formData.get("shopTimings") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
      instagram: String(formData.get("instagram") ?? "").trim() || null,
      upiId: String(formData.get("upiId") ?? "").trim() || null,
      ...(upiQrImage ? { upiQrImage } : {}),
      ...(profilePhoto ? { profilePhoto } : {}),
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
}

export async function createBill(formData: FormData) {
  const shop = await shopId();
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim() || null;
  if (!customerName) throw new Error("Enter customer name");

  const itemsJson = String(formData.get("itemsJson") ?? "[]");
  const items = parseBillItems(itemsJson);
  if (items.length === 0) throw new Error("Add at least one item with name, quantity and price");

  const amount = parseFloat(String(formData.get("amount"))) || billItemsTotal(items);
  const advancePaid = parseFloat(String(formData.get("advancePaid") ?? "0")) || 0;
  const paidAmount = parseFloat(String(formData.get("paidAmount") ?? "0")) || 0;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const voiceText = notes;
  const firstOrderId = items.find((i) => i.orderId)?.orderId ?? null;
  const paid =
    formData.get("paid") === "on" || billFullyPaid(amount, advancePaid, paidAmount);

  const billNumber = `BILL-${Date.now()}`;
  const bill = await prisma.bill.create({
    data: {
      billNumber,
      shop: { connect: { id: shop } },
      customerName,
      customerPhone,
      ...(firstOrderId ? { order: { connect: { id: firstOrderId } } } : {}),
      amount,
      advancePaid,
      paidAmount,
      paid,
      itemsJson,
      notes,
      voiceText,
    },
  });
  revalidatePath("/shop/bills");
  revalidatePath("/customer/bills");
  return { id: bill.id };
}

function revalidateBillPaths(billId: string) {
  revalidatePath("/shop");
  revalidatePath("/shop/bills");
  revalidatePath(`/shop/bills/${billId}`);
  revalidatePath("/shop/reports");
  revalidatePath("/customer/bills");
  revalidatePath(`/customer/bills/${billId}`);
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
      await prisma.bill.update({ where: { id: billId }, data: { paid: true } });
      revalidateBillPaths(billId);
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
    data: { paidAmount, paid },
  });

  revalidateBillPaths(billId);
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

  revalidatePath("/shop/price-requests");
  revalidatePath("/customer/price-requests");
}
