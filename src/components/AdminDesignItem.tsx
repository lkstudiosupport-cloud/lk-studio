"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Design, DesignSizeTier } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { DesignImagesView } from "@/components/DesignImagesView";
import { categoryHasSizeTiers, sizeTierLabelKey } from "@/lib/design-size-tier";
import { Trash2 } from "lucide-react";

export function AdminDesignItem({ design, locale }: { design: Design; locale: Locale }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [assigning, setAssigning] = useState(false);

  const showTierAssign = categoryHasSizeTiers(design.category);

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

  async function assignTier(sizeTier: DesignSizeTier) {
    if (design.sizeTier === sizeTier) return;
    setError("");
    setAssigning(true);
    try {
      const res = await fetch("/api/admin/designs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: design.id, sizeTier }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Move failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Move failed");
    } finally {
      setAssigning(false);
    }
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
      <div className="space-y-2 px-2 py-2">
        {design.catalogNumber && (
          <p className="truncate text-center text-xs font-bold text-brand-gold">{design.catalogNumber}</p>
        )}
        <p className="truncate text-center text-xs font-medium text-brand-green">{design.title}</p>
        {showTierAssign && (
          <div className="space-y-1">
            <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              {t(locale, "adminMoveToSize")}
            </p>
            <div className="grid grid-cols-3 gap-1">
              {(["SMALL", "MEDIUM", "BIG"] as DesignSizeTier[]).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  disabled={assigning || pending}
                  onClick={() => void assignTier(tier)}
                  className={`rounded-lg px-1 py-1.5 text-[10px] font-bold transition disabled:opacity-50 ${
                    design.sizeTier === tier
                      ? "bg-brand-green text-brand-gold ring-2 ring-brand-gold"
                      : "bg-brand-cream text-brand-green ring-1 ring-brand-green/20 hover:bg-brand-green/10"
                  }`}
                >
                  {t(locale, sizeTierLabelKey(tier))}
                </button>
              ))}
            </div>
          </div>
        )}
        {error && <p className="text-center text-xs text-red-600">{error}</p>}
      </div>
    </article>
  );
}
