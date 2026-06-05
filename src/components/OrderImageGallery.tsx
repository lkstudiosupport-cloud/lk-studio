import Image from "next/image";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { allOrderImagePaths } from "@/lib/order-images";
import type { OrderImage } from "@prisma/client";

export function OrderImageGallery({
  images,
  legacyJson,
  extras,
  locale,
  titleKey = "workPhotos",
}: {
  images: OrderImage[];
  legacyJson: string | null;
  extras?: { cloth?: string | null; workDesign?: string | null; design?: string | null };
  locale: Locale;
  titleKey?: string;
}) {
  const all = allOrderImagePaths(images, legacyJson, extras);
  if (all.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="mb-2 text-xs font-bold uppercase text-brand-green">{t(locale, titleKey)}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {all.map((img, i) => (
          <div key={`${img.path}-${i}`} className="overflow-hidden rounded-xl border border-brand-green/10">
            <div className="relative aspect-square">
              <Image src={img.path} alt="" fill className="object-cover" unoptimized />
            </div>
            <p className="bg-zinc-50 px-1 py-0.5 text-center text-[10px] text-zinc-600">
              {img.caption ?? (img.by === "SHOP" ? t(locale, "shopUpload") : t(locale, "customerUpload"))}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
