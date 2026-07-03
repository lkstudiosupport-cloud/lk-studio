"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ServiceCategory, WorkType } from "@prisma/client";
import { fieldKeysForType, idToPrismaType, MEASUREMENT_TYPES, type MeasurementTypeId } from "@/lib/measurements";
import { designVisibleToCustomerShopWhere } from "@/lib/design-access";
import type { ActionState } from "@/lib/action-state";
import { appendOrderImagesFromForm } from "@/lib/save-order-images";
import { saveUpload, deleteStoredUpload } from "@/lib/storage";
import { normalizeCity } from "@/lib/cities";
import { MAX_PERSON_PHOTOS, parsePersonPhotos } from "@/lib/person-photos";
import { isShopActive } from "@/lib/subscription";

function revalidateMeasurementPaths() {
  revalidatePath("/customer/persons");
  revalidatePath("/customer/orders");
  revalidatePath("/shop/orders");
}

async function customerId() {
  const session = await requireSession(["CUSTOMER"]);
  if (!session) throw new Error("Unauthorized");
  return session.id;
}

async function assertShopAcceptsOrders(shopId: string) {
  const shop = await prisma.shopProfile.findUnique({ where: { id: shopId } });
  if (!shop || !isShopActive(shop.subscriptionStatus, shop.subscriptionEndsAt)) {
    throw new Error("This shop is not accepting orders right now");
  }
  return shop;
}

