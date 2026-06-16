"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Design, ServiceCategory } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { CATEGORIES, isCategoryShopUpload } from "@/lib/categories";
import { SHOP_UPLOAD_CATEGORY } from "@/lib/design-access";
import { MAX_DESIGN_IMAGES } from "@/lib/limits";
import { ShopDesignItem } from "@/components/ShopDesignItem";
import { compressImageFile } from "@/lib/compress-image";
import { Loader2, Plus } from "lucide-react";

export function ShopDesignsPanel({
  locale,
  designs,
}: {
  locale: Locale;
  designs: Design[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<ServiceCategory>(CATEGORIES[0].key);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const canUpload = isCategoryShopUpload(category);

  const counts = useMemo(() => {
    const map = {} as Record<string, number>;
    for (const c of CATEGORIES) {
      map[c.key] = designs.filter((d) => d.category === c.key).length;
    }
    return map;
  }, [designs]);

  const activeCategory = CATEGORIES.find((c) => c.key === category)!;
  const categoryDesigns = useMemo(
    () => designs.filter((d) => d.category === category),
    [designs, category]
  );

  async function uploadFiles(raw: FileList | null) {
    if (!raw?.length || !canUpload) return;
    setError("");
    setPending(true);
    try {
      const picked = Array.from(raw).slice(0, MAX_DESIGN_IMAGES);
      const files = await Promise.all(picked.map((f) => compressImageFile(f)));
      const fd = new FormData();
      fd.set("category", SHOP_UPLOAD_CATEGORY);
      fd.set("title", t(locale, "categories.stitched"));
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

        <p className="text-sm text-zinc-600">
          {canUpload ? t(locale, "shopStitchedHint") : t(locale, "catalogDesignsHint")}
        </p>

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
              manageable={canUpload && !d.isCatalog}
            />
          ))}
        </div>

        {categoryDesigns.length === 0 && !canUpload && (
          <p className="card-premium py-10 text-center text-sm text-zinc-500">
            {t(locale, "noCatalogDesignsYet")}
          </p>
        )}

        {categoryDesigns.length === 0 && canUpload && (
          <p className="text-center text-sm text-zinc-500">{t(locale, "noStitchedDesignsYet")}</p>
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
