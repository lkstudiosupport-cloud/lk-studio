"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Design } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { parseDesignImages } from "@/lib/design-images";
import { deleteDesign, deleteDesignImage } from "@/app/shop/actions";
import { DesignImagesView } from "@/components/DesignImagesView";
import { Trash2, X } from "lucide-react";
import Image from "next/image";

export function ShopDesignItem({
  design,
  locale,
  manageable = true,
}: {
  design: Design;
  locale: Locale;
  manageable?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const images = parseDesignImages(design.imagesJson, design.imagePath);

  function onDeleteImage(imagePath: string) {
    setError("");
    const fd = new FormData();
    fd.set("designId", design.id);
    fd.set("imagePath", imagePath);
    startTransition(async () => {
      try {
        await deleteDesignImage(fd);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : t(locale, "deletePhotoFailed"));
      }
    });
  }

  function onDeleteDesign() {
    if (!confirm(t(locale, "deleteDesignConfirm"))) return;
    setError("");
    startTransition(async () => {
      try {
        await deleteDesign(design.id);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : t(locale, "deletePhotoFailed"));
      }
    });
  }

  return (
    <article className="card-premium overflow-hidden">
      <div className="relative">
        <DesignImagesView
          imagePath={design.imagePath}
          imagesJson={design.imagesJson}
          alt={design.title}
          aspectClass="aspect-[3/4]"
        />
        {manageable && (
          <button
            type="button"
            onClick={onDeleteDesign}
            disabled={pending}
            className="absolute left-2 top-2 rounded-full bg-red-600 p-1.5 text-white shadow disabled:opacity-60"
            aria-label={t(locale, "deleteDesign")}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-1 border-t border-brand-green/10 p-2">
          {images.map((path) => (
            <div key={path} className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
              <Image src={path} alt="" fill className="object-cover" unoptimized />
              {manageable && (
                <button
                  type="button"
                  onClick={() => onDeleteImage(path)}
                  disabled={pending}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition hover:opacity-100 disabled:opacity-50"
                  aria-label={t(locale, "removePhoto")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="truncate px-2 py-2 text-center text-xs font-medium text-brand-green">{design.title}</p>
      {error && <p className="px-2 pb-2 text-xs text-red-600">{error}</p>}
    </article>
  );
}
