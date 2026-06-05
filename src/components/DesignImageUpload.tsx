"use client";

import { Camera, ImageIcon, Plus, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { MAX_DESIGN_IMAGES } from "@/lib/design-images";
import { compressImageFile } from "@/lib/compress-image";

type SlotPreview = { file: File; url: string };

export function DesignImageUpload({
  locale,
  files,
  onFilesChange,
  onCompressingChange,
}: {
  locale: Locale;
  files: File[];
  onFilesChange: (files: File[]) => void;
  onCompressingChange?: (compressing: boolean) => void;
}) {
  const [previews, setPreviews] = useState<SlotPreview[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const compressingRef = useRef(0);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  useEffect(() => {
    if (files.length === 0 && previews.length > 0) {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      setPreviews([]);
    }
  }, [files.length, previews]);

  function setCompressing(active: boolean) {
    if (active) compressingRef.current += 1;
    else compressingRef.current = Math.max(0, compressingRef.current - 1);
    onCompressingChange?.(compressingRef.current > 0);
  }

  function syncFiles(next: SlotPreview[]) {
    setPreviews(next);
    onFilesChange(next.map((p) => p.file));
  }

  async function fileToPreview(file: File): Promise<SlotPreview> {
    setCompressing(true);
    try {
      const compressed = await compressImageFile(file);
      return { file: compressed, url: URL.createObjectURL(compressed) };
    } finally {
      setCompressing(false);
    }
  }

  async function addFiles(newFiles: File[]) {
    const room = MAX_DESIGN_IMAGES - previews.length;
    if (room <= 0) return;
    const picked = newFiles.slice(0, room);
    const added = await Promise.all(picked.map((f) => fileToPreview(f)));
    syncFiles([...previews, ...added]);
  }

  function removeAt(index: number) {
    const target = previews[index];
    if (target) URL.revokeObjectURL(target.url);
    syncFiles(previews.filter((_, i) => i !== index));
  }

  function openCamera() {
    setMenuOpen(false);
    cameraRef.current?.click();
  }

  function openGallery() {
    setMenuOpen(false);
    galleryRef.current?.click();
  }

  const canAddMore = previews.length < MAX_DESIGN_IMAGES;

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-brand-green">{t(locale, "designPhoto")}</p>
      <p className="text-xs text-zinc-500">{t(locale, "designPhotosUpTo2")}</p>

      <div className="flex flex-wrap gap-3">
        {previews.map((slot, index) => (
          <div
            key={slot.url}
            className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border-2 border-brand-gold bg-white shadow-sm"
          >
            <Image src={slot.url} alt="" fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="absolute right-1 top-1 rounded-full bg-red-600 p-1 text-white shadow"
              aria-label={t(locale, "removePhoto")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {canAddMore && (
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-28 w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-brand-green/25 bg-brand-cream/60 text-brand-green transition hover:border-brand-gold hover:bg-brand-cream active:scale-[0.98]"
            aria-label={t(locale, "addDesignPhoto")}
          >
            <Plus className="h-10 w-10 stroke-[2.5]" />
            <span className="text-xs font-semibold">{t(locale, "add")}</span>
          </button>
        )}
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={t(locale, "addDesignPhoto")}
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <p className="font-semibold text-brand-green">{t(locale, "addDesignPhoto")}</p>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100"
                aria-label={t(locale, "cancel")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              <button
                type="button"
                onClick={openCamera}
                className="flex flex-col items-center gap-2 rounded-xl bg-brand-green py-4 text-sm font-semibold text-brand-gold"
              >
                <Camera className="h-6 w-6" />
                {t(locale, "camera")}
              </button>
              <button
                type="button"
                onClick={openGallery}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-brand-green py-4 text-sm font-semibold text-brand-green"
              >
                <ImageIcon className="h-6 w-6" />
                {t(locale, "localPhotos")}
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void addFiles([f]);
          e.target.value = "";
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void addFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />

      <p className="text-center text-xs font-medium text-brand-green">
        {previews.length}/{MAX_DESIGN_IMAGES} {t(locale, "photosUploaded")}
      </p>
    </div>
  );
}
