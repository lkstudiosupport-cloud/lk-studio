"use client";

import { Camera } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type Props = {
  name: string;
  label: string;
  cameraLabel?: string;
  multiple?: boolean;
  max?: number;
};

export function ImageCaptureInput({
  name,
  label,
  cameraLabel = "Camera",
  multiple = false,
  max = 1,
}: Props) {
  const [previews, setPreviews] = useState<string[]>([]);

  if (multiple && max > 1) {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-brand-green">{label}</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {Array.from({ length: max }, (_, i) => (
            <label
              key={i}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-green/15 bg-brand-cream/50 p-3 transition hover:border-brand-gold"
            >
              <Camera className="mb-1 h-5 w-5 text-brand-green" />
              <span className="text-xs font-medium text-brand-green">
                {cameraLabel} {i + 1}
              </span>
              <input
                type="file"
                name={`${name}${i + 1}`}
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setPreviews((p) => {
                      const next = [...p];
                      next[i] = URL.createObjectURL(f);
                      return next;
                    });
                  }
                }}
              />
              {previews[i] && (
                <div className="relative mt-2 h-20 w-full">
                  <Image src={previews[i]} alt="" fill className="rounded-lg object-cover" unoptimized />
                </div>
              )}
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-brand-green">{label}</p>
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-green/15 bg-brand-cream/50 p-4 transition hover:border-brand-gold">
        <Camera className="mb-2 h-6 w-6 text-brand-green" />
        <span className="text-sm font-medium text-brand-green">{cameraLabel}</span>
        <span className="mt-1 text-xs text-zinc-500">Camera or gallery</span>
        <input
          type="file"
          name={name}
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setPreviews([URL.createObjectURL(f)]);
          }}
        />
      </label>
      {previews[0] && (
        <div className="relative h-32 w-full max-w-xs">
          <Image src={previews[0]} alt="" fill className="rounded-xl object-cover" unoptimized />
        </div>
      )}
    </div>
  );
}
