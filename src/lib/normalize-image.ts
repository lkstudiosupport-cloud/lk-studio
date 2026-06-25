import sharp from "sharp";

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif|tiff?)$/i;

export function isImageUpload(fileName: string, contentType?: string): boolean {
  if (contentType?.startsWith("image/")) return true;
  return IMAGE_EXT.test(fileName);
}

/** Convert any supported photo to JPEG for storage and display (handles HEIC, PNG, etc.). */
export async function normalizeImageForStorage(
  buffer: Buffer,
  contentType?: string
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  try {
    const jpeg = await sharp(buffer, { failOn: "none" })
      .rotate()
      .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
    return { buffer: jpeg, contentType: "image/jpeg", ext: ".jpg" };
  } catch {
    const ext = contentType?.includes("png")
      ? ".png"
      : contentType?.includes("webp")
        ? ".webp"
        : ".jpg";
    return {
      buffer,
      contentType: contentType || "application/octet-stream",
      ext,
    };
  }
}
