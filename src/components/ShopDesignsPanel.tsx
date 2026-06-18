"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Design, DesignSizeTier, ServiceCategory } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { CATEGORIES, isCategoryCatalogUpload, isCategoryShopUpload } from "@/lib/categories";
import { categoryHasSizeTiers, DESIGN_SIZE_TIERS, sizeTierLabelKey } from "@/lib/design-size-tier";
import { MAX_DESIGN_IMAGES } from "@/lib/limits";
import { ShopDesignItem } from "@/components/ShopDesignItem";
import { compressImageFile } from "@/lib/compress-image";
import { Loader2, Plus } from "lucide-react";

export function ShopDesignsPanel({
  locale,
  designs,
  shopId,
}: {
  locale: Locale;
  designs: Design[];
  shopId: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<ServiceCategory>(CATEGORIES[0].key);
  const [sizeTier, setSizeTier] = useState<DesignSizeTier>("SMALL");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const hasSizeTiers = categoryHasSizeTiers(category);
  const canUpload = isCategoryShopUpload(category);

  const counts = useMemo(() => {
    const map = {} as Record<string, number>;
    for (const c of CATEGORIES) {
      map[c.key] = designs.filter((d) => d.category === c.key).length;
    }
    return map;
  }, [designs]);

  const activeCategory = CATEGORIES.find((c) => c.key === category)!;
  const categoryDesigns = useMemo(() => {
    let list = designs.filter((d) => d.category === category);
    if (hasSizeTiers) {
      list = list.filter((d) => d.sizeTier === sizeTier);
    }
    return list.sort((a, b) => {
      if (a.catalogNumber && b.catalogNumber) return a.catalogNumber.localeCompare(b.catalogNumber);
      return b.createdAt > a.createdAt ? 1 : -1;
    });
  }, [designs, category, hasSizeTiers, sizeTier]);

  function designManageable(d: Design): boolean {
    if (d.isCatalog) {
      return isCategoryCatalogUpload(category) && d.uploadedByShopId === shopId;
    }
    return canUpload && !d.isCatalog;
  }

  async function uploadFiles(raw: FileList | null) {
    if (!raw?.length || !canUpload) return;
    if (hasSizeTiers && !sizeTier) {
      setError(t(locale, "selectSizeTier"));
      return;
    }
    setError("");
    setPending(true);
    try {
      const picked = Array.from(raw).slice(0, MAX_DESIGN_IMAGES);
      const files = await Promise.all(picked.map((f) => compressImageFile(f)));
      const fd = new FormData();
      fd.set("category", category);
      if (hasSizeTiers) fd.set("sizeTier", sizeTier);
      fd.set("title", "");
      files.forEach((f, i) => fd.set(`designImage${i}`, f));

      const res = await fetch("/api/shop/designs", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || t(locale, "designUploadFailed"));
        return;
      }
      router.refresh();
    } catch {
      setError(t(locale, "designUploadFailed"));
    } finally {
      setPending(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const hintKey = canUpload
    ? isCategoryCatalogUpload(category)
      ? "catalogUploadHint"
      : "shopStitchedHint"
    : "catalogDesignsHint";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t(locale, "designs")}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t(locale, "shopDesignsHint")}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => {
              setCategory(c.key);
              setError("");
            }}
            className={`min-h-[4.5rem] rounded-2xl p-3 text-center text-sm font-semibold shadow-md transition active:scale-[0.98] ${
              c.color
            } ${category === c.key ? "ring-4 ring-brand-gold ring-offset-2" : "opacity-90 hover:opacity-100"}`}
          >
            <span className="block leading-tight">{t(locale, c.labelKey)}</span>
            <span className="mt-1 block text-xs opacity-90">{counts[c.key] ?? 0}</span>
          </button>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-brand-green">
            {t(locale, activeCategory.labelKey)}
          </h2>
          <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-brand-green">
            {categoryDesigns.length} {t(locale, "collectionItems")}
          </span>
        </div>

        {hasSizeTiers && (
          <div className="flex flex-wrap gap-2">
            {DESIGN_SIZE_TIERS.map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setSizeTier(tier)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  sizeTier === tier
                    ? "bg-brand-gold text-brand-green ring-2 ring-brand-green ring-offset-2"
                    : "bg-white text-brand-green ring-1 ring-brand-green/20 hover:bg-brand-cream"
                }`}
              >
                {t(locale, sizeTierLabelKey(tier))}
              </button>
            ))}
          </div>
        )}

        <p className="text-sm text-zinc-600">{t(locale, hintKey)}</p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {canUpload && (
            <button
              type="button"
              disabled={pending}
              onClick={() => fileRef.current?.click()}
              className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-green/35 bg-brand-cream/40 text-brand-green transition hover:border-brand-green/60 hover:bg-brand-cream/70 disabled:opacity-60"
            >
              {pending ? (
                <Loader2 className="h-8 w-8 animate-spin text-brand-gold" />
              ) : (
                <>
                  <Plus className="h-8 w-8 text-brand-gold" />
                  <span className="px-2 text-center text-xs font-semibold">{t(locale, "addDesignPhoto")}</span>
                </>
              )}
            </button>
          )}

          {categoryDesigns.map((d) => (
            <ShopDesignItem
              key={d.id}
              design={d}
              locale={locale}
              manageable={designManageable(d)}
            />
          ))}
        </div>

        {categoryDesigns.length === 0 && !canUpload && (
          <p className="card-premium py-10 text-center text-sm text-zinc-500">
            {t(locale, "noCatalogDesignsYet")}
          </p>
        )}

        {categoryDesigns.length === 0 && canUpload && (
          <p className="text-center text-sm text-zinc-500">
            {hasSizeTiers ? t(locale, "noDesignsInSizeTier") : t(locale, "noStitchedDesignsYet")}
          </p>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => void uploadFiles(e.target.files)}
        />
      </section>
    </div>
  );
}
