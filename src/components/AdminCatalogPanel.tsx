"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ServiceCategory } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/categories";
import { CATALOG_CATEGORIES } from "@/lib/design-access";
import { AdminDesignItem } from "@/components/AdminDesignItem";
import { SizeTierButtons } from "@/components/SizeTierButtons";
import { CatalogPartButtons } from "@/components/CatalogPartButtons";
import { categoryHasSizeTiers } from "@/lib/design-size-tier";
import { categoryHasCatalogParts } from "@/lib/design-catalog-part";
import type { CatalogPartCounts, CatalogSizeTierCounts } from "@/lib/catalog-design-counts";
import type { DesignListItem } from "@/lib/design-list-select";
import type { CatalogPart, DesignSizeTier } from "@prisma/client";
import { compressImageFile } from "@/lib/compress-image";
import { fetchApi, formatFetchError } from "@/lib/parse-api-response";
import { withQueryParam } from "@/lib/query-string";
import { CatalogDesignPager } from "@/components/CatalogDesignPager";
import type { CatalogAdminQuery } from "@/lib/catalog-design-list";
import { Loader2, Plus } from "lucide-react";

const ADMIN_CATEGORIES = CATEGORIES.filter((c) => CATALOG_CATEGORIES.includes(c.key));
const ADMIN_BASE = "/admin/designs";

function adminDesignsUrl(
  category: ServiceCategory,
  sizeView?: CatalogAdminQuery["sizeView"],
  partView?: CatalogAdminQuery["partView"]
): string {
  let url = withQueryParam(ADMIN_BASE, "category", category);
  if (sizeView) url = withQueryParam(url, "sizeView", sizeView);
  if (partView) url = withQueryParam(url, "partView", partView);
  return url;
}

