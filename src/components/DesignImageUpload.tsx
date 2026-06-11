"use client";

import type { Locale } from "@/lib/i18n/locales";
import { MAX_DESIGN_IMAGES } from "@/lib/design-images";
import { PhotoSlotsUpload } from "@/components/PhotoSlotsUpload";

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
  return (
    <PhotoSlotsUpload
      locale={locale}
      max={MAX_DESIGN_IMAGES}
      files={files}
      onFilesChange={onFilesChange}
      onCompressingChange={onCompressingChange}
      label={undefined}
      showCount
      compress
    />
  );
}
