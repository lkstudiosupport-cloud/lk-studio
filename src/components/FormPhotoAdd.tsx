"use client";

import { Camera, ImageIcon, Plus, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";

/** Single optional photo with + button — syncs to named form field for server actions. */
export function FormPhotoAdd({
  locale,
  name,
  compact,
}: {
  locale: Locale;
  name: string;
  compact?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function onPick(file: File | undefined) {
    if (!file || !fileRef.current) return;
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    const dt = new DataTransfer();
    dt.items.add(file);
    fileRef.current.files = dt.files;
  }

  const box = compact ? "h-16 w-16" : "h-20 w-20";
  const icon = compact ? "h-6 w-6" : "h-8 w-8";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {preview ? (
        <div className={`relative ${box} shrink-0 overflow-hidden rounded-lg border border-brand-green/20`}>
          <Image src={preview} alt="" fill className="object-cover" unoptimized />
          <button
            type="button"
            onClick={() => {
              if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
              setPreview(null);
              if (fileRef.current) fileRef.current.value = "";
            }}
            className="absolute right-0.5 top-0.5 rounded-full bg-red-600 p-0.5 text-white"
            aria-label={t(locale, "removePhoto")}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        className={`flex ${box} shrink-0 flex-col items-center justify-center rounded-lg border-2 border-dashed border-brand-green/30 bg-white text-brand-green`}
        aria-label={t(locale, "add")}
      >
        <Plus className={`${icon} stroke-[2.5]`} />
      </button>

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-2 gap-3 p-4">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  cameraRef.current?.click();
                }}
                className="flex flex-col items-center gap-2 rounded-xl bg-brand-green py-4 text-sm font-semibold text-brand-gold"
              >
                <Camera className="h-6 w-6" />
                {t(locale, "camera")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  galleryRef.current?.click();
                }}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-brand-green py-4 text-sm font-semibold text-brand-green"
              >
                <ImageIcon className="h-6 w-6" />
                {t(locale, "localPhotos")}
              </button>
            </div>
          </div>
        </div>
      )}

      <input ref={fileRef} name={name} type="file" accept="image/*" className="hidden" />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
    </div>
  );
}