export function AdminCatalogPanel({
  locale,
  category,
  sizeView,
  partView,
  designs,
  total,
  hasMore,
  apiQuery,
  categoryCounts,
  tierCounts,
  partCounts,
}: {
  locale: Locale;
  category: ServiceCategory;
  sizeView?: CatalogAdminQuery["sizeView"];
  partView?: CatalogAdminQuery["partView"];
  designs: DesignListItem[];
  total: number;
  hasMore: boolean;
  apiQuery: string;
  categoryCounts: Partial<Record<ServiceCategory, number>>;
  tierCounts: CatalogSizeTierCounts | null;
  partCounts: CatalogPartCounts | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [lastCode, setLastCode] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");

  const activeCategory = ADMIN_CATEGORIES.find((c) => c.key === category)!;
  const hasSizeTiers = categoryHasSizeTiers(category);
  const hasCatalogParts = categoryHasCatalogParts(category);
  const sizeTierFilter = sizeView ?? "unassigned";
  const catalogPartFilter = partView ?? "unassigned";
  const onUnassignedView =
    (hasSizeTiers && sizeTierFilter === "unassigned") ||
    (hasCatalogParts && catalogPartFilter === "unassigned");

  useEffect(() => {
    setSelectedIds(new Set());
  }, [category, sizeTierFilter, catalogPartFilter]);

  const safeTierCounts = tierCounts ?? { SMALL: 0, MEDIUM: 0, BIG: 0, unassigned: 0 };
  const safePartCounts = partCounts ?? { MAIN: 0, HAND_SLEEVES: 0, unassigned: 0 };

  function pickSizeView(view: DesignSizeTier | "unassigned") {
    router.push(adminDesignsUrl(category, view, partView));
  }

  function pickPartView(view: CatalogPart | "unassigned") {
    router.push(adminDesignsUrl(category, sizeView, view));
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds(new Set(designs.map((d) => d.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function uploadOne(file: File) {
    const fd = new FormData();
    fd.set("category", category);
    fd.set("designImage0", file);
    const { res, data } = await fetchApi("/api/admin/designs", { method: "POST", body: fd });
    if (!res.ok || data.error) {
      throw new Error(String(data.error ?? `Upload failed (${res.status})`));
    }
    return String(data.catalogNumber ?? "");
  }

  async function runUpload(files: File[]) {
    if (!files.length) return;
    setError("");
    setLastCode("");
    setUploadProgress("");
    setPending(true);
    try {
      let last = "";
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`${i + 1}/${files.length}`);
        last = await uploadOne(files[i]!);
        // Brief pause between uploads — avoids Render timeout on bulk batches.
        if (i < files.length - 1) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }
      if (last) setLastCode(last);
      router.push(adminDesignsUrl(category, "unassigned", partView));
      router.refresh();
    } catch (e) {
      setError(formatFetchError(e, "Upload failed"));
    } finally {
      setPending(false);
      setUploadProgress("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function assignSelected(body: { sizeTier?: DesignSizeTier; catalogPart?: CatalogPart }) {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setError("");
    setLastCode("");
    setUploadProgress("");
    setPending(true);
    try {
      setUploadProgress(`0/${ids.length}`);
      const res = await fetch("/api/admin/designs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, ...body }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        catalogNumber?: string;
        count?: number;
      };
      if (!res.ok) throw new Error(data.error || "Assign failed");
      if (data.catalogNumber) setLastCode(data.catalogNumber);
      setSelectedIds(new Set());
      if (body.sizeTier) router.push(adminDesignsUrl(category, body.sizeTier, partView));
      else if (body.catalogPart) router.push(adminDesignsUrl(category, sizeView, body.catalogPart));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assign failed");
    } finally {
      setPending(false);
      setUploadProgress("");
    }
  }

  async function compressFilesInBatches(files: File[], batchSize = 8): Promise<File[]> {
    const compressed: File[] = [];
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      setUploadProgress(`Compressing ${Math.min(i + batch.length, files.length)}/${files.length}`);
      const batchCompressed = await Promise.all(
        batch.map(async (f) => {
          try {
            return await compressImageFile(f);
          } catch {
            return f;
          }
        })
      );
      compressed.push(...batchCompressed);
    }
    return compressed;
  }

  async function pickFiles(raw: FileList | null) {
    if (!raw?.length) return;
    setError("");
    setPending(true);
    try {
      const picked = Array.from(raw);
      const compressed = await compressFilesInBatches(picked);
      await runUpload(compressed);
    } catch (e) {
      setError(formatFetchError(e, "Upload failed"));
    } finally {
      setPending(false);
      setUploadProgress("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">App catalog (admin)</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Upload many photos at once — each gets a design code (MAG-0001, EMB-0001, BLU-0001, …).
          All shops and customers see these designs.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ADMIN_CATEGORIES.map((c) => (
          <Link
            key={c.key}
            href={adminDesignsUrl(c.key, "unassigned", "unassigned")}
            scroll={false}
            prefetch
            className={`min-h-[4rem] rounded-2xl p-2.5 text-center text-xs font-semibold shadow-md transition sm:min-h-[4.5rem] sm:p-3 sm:text-sm ${
              c.color
            } ${category === c.key ? "category-tab-active" : "opacity-90 hover:opacity-100"}`}
          >
            <span className="block leading-tight">{t(locale, c.labelKey)}</span>
            <span className="mt-1 block text-xs opacity-90">({categoryCounts[c.key] ?? 0})</span>
          </Link>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-brand-green">{t(locale, activeCategory.labelKey)}</h2>
        </div>

        <p className="text-sm text-zinc-600">
          {hasSizeTiers
            ? t(locale, "adminCatalogBulkUploadHint")
            : hasCatalogParts
              ? t(locale, "adminCatalogPartUploadHint")
              : t(locale, "adminCatalogSimpleUploadHint")}
        </p>

        {hasSizeTiers && (
          <SizeTierButtons
            locale={locale}
            active={sizeTierFilter === "unassigned" ? undefined : sizeTierFilter}
            onPick={(tier) => pickSizeView(tier)}
            counts={{
              SMALL: safeTierCounts.SMALL,
              MEDIUM: safeTierCounts.MEDIUM,
              BIG: safeTierCounts.BIG,
            }}
            showUnassigned
            unassignedCount={safeTierCounts.unassigned}
            unassignedActive={sizeTierFilter === "unassigned"}
            onPickUnassigned={() => pickSizeView("unassigned")}
          />
        )}

        {hasCatalogParts && (
          <CatalogPartButtons
            locale={locale}
            category={category}
            active={catalogPartFilter === "unassigned" ? undefined : catalogPartFilter}
            onPick={(part) => pickPartView(part)}
            counts={{
              MAIN: safePartCounts.MAIN,
              HAND_SLEEVES: safePartCounts.HAND_SLEEVES,
            }}
            showUnassigned
            unassignedCount={safePartCounts.unassigned}
            unassignedActive={catalogPartFilter === "unassigned"}
            onPickUnassigned={() => pickPartView("unassigned")}
          />
        )}

        {onUnassignedView && designs.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={selectAllVisible}
              className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
            >
              {t(locale, "adminSelectAll")}
            </button>
            {selectedCount > 0 && (
              <button
                type="button"
                disabled={pending}
                onClick={clearSelection}
                className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
              >
                {t(locale, "adminClearSelection")}
              </button>
            )}
          </div>
        )}

        {onUnassignedView && selectedCount > 0 && (
          <div className={`card-premium space-y-3 p-4 ${pending ? "pointer-events-none opacity-60" : ""}`}>
            <p className="text-sm font-semibold text-brand-green">
              {t(locale, "adminBulkAssignSelected", { count: selectedCount })}
            </p>
            {hasSizeTiers && (
              <SizeTierButtons
                locale={locale}
                onPick={(tier) => void assignSelected({ sizeTier: tier })}
              />
            )}
            {hasCatalogParts && (
              <CatalogPartButtons
                locale={locale}
                category={category}
                onPick={(part) => void assignSelected({ catalogPart: part })}
              />
            )}
          </div>
        )}

        {uploadProgress && (
          <p className="text-sm font-medium text-brand-green">{uploadProgress}…</p>
        )}

        {lastCode && (
          <p className="text-sm font-semibold text-emerald-700">Last saved: {lastCode}</p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <CatalogDesignPager
          locale={locale}
          initialDesigns={designs}
          total={total}
          hasMore={hasMore}
          apiQuery={apiQuery}
        >
          {(pagedDesigns) => (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
                    <span className="px-2 text-center text-xs font-semibold">Add photos (bulk)</span>
                  </>
                )}
              </button>

              {pagedDesigns.map((d) => (
                <AdminDesignItem
                  key={d.id}
                  design={d}
                  locale={locale}
                  selectable={onUnassignedView}
                  selected={selectedIds.has(d.id)}
                  onToggleSelect={() => toggleSelected(d.id)}
                />
              ))}
            </div>
          )}
        </CatalogDesignPager>
      </section>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => void pickFiles(e.target.files)}
      />
    </div>
  );
}
