"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CatalogPart, DesignSizeTier, ServiceCategory } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { CATEGORIES, isCategoryShopUpload } from "@/lib/categories";
import type { CatalogPartCounts, CatalogSizeTierCounts } from "@/lib/catalog-design-counts";
import { CatalogCategoryTabs } from "@/components/CatalogCategoryTabs";
import { CatalogDesignPager } from "@/components/CatalogDesignPager";
import { isShopOwnedUploadCategory } from "@/lib/design-access";
import type { DesignListItem } from "@/lib/design-list-select";
import { withQueryParam } from "@/lib/query-string";
import { MAX_DESIGN_IMAGES } from "@/lib/limits";
import { ShopDesignItem } from "@/components/ShopDesignItem";
import { SizeTierButtons } from "@/components/SizeTierButtons";
import { CatalogPartButtons } from "@/components/CatalogPartButtons";
import { categoryHasSizeTiers, defaultSizeTierForCategory } from "@/lib/design-size-tier";
import { categoryHasCatalogParts, defaultCatalogPartForCategory } from "@/lib/design-catalog-part";
import { compressImageFile } from "@/lib/compress-image";
import { useCatalogBrowseSwitch } from "@/hooks/useCatalogBrowseSwitch";
import { Loader2, Plus } from "lucide-react";

const BASE_PATH = "/shop/designs";

function shopDesignsUrl(
  category: ServiceCategory,
  sizeTier?: DesignSizeTier,
  catalogPart?: CatalogPart
): string {
  let url = withQueryParam(BASE_PATH, "category", category);
  if (sizeTier) url = withQueryParam(url, "size", sizeTier);
  if (catalogPart) url = withQueryParam(url, "part", catalogPart);
  return url;
}

export function ShopDesignsPanel({
  locale,
  designs,
  total,
  hasMore,
  apiQuery,
  shopId,
  initialCategory,
  sizeTier,
  catalogPart,
  categoryCounts,
  allTierCounts,
  allPartCounts,
  initialBrowseCache,
}: {
  locale: Locale;
  designs: DesignListItem[];
  total: number;
  hasMore: boolean;
  apiQuery: string;
  shopId: string;
  initialCategory: ServiceCategory;
  sizeTier?: DesignSizeTier;
  catalogPart?: CatalogPart;
  categoryCounts: Record<ServiceCategory, number>;
  allTierCounts: Partial<Record<ServiceCategory, CatalogSizeTierCounts>>;
  allPartCounts: Partial<Record<ServiceCategory, CatalogPartCounts>>;
  initialBrowseCache?: Record<string, { items: DesignListItem[]; total: number | null; hasMore: boolean }>;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");

  const pageUrl = useCallback(
    (cat: ServiceCategory, tier?: DesignSizeTier, part?: CatalogPart) =>
      shopDesignsUrl(cat, tier, part),
    []
  );
  const shopCategories = CATEGORIES.map((c) => c.key);
  const browse = useCatalogBrowseSwitch({
    initialCategory,
    catalogCategories: shopCategories,
    initialSizeTier: sizeTier ?? defaultSizeTierForCategory(initialCategory),
    initialCatalogPart: catalogPart ?? defaultCatalogPartForCategory(initialCategory),
    initialDesigns: designs,
    initialTotal: total,
    initialHasMore: hasMore,
    initialApiQuery: apiQuery,
    initialBrowseCache,
    pageUrl,
  });
  const category = browse.category;
  const activeSizeTier = browse.sizeTier;
  const activeCatalogPart = browse.catalogPart;
  const visibleDesigns = browse.designs;
  const tierCounts = allTierCounts[category] ?? null;
  const partCounts = allPartCounts[category] ?? null;

  const canUpload = isCategoryShopUpload(category);
  const activeCategory = CATEGORIES.find((c) => c.key === category)!;
  const hasSizeTiers = categoryHasSizeTiers(category);
  const hasCatalogParts = categoryHasCatalogParts(category);
  const needsSubgroup = hasSizeTiers || hasCatalogParts;

  const subgroupReady =
    !needsSubgroup ||
    (hasSizeTiers && activeSizeTier) ||
    (hasCatalogParts && activeCatalogPart);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t(locale, "designs")}</h1>
      </div>

      <CatalogCategoryTabs
        locale={locale}
        tabs={CATEGORIES}
        active={category}
        counts={categoryCounts}
        onPick={browse.pickCategory}
        onPrefetch={browse.prefetchCategory}
      />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-brand-green">
            {t(locale, activeCategory.labelKey)}
          </h2>
        </div>

        {isShopOwnedUploadCategory(category) && (
          <p className="text-sm text-zinc-600">{t(locale, "shopStitchedHint")}</p>
        )}

        {hasSizeTiers && (
          <div className="space-y-2">
            <SizeTierButtons
              locale={locale}
              active={activeSizeTier}
              onPick={browse.pickSizeTier}
              onPrefetch={browse.prefetchSizeTier}
              counts={
                tierCounts
                  ? { SMALL: tierCounts.SMALL, MEDIUM: tierCounts.MEDIUM, BIG: tierCounts.BIG }
                  : undefined
              }
            />
            {!activeSizeTier && (
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
              active={activeCatalogPart}
              onPick={browse.pickCatalogPart}
              onPrefetch={browse.prefetchCatalogPart}
              counts={
                partCounts
                  ? { MAIN: partCounts.MAIN, HAND_SLEEVES: partCounts.HAND_SLEEVES }
                  : undefined
              }
            />
            {!activeCatalogPart && (
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

        {subgroupReady && (
          <div className="relative space-y-4">
            {browse.switching && (
              <div className="flex items-center justify-center gap-2 py-1 text-sm text-zinc-600">
                <Loader2 className="h-4 w-4 animate-spin text-brand-green" />
                {t(locale, "loadingDesigns")}
              </div>
            )}
            {browse.switchError && (
              <p className="text-center text-sm text-red-600">{browse.switchError}</p>
            )}
            <div className={browse.switching ? "opacity-70 transition-opacity" : "transition-opacity"}>
            <CatalogDesignPager
              locale={locale}
              initialDesigns={visibleDesigns}
              total={browse.total}
              hasMore={browse.hasMore}
              apiQuery={browse.apiQuery}
            >
            {(pagedDesigns) => (
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
                        <span className="px-2 text-center text-xs font-semibold">
                          {t(locale, "addDesignPhoto")}
                        </span>
                      </>
                    )}
                  </button>
                )}

                {pagedDesigns.map((d) => (
                  <ShopDesignItem
                    key={d.id}
                    design={d}
                    locale={locale}
                    manageable={canManageDesign(d)}
                  />
                ))}
              </div>
            )}
          </CatalogDesignPager>
            </div>
          </div>
        )}

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
