"use client";

import { Camera, ImageIcon, Plus, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";

export function UpiQrUpload({
  locale,
  currentImage,
}: {
  locale: Locale;
  currentImage: string | null;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImage);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setPreview(currentImage);
  }, [currentImage]);

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

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-brand-green">{t(locale, "upiQr")}</p>
      <div className="flex flex-wrap items-center gap-3">
        {preview ? (
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border-2 border-brand-gold bg-white shadow-sm"
            aria-label={t(locale, "changeUpiQr")}
          >
            <Image src={preview} alt="UPI QR" fill className="object-contain p-1" unoptimized />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="flex h-28 w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-brand-green/25 bg-brand-cream/60 text-brand-green transition hover:border-brand-gold hover:bg-brand-cream active:scale-[0.98]"
            aria-label={t(locale, "addUpiQr")}
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
          aria-label={t(locale, "addUpiQr")}
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <p className="font-semibold text-brand-green">{t(locale, "addUpiQr")}</p>
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

      <input ref={fileRef} name="upiQrFile" type="file" accept="image/*" className="hidden" />
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
