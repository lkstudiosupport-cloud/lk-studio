/** Resize/compress photos on the phone before upload — keeps batches under server limits. */

function isLikelyImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(file.name);
}

function isHeicLike(file: File): boolean {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return (
    type === "image/heic" ||
    type === "image/heif" ||
    name.endsWith(".heic") ||
    name.endsWith(".heif")
  );
}

type CanvasSource = {
  width: number;
  height: number;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  cleanup: () => void;
};

async function loadCanvasSource(file: File): Promise<CanvasSource> {
  try {
    const bitmap = await createImageBitmap(file);
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
      cleanup: () => bitmap.close(),
    };
  } catch {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
          cleanup: () => URL.revokeObjectURL(url),
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not decode image"));
      };
      img.src = url;
    });
  }
}

export async function compressImageFile(
  file: File,
  opts?: { maxEdge?: number; quality?: number; maxBytes?: number }
): Promise<File> {
  const maxEdge = opts?.maxEdge ?? 1600;
  const quality = opts?.quality ?? 0.82;
  const maxBytes = opts?.maxBytes ?? 2 * 1024 * 1024;

  if (!isLikelyImage(file)) return file;
  // Browsers often cannot decode HEIC — upload as-is; server converts to JPEG.
  if (isHeicLike(file)) return file;
  if (file.size <= maxBytes && file.type === "image/jpeg") return file;

  let source: CanvasSource | null = null;
  try {
    source = await loadCanvasSource(file);
  } catch {
    return file;
  }

  try {
    let w = source.width;
    let h = source.height;
    const scale = Math.min(1, maxEdge / w, maxEdge / h);
    w = Math.max(1, Math.round(w * scale));
    h = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    source.draw(ctx, w, h);

    let q = quality;
    let blob: Blob | null = null;
    while (q >= 0.55) {
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", q)
      );
      if (blob && blob.size <= maxBytes) break;
      q -= 0.08;
    }
    if (!blob) {
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.65)
      );
    }
    if (!blob) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } finally {
    source.cleanup();
  }
}

export async function compressImageFiles(files: File[]): Promise<File[]> {
  return Promise.all(files.map((f) => compressImageFile(f)));
}
