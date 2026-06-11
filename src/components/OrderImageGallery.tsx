"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { allOrderImagePaths } from "@/lib/order-images";
import type { ImageUploader, OrderImage } from "@prisma/client";
import { deleteOrderImage as deleteCustomerOrderImage } from "@/app/customer/actions";
import { deleteOrderImage as deleteShopOrderImage } from "@/app/shop/actions";
import { X } from "lucide-react";

export function OrderImageGallery({
  images,
  legacyJson,
  extras,
  locale,
  titleKey = "workPhotos",
  deletableRole,
}: {
  images: OrderImage[];
  legacyJson: string | null;
  extras?: { cloth?: string | null; workDesign?: string | null; design?: string | null };
  locale: Locale;
  titleKey?: string;
  /** When set, uploaded photos by this role show a delete button. */
  deletableRole?: ImageUploader;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const all = allOrderImagePaths(images, legacyJson, extras);
  const imageByPath = new Map(images.map((i) => [i.imagePath, i]));

  if (all.length === 0) return null;

  function onDelete(imageId: string) {
    const fd = new FormData();
    fd.set("imageId", imageId);
    startTransition(async () => {
      if (deletableRole === "CUSTOMER") {
        await deleteCustomerOrderImage({ ok: false }, fd);
      } else {
        await deleteShopOrderImage(fd);
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-3">
      <p className="mb-2 text-xs font-bold uppercase text-brand-green">{t(locale, titleKey)}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {all.map((img, i) => {
          const row = imageByPath.get(img.path);
          const canDelete = Boolean(deletableRole && row && row.uploadedBy === deletableRole);
          return (
            <div key={`${img.path}-${i}`} className="overflow-hidden rounded-xl border border-brand-green/10">
              <div className="relative aspect-square">
                <Image src={img.path} alt="" fill className="object-cover" unoptimized />
                {canDelete && row && (
                  <button
                    type="button"
                    onClick={() => onDelete(row.id)}
                    disabled={pending}
                    className="absolute right-1 top-1 rounded-full bg-red-600 p-0.5 text-white disabled:opacity-60"
                    aria-label={t(locale, "removePhoto")}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <p className="bg-zinc-50 px-1 py-0.5 text-center text-xs text-zinc-600">
                {img.caption ?? (img.by === "SHOP" ? t(locale, "shopUpload") : t(locale, "customerUpload"))}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
