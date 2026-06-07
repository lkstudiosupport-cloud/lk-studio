"use client";

import { Camera, Plus } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type Props = {
  namePrefix: string;
  label: string;
  cameraLabel?: string;
  minHint?: string;
};

export function MultiImageUpload({
  namePrefix,
  label,
  cameraLabel = "Add photos",
  minHint,
}: Props) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [slots, setSlots] = useState(3);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-brand-green">{label}</p>
      {minHint && <p className="text-xs text-zinc-500">{minHint}</p>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: slots }, (_, i) => (
          <label
            key={i}
            className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-brand-green/15 bg-brand-cream/40 p-2 hover:border-brand-gold"
          >
            <Camera className="h-5 w-5 text-brand-green" />
            <span className="mt-1 text-center text-xs font-medium text-brand-green">
              {cameraLabel} {i + 1}
            </span>
            <input
              type="file"
              name={`${namePrefix}${i + 1}`}
              accept="image/*"
              capture="environment"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const url = URL.createObjectURL(f);
                  setPreviews((p) => {
                    const n = [...p];
                    n[i] = url;
                    return n;
                  });
                }
              }}
            />
            {previews[i] && (
              <div className="relative mt-1 h-14 w-full">
                <Image src={previews[i]} alt="" fill className="rounded object-cover" unoptimized />
              </div>
            )}
          </label>
        ))}
        <button
          type="button"
          onClick={() => setSlots((s) => s + 2)}
          className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-300 text-zinc-500"
        >
          <Plus className="h-6 w-6" />
          <span className="mt-1 text-xs font-medium">More</span>
        </button>
      </div>
      <label className="mt-2 block">
        <span className="text-xs text-brand-green">Or select multiple from gallery</span>
        <input
          type="file"
          name={`${namePrefix}Multi`}
          accept="image/*"
          multiple
          className="mt-1 block w-full text-xs"
        />
      </label>
    </div>
  );
}
