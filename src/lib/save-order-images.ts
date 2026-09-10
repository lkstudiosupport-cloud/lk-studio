import { saveUpload } from "@/lib/upload";
import type { ImageUploader } from "@prisma/client";
import { prisma } from "@/lib/prisma";

async function addImage(orderId: string, file: File, uploadedBy: ImageUploader) {
  const path = await saveUpload(file, "order-images");
  await prisma.orderImage.create({
    data: { orderId, imagePath: path, uploadedBy },
  });
  return path;
}

export async function appendOrderImagesFromForm(
  orderId: string,
  formData: FormData,
  uploadedBy: ImageUploader,
  prefix = "orderImg"
) {
  const files: File[] = [];
  for (const [key, value] of Array.from(formData.entries())) {
    if (key.startsWith(prefix) && value instanceof File && value.size > 0) {
      files.push(value);
    }
  }
  for (const value of formData.getAll(`${prefix}Multi`)) {
    if (value instanceof File && value.size > 0) {
      files.push(value);
    }
  }
  if (files.length === 0) return [] as string[];
  return Promise.all(files.map((file) => addImage(orderId, file, uploadedBy)));
}
