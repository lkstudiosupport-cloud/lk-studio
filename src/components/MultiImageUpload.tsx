"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n/locales";
import { MAX_ORDER_UPLOAD_PHOTOS } from "@/lib/limits";
import { PhotoSlotsUpload } from "@/components/PhotoSlotsUpload";

type Props = {
  namePrefix: string;
  label: string;
  locale: Locale;
  max?: number;
};

export function MultiImageUpload({
  namePrefix,
  label,
  locale,
  max = MAX_ORDER_UPLOAD_PHOTOS,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <PhotoSlotsUpload
      locale={locale}
      max={max}
      files={files}
      onFilesChange={setFiles}
      fieldPrefix={namePrefix}
      label={label}
      showCount={files.length > 0}
      compress={false}
      slotSize="h-24 w-24"
    />
  );
}