export async function addPerson(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const cid = await customerId();
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { ok: false, error: "Name required" };

    await prisma.person.create({
      data: {
        customerId: cid,
        name,
        relation: String(formData.get("relation") ?? "").trim() || null,
        notes: String(formData.get("notes") ?? "").trim() || null,
      },
    });
    revalidateMeasurementPaths();
    return { ok: true, message: "personAdded" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function addPersonPhotos(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const cid = await customerId();
    const personId = String(formData.get("personId"));
    const person = await prisma.person.findFirst({
      where: { id: personId, customerId: cid },
    });
    if (!person) return { ok: false, error: "Person not found" };

    const existing = parsePersonPhotos(person.photosJson);
    const room = MAX_PERSON_PHOTOS - existing.length;
    if (room <= 0) return { ok: false, error: "personPhotosMax" };

    const uploadFiles: File[] = [];
    for (let i = 0; i < room; i++) {
      const entry = formData.get(`personPhoto${i}`);
      if (entry instanceof File && entry.size > 0) uploadFiles.push(entry);
    }
    if (uploadFiles.length === 0) return { ok: false, error: "Add at least one photo" };

    const paths = await Promise.all(
      uploadFiles.slice(0, room).map((f) => saveUpload(f, `persons/${personId}`))
    );
    const merged = [...existing, ...paths].slice(0, MAX_PERSON_PHOTOS);

    await prisma.person.update({
      where: { id: personId },
      data: { photosJson: JSON.stringify(merged) },
    });

    revalidateMeasurementPaths();
    return { ok: true, message: "photosSaved" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deletePersonPhoto(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const cid = await customerId();
    const personId = String(formData.get("personId"));
    const imagePath = String(formData.get("imagePath") ?? "").trim();
    if (!imagePath) return { ok: false, error: "Invalid request" };

    const person = await prisma.person.findFirst({
      where: { id: personId, customerId: cid },
    });
    if (!person) return { ok: false, error: "Person not found" };

    const photos = parsePersonPhotos(person.photosJson);
    const remaining = photos.filter((p) => p !== imagePath);
    if (remaining.length === photos.length) return { ok: false, error: "Photo not found" };

    await deleteStoredUpload(imagePath);
    await prisma.person.update({
      where: { id: personId },
      data: { photosJson: remaining.length > 0 ? JSON.stringify(remaining) : null },
    });

    revalidateMeasurementPaths();
    return { ok: true, message: "photoRemoved" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deletePerson(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const cid = await customerId();
    const personId = String(formData.get("personId"));
    const person = await prisma.person.findFirst({
      where: { id: personId, customerId: cid },
      include: { orders: { select: { id: true }, take: 1 } },
    });
    if (!person) return { ok: false, error: "Person not found" };
    if (person.orders.length > 0) return { ok: false, error: "personHasOrders" };

    const photos = parsePersonPhotos(person.photosJson);
    await Promise.all(photos.map((p) => deleteStoredUpload(p)));
    await prisma.person.delete({ where: { id: personId } });

    revalidateMeasurementPaths();
    return { ok: true, message: "personDeleted" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deletePersonMeasurements(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const cid = await customerId();
    const personId = String(formData.get("personId"));
    const typeRaw = String(formData.get("measurementType") ?? "");
    if (!MEASUREMENT_TYPES.includes(typeRaw as MeasurementTypeId)) {
      return { ok: false, error: "Invalid measurement type" };
    }

    const person = await prisma.person.findFirst({
      where: { id: personId, customerId: cid },
    });
    if (!person) return { ok: false, error: "Person not found" };

    const prismaType = idToPrismaType(typeRaw as MeasurementTypeId);
    await prisma.measurement.deleteMany({
      where: { personId, type: prismaType },
    });

    revalidateMeasurementPaths();
    return { ok: true, message: "measurementsDeleted" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function deleteOrderImage(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const cid = await customerId();
    const imageId = String(formData.get("imageId") ?? "").trim();
    if (!imageId) return { ok: false, error: "Invalid request" };

    const row = await prisma.orderImage.findFirst({
      where: { id: imageId, order: { customerId: cid } },
    });
    if (!row || row.uploadedBy !== "CUSTOMER") return { ok: false, error: "Photo not found" };

    await deleteStoredUpload(row.imagePath);
    await prisma.orderImage.delete({ where: { id: imageId } });

    revalidatePath("/customer/orders");
    revalidatePath("/shop/orders");
    return { ok: true, message: "photoRemoved" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updatePerson(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const cid = await customerId();
    const personId = String(formData.get("personId"));
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return { ok: false, error: "Name required" };

    const person = await prisma.person.findFirst({
      where: { id: personId, customerId: cid },
    });
    if (!person) return { ok: false, error: "Person not found" };

    await prisma.person.update({
      where: { id: personId },
      data: {
        name,
        relation: String(formData.get("relation") ?? "").trim() || null,
      },
    });
    revalidateMeasurementPaths();
    return { ok: true, message: "personUpdated" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function saveMeasurements(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const cid = await customerId();
    const personId = String(formData.get("personId"));
    const person = await prisma.person.findFirst({
      where: { id: personId, customerId: cid },
    });
    if (!person) return { ok: false, error: "Person not found" };

    const typeRaw = String(formData.get("measurementType") ?? "blouse");
    if (!MEASUREMENT_TYPES.includes(typeRaw as MeasurementTypeId)) {
      return { ok: false, error: "Invalid measurement type" };
    }
    const measureType = typeRaw as MeasurementTypeId;
    const prismaType = idToPrismaType(measureType);

    const data: Record<string, string | null> = {};
    for (const f of fieldKeysForType(measureType)) {
      const v = String(formData.get(f) ?? "").trim();
      data[f] = v || null;
    }

    await prisma.measurement.upsert({
      where: { personId_type: { personId, type: prismaType } },
      create: { personId, type: prismaType, ...data },
      update: { ...data },
    });

    revalidateMeasurementPaths();
    return { ok: true, message: "measurementsSaved" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function placeOrder(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const cid = await customerId();
    const personId = String(formData.get("personId"));
    const designIdRaw = String(formData.get("designId") ?? "").trim();
    const shopIdRaw = String(formData.get("shopId") ?? "").trim();
    const workType = (String(formData.get("workType") ?? "STITCHING") as WorkType);
    const category = (formData.get("category") as ServiceCategory) || "BLOUSE_DESIGN";
    const notes = String(formData.get("notes") ?? "").trim() || null;

    const person = await prisma.person.findFirst({
      where: { id: personId, customerId: cid },
    });
    if (!person) return { ok: false, error: "Select a person" };

    let shopId = shopIdRaw;
    let designId: string | null = designIdRaw || null;

    if (designIdRaw) {
      const design = await prisma.design.findUnique({ where: { id: designIdRaw } });
      if (!design) return { ok: false, error: "Design not found" };
      if (!shopId && design.shopId) shopId = design.shopId;
    }

    if (!shopId) return { ok: false, error: "Select a shop" };

    await assertShopAcceptsOrders(shopId);

    const orderNumber = `ORD-${Date.now()}`;
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: cid,
        shopId,
        personId,
        designId,
        workType,
        category,
        notes,
        status: "PENDING",
        ...(designId
          ? {
              orderFavorites: {
                create: {
                  designId,
                  category,
                },
              },
            }
          : {}),
      },
    });

    const uploaded = await appendOrderImagesFromForm(order.id, formData, "CUSTOMER", "orderImg");

    if (!designIdRaw && uploaded.length === 0) {
      await prisma.order.delete({ where: { id: order.id } });
      return { ok: false, error: "Select a design or upload at least one photo" };
    }

    revalidatePath("/customer/orders");
    revalidatePath("/shop/orders");
    return { ok: true, message: "orderPlaced" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function toggleSavedShop(shopId: string): Promise<boolean> {
  const cid = await customerId();
  await assertShopAcceptsOrders(shopId);

  const existing = await prisma.customerSavedShop.findUnique({
    where: { customerId_shopId: { customerId: cid, shopId } },
  });

  if (existing) {
    await prisma.customerSavedShop.delete({ where: { id: existing.id } });
  } else {
    await prisma.customerSavedShop.create({
      data: { customerId: cid, shopId },
    });
  }

  revalidatePath("/customer/shops");
  revalidatePath("/customer/designs");
  return !existing;
}

export async function toggleFavorite(designId: string, shopId: string): Promise<boolean> {
  const cid = await customerId();

  const design = await prisma.design.findFirst({
    where: designVisibleToCustomerShopWhere(designId, shopId),
  });
  if (!design) throw new Error("Design not found");

  await assertShopAcceptsOrders(shopId);

  const existing = await prisma.customerFavorite.findUnique({
    where: { customerId_designId: { customerId: cid, designId } },
  });

  if (existing) {
    await prisma.customerFavorite.delete({ where: { id: existing.id } });
  } else {
    await prisma.customerFavorite.create({
      data: {
        customerId: cid,
        designId,
        shopId,
        category: design.category,
      },
    });
  }

  revalidatePath("/customer/favorites");
  revalidatePath("/customer/designs");
  revalidatePath("/shop/customer-favorites");

  return !existing;
}

export async function askPrice(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const cid = await customerId();

    const shopId = String(formData.get("shopId") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim() || null;

    if (!shopId) return { ok: false, error: "Select a shop" };
    await assertShopAcceptsOrders(shopId);

    const imageFile = formData.get("customerImage");
    let customerImagePath: string | null = null;
    if (imageFile instanceof File && imageFile.size > 0) {
      customerImagePath = await saveUpload(imageFile, "price-requests");
    }

    const designIds = [...new Set(formData.getAll("designId").map(String).filter(Boolean))];

    if (designIds.length > 0) {
      let created = 0;
      for (const id of designIds) {
        const design = await prisma.design.findFirst({
          where: designVisibleToCustomerShopWhere(id, shopId),
        });
        if (!design) continue;

        await prisma.priceRequest.create({
          data: {
            customerId: cid,
            shopId,
            designId: design.id,
            category: design.category,
            customerImagePath,
            notes,
          },
        });
        created += 1;
      }

      if (created === 0) return { ok: false, error: "Design not found" };

      revalidatePath("/customer/price-requests");
      revalidatePath("/shop/orders");
      revalidatePath("/shop/price-requests");
      revalidatePath("/customer/designs");
      revalidatePath("/customer/favorites");
      return {
        ok: true,
        message: created > 1 ? "priceRequestsSent" : "priceRequestSent",
      };
    }

    const designIdRaw = String(formData.get("designId") ?? "").trim();
    const categoryRaw = String(formData.get("category") ?? "").trim();

    let designId: string | null = designIdRaw || null;
    let category: ServiceCategory;

    if (designId) {
      const design = await prisma.design.findFirst({
        where: designVisibleToCustomerShopWhere(designId, shopId),
      });
      if (!design) return { ok: false, error: "Design not found" };
      category = design.category;
    } else {
      if (!categoryRaw) return { ok: false, error: "Select a category" };
      category = categoryRaw as ServiceCategory;
      if (category !== "MAGGAM" && category !== "COMPUTER_EMBROIDERY") {
        return { ok: false, error: "askPriceOwnCategoryOnly" };
      }
    }

    if (!designId && !customerImagePath) {
      return { ok: false, error: "Upload your design photo to ask price" };
    }

    await prisma.priceRequest.create({
      data: {
        customerId: cid,
        shopId,
        designId,
        category,
        customerImagePath,
        notes,
      },
    });

    revalidatePath("/customer/price-requests");
    revalidatePath("/shop/orders");
    revalidatePath("/shop/price-requests");
    revalidatePath("/customer/designs");
    revalidatePath("/customer/favorites");
    return { ok: true, message: "priceRequestSent" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function placeOrderFromFavorites(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const cid = await customerId();

    const shopId = String(formData.get("shopId") ?? "").trim();
    const personId = String(formData.get("personId"));
    const workType = String(formData.get("workType") ?? "STITCHING") as WorkType;
    const notes = String(formData.get("notes") ?? "").trim() || null;
    const designIds = formData.getAll("designId").map(String).filter(Boolean);

    if (!shopId) return { ok: false, error: "Select a shop" };
    if (designIds.length === 0) return { ok: false, error: "Select at least one favorite design" };

    await assertShopAcceptsOrders(shopId);

    const person = await prisma.person.findFirst({
      where: { id: personId, customerId: cid },
    });
    if (!person) return { ok: false, error: "Select a person" };

    const favorites = await prisma.customerFavorite.findMany({
      where: {
        customerId: cid,
        shopId,
        designId: { in: designIds },
      },
      include: { design: true },
    });

    if (favorites.length !== designIds.length) {
      return { ok: false, error: "Some selected designs are not in your favorites" };
    }

    const primary = favorites[0]!;
    const orderNumber = `ORD-${Date.now()}`;

    await prisma.order.create({
      data: {
        orderNumber,
        customerId: cid,
        shopId,
        personId,
        designId: primary.designId,
        workType,
        category: primary.category,
        notes,
        status: "PENDING",
        orderFavorites: {
          create: favorites.map((f) => ({
            designId: f.designId,
            category: f.category,
          })),
        },
      },
    });

    revalidatePath("/customer/orders");
    revalidatePath("/customer/favorites");
    revalidatePath("/shop/orders");
    return { ok: true, message: "orderPlaced" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function uploadCustomerOrderImages(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const cid = await customerId();
    const orderId = String(formData.get("orderId"));
    const order = await prisma.order.findFirst({
      where: { id: orderId, customerId: cid },
    });
    if (!order) return { ok: false, error: "Order not found" };

    await appendOrderImagesFromForm(order.id, formData, "CUSTOMER", "orderImg");
    revalidatePath("/customer/orders");
    revalidatePath("/shop/orders");
    return { ok: true, message: "photosUploaded" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function updateCustomerProfile(formData: FormData) {
  const session = await requireSession(["CUSTOMER"]);
  if (!session) throw new Error("Unauthorized");

  const photoFile = formData.get("profilePhotoFile");
  let profilePhoto: string | undefined;
  if (formData.get("removeProfilePhoto") === "true") {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { profilePhoto: true },
    });
    if (user?.profilePhoto) {
      await deleteStoredUpload(user.profilePhoto);
    }
    profilePhoto = null as unknown as undefined;
  } else if (photoFile instanceof File && photoFile.size > 0) {
    profilePhoto = await saveUpload(photoFile, `profile/user-${session.id}`);
  }

  const latRaw = String(formData.get("latitude") ?? "").trim();
  const lngRaw = String(formData.get("longitude") ?? "").trim();

  await prisma.user.update({
    where: { id: session.id },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim() || null,
      whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
      city: normalizeCity(String(formData.get("city") ?? "")),
      address: String(formData.get("address") ?? "").trim() || null,
      locationLink: String(formData.get("locationLink") ?? "").trim() || null,
      latitude: latRaw ? parseFloat(latRaw) : null,
      longitude: lngRaw ? parseFloat(lngRaw) : null,
      ...(profilePhoto !== undefined
        ? { profilePhoto }
        : formData.get("removeProfilePhoto") === "true"
          ? { profilePhoto: null }
          : {}),
    },
  });
  revalidatePath("/customer/profile");
  revalidatePath("/customer/shops");
  revalidatePath("/customer", "layout");
}

export async function rateShopOrder(input: {
  orderId: string;
  shopId: string;
  rating: number;
}) {
  const cid = await customerId();
  const rating = Math.min(5, Math.max(1, Math.round(input.rating)));

  const order = await prisma.order.findFirst({
    where: {
      id: input.orderId,
      customerId: cid,
      shopId: input.shopId,
      status: "DELIVERED",
    },
  });
  if (!order) throw new Error("Order not found");

  await prisma.shopRating.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      shopId: input.shopId,
      customerId: cid,
      rating,
    },
    update: { rating },
  });

  revalidatePath("/customer/shops");
  revalidatePath("/customer/orders");
  revalidatePath("/customer/designs");
}
