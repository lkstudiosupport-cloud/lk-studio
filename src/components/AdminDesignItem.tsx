"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Design } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { DesignImagesView } from "@/components/DesignImagesView";
import { Trash2 } from "lucide-react";

export function AdminDesignItem({ design, locale }: { design: Design; locale: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function onDelete() {
    if (!confirm("Delete this catalog design?")) return;
    setError("");
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/designs?id=${encodeURIComponent(design.id)}`, {
          method: "DELETE",
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) throw new Error(data.error || "Delete failed");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Delete failed");
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
          previewCloseLabel={t(locale, "closePreview")}
          previewLabel={t(locale, "tapToPreview")}
        />
        <button
          type="button"
          onClick={onDelete}
          disabled={pending}
          className="absolute left-2 top-2 rounded-full bg-red-600 p-1.5 text-white shadow disabled:opacity-60"
          aria-label="Delete design"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="truncate px-2 py-2 text-center text-xs font-medium text-brand-green">
        {design.catalogNumber ? (
          <span className="block font-bold text-brand-gold">{design.catalogNumber}</span>
        ) : null}
        {design.title}
      </p>
      {error && <p className="px-2 pb-2 text-xs text-red-600">{error}</p>}
    </article>
  );
}
