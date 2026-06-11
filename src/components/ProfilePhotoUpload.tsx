"use client";

import { Camera, ImageIcon, User, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";

export function ProfilePhotoUpload({
  locale,
  currentPhoto,
  name,
}: {
  locale: Locale;
  currentPhoto: string | null;
  name?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const removeRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentPhoto);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setPreview(currentPhoto);
    if (removeRef.current) removeRef.current.value = "";
  }, [currentPhoto]);

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
    if (removeRef.current) removeRef.current.value = "";
  }

  function onRemove() {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    if (removeRef.current) removeRef.current.value = "true";
  }

  function openCamera() {
    setMenuOpen(false);
    cameraRef.current?.click();
  }

  function openGallery() {
    setMenuOpen(false);
    galleryRef.current?.click();
  }

  return (
    <div className="flex flex-col items-center gap-3 border-b border-zinc-100 pb-5">
      <p className="text-sm font-semibold text-brand-green">{t(locale, "profilePhoto")}</p>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="group relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-brand-gold bg-brand-cream shadow-md transition active:scale-[0.98]"
          aria-label={t(locale, "changeProfilePhoto")}
        >
          {preview ? (
            <Image src={preview} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-brand-green/40">
              <User className="h-14 w-14" />
            </div>
          )}
          <span className="absolute inset-0 flex items-end justify-center bg-black/0 pb-2 transition group-hover:bg-black/20 group-active:bg-black/25">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green text-brand-gold shadow-md">
              <Camera className="h-4 w-4" />
            </span>
          </span>
        </button>
        {preview && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute -right-1 top-0 rounded-full bg-red-600 p-1 text-white shadow"
            aria-label={t(locale, "removePhoto")}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {name && <p className="text-center text-sm font-medium text-zinc-700">{name}</p>}

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={t(locale, "changeProfilePhoto")}
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <p className="font-semibold text-brand-green">{t(locale, "changeProfilePhoto")}</p>
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

      <input ref={fileRef} name="profilePhotoFile" type="file" accept="image/*" className="hidden" />
      <input ref={removeRef} name="removeProfilePhoto" type="hidden" defaultValue="" />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="user"
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
