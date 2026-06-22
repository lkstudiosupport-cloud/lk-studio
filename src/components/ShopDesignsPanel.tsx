"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CatalogPart, DesignSizeTier, ServiceCategory } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { CATEGORIES, isCategoryShopUpload } from "@/lib/categories";
import { isShopOwnedUploadCategory } from "@/lib/design-access";
import type { DesignListItem } from "@/lib/design-list-select";
import { withQueryParam } from "@/lib/query-string";
import { MAX_DESIGN_IMAGES } from "@/lib/limits";
import { ShopDesignItem } from "@/components/ShopDesignItem";
import { SizeTierButtons } from "@/components/SizeTierButtons";
import { CatalogPartButtons } from "@/components/CatalogPartButtons";
import { categoryHasSizeTiers } from "@/lib/design-size-tier";
import { categoryHasCatalogParts } from "@/lib/design-catalog-part";
import { compressImageFile } from "@/lib/compress-image";
import { Loader2, Plus } from "lucide-react";

const BASE_PATH = "/shop/designs";

export function ShopDesignsPanel({
  locale,
  designs,
  shopId,
  category,
  categoryCounts,
}: {
  locale: Locale;
  designs: DesignListItem[];
  shopId: string;
  category: ServiceCategory;
  categoryCounts: Record<ServiceCategory, number>;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");
  const [sizeTier, setSizeTier] = useState<DesignSizeTier | undefined>();
  const [catalogPart, setCatalogPart] = useState<CatalogPart | undefined>();

  const canUpload = isCategoryShopUpload(category);
  const activeCategory = CATEGORIES.find((c) => c.key === category)!;
  const hasSizeTiers = categoryHasSizeTiers(category);
  const hasCatalogParts = categoryHasCatalogParts(category);
  const needsSubgroup = hasSizeTiers || hasCatalogParts;

  const tierCounts = useMemo(() => {
    if (!hasSizeTiers) return null;
    const counts = { SMALL: 0, MEDIUM: 0, BIG: 0 } as Record<DesignSizeTier, number>;
    for (const d of designs) {
      if (!d.sizeTier) continue;
      counts[d.sizeTier]++;
    }
    return counts;
  }, [designs, hasSizeTiers]);

  const partCounts = useMemo(() => {
    if (!hasCatalogParts) return null;
    const counts = { MAIN: 0, HAND_SLEEVES: 0 } as Record<CatalogPart, number>;
    for (const d of designs) {
      if (!d.catalogPart) continue;
      counts[d.catalogPart]++;
    }
    return counts;
  }, [designs, hasCatalogParts]);

  const visibleDesigns = useMemo(() => {
    let list = designs;
    if (hasSizeTiers) {
      if (!sizeTier) return [];
      list = list.filter((d) => d.sizeTier === sizeTier);
    }
    if (hasCatalogParts) {
      if (!catalogPart) return [];
      list = list.filter((d) => d.catalogPart === catalogPart);
    }
    return list;
  }, [designs, hasSizeTiers, hasCatalogParts, sizeTier, catalogPart]);

  useEffect(() => {
    setSizeTier(undefined);
    setCatalogPart(undefined);
  }, [category]);

  const subgroupReady =
    !needsSubgroup || (hasSizeTiers && sizeTier) || (hasCatalogParts && catalogPart);

  function canManageDesign(design: DesignListItem): boolean {
    return canUpload && isShopOwnedUploadCategory(category) && !design.isCatalog && design.shopId === shopId;
  }

  async function uploadOneDesign(files: File[]) {
    const fd = new FormData();
    fd.set("category", category);
    fd.set("title", t(locale, "categories.stitched"));
    files.forEach((f, i) => fd.set(`designImage${i}`, f));

    const res = await fetch("/api/shop/designs", { method: "POST", body: fd });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      throw new Error(data.error || t(locale, "designUploadFailed"));
    }
  }

  async function uploadFiles(raw: FileList | null) {
    if (!raw?.length || !canUpload) return;
    setError("");
    setUploadProgress("");
    setPending(true);
    try {
      const picked = Array.from(raw).slice(0, MAX_DESIGN_IMAGES);
      setUploadProgress(`1/${picked.length}`);
      const files = await Promise.all(picked.map((f) => compressImageFile(f)));
      await uploadOneDesign(files);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t(locale, "designUploadFailed"));
    } finally {
      setPending(false);
      setUploadProgress("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function uploadHint(): string {
    if (isShopOwnedUploadCategory(category)) return t(locale, "shopStitchedHint");
    return t(locale, "catalogDesignsHint");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t(locale, "designs")}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t(locale, "shopDesignsHint")}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CATEGORIES.map((c) => (
          <Link
            key={c.key}
            href={withQueryParam(BASE_PATH, "category", c.key)}
            scroll={false}
            prefetch
            className={`min-h-[4.5rem] rounded-2xl p-3 text-center text-sm font-semibold shadow-md transition hover:opacity-100 ${
              c.color
            } ${category === c.key ? "ring-4 ring-brand-gold ring-offset-2" : "opacity-90"}`}
          >
            <span className="block leading-tight">{t(locale, c.labelKey)}</span>
            <span className="mt-1 block text-xs opacity-90">{categoryCounts[c.key] ?? 0}</span>
          </Link>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-brand-green">
            {t(locale, activeCategory.labelKey)}
          </h2>
          <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-brand-green">
            {visibleDesigns.length} {t(locale, "collectionItems")}
          </span>
        </div>

        <p className="text-sm text-zinc-600">{uploadHint()}</p>

        {hasSizeTiers && (
          <div className="space-y-2">
            <SizeTierButtons
              locale={locale}
              active={sizeTier}
              onPick={setSizeTier}
              counts={tierCounts ?? undefined}
            />
            {!sizeTier && (
              <p className="card-premium p-4 text-center text-sm text-zinc-600">
                {t(locale, "customerPickSizeTierHint")}
              </p>
            )}
          </div>
        )}

        {hasCatalogParts && (
          <div className="space-y-2">
            <CatalogPartButtons
              locale={locale}
              category={category}
              active={catalogPart}
              onPick={setCatalogPart}
              counts={partCounts ?? undefined}
            />
            {!catalogPart && (
              <p className="card-premium p-4 text-center text-sm text-zinc-600">
                {t(locale, "customerPickCatalogPartHint")}
              </p>
            )}
          </div>
        )}

        {uploadProgress && (
          <p className="text-sm font-medium text-brand-green">
            {t(locale, "uploadingProgress", { current: uploadProgress })}
          </p>
        )}

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

          {subgroupReady &&
            visibleDesigns.map((d) => (
              <ShopDesignItem
                key={d.id}
                design={d}
                locale={locale}
                manageable={canManageDesign(d)}
              />
            ))}
        </div>

        {visibleDesigns.length === 0 && !canUpload && needsSubgroup && !subgroupReady && (
          <p className="card-premium py-10 text-center text-sm text-zinc-500">
            {hasCatalogParts ? t(locale, "customerPickCatalogPartHint") : t(locale, "customerPickSizeTierHint")}
          </p>
        )}

        {visibleDesigns.length === 0 && !canUpload && subgroupReady && (
          <p className="card-premium py-10 text-center text-sm text-zinc-500">
            {t(locale, "noCatalogDesignsYet")}
          </p>
        )}

        {visibleDesigns.length === 0 && canUpload && (
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
