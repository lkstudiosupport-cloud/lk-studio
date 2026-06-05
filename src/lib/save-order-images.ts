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
  const paths: string[] = [];
  for (const [key, value] of Array.from(formData.entries())) {
    if (key.startsWith(prefix) && value instanceof File && value.size > 0) {
      paths.push(await addImage(orderId, value, uploadedBy));
    }
  }
  const multi = formData.getAll(`${prefix}Multi`);
  for (const value of multi) {
    if (value instanceof File && value.size > 0) {
      paths.push(await addImage(orderId, value, uploadedBy));
    }
  }
  return paths;
}
