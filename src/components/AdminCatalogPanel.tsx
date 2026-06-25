"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Design, ServiceCategory } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/categories";
import { CATALOG_CATEGORIES } from "@/lib/design-access";
import { AdminDesignItem } from "@/components/AdminDesignItem";
import { SizeTierButtons } from "@/components/SizeTierButtons";
import { CatalogPartButtons } from "@/components/CatalogPartButtons";
import { categoryHasSizeTiers } from "@/lib/design-size-tier";
import { categoryHasCatalogParts } from "@/lib/design-catalog-part";
import type { CatalogPart, DesignSizeTier } from "@prisma/client";
import { compressImageFile } from "@/lib/compress-image";
import { fetchApi, formatFetchError } from "@/lib/parse-api-response";
import { Loader2, Plus } from "lucide-react";

const ADMIN_CATEGORIES = CATEGORIES.filter((c) =>
  CATALOG_CATEGORIES.includes(c.key)
);

export function AdminCatalogPanel({
  locale,
  designs,
}: {
  locale: Locale;
  designs: Design[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<ServiceCategory>(ADMIN_CATEGORIES[0]!.key);
  const [sizeTierFilter, setSizeTierFilter] = useState<DesignSizeTier | "UNASSIGNED">("UNASSIGNED");
  const [catalogPartFilter, setCatalogPartFilter] = useState<CatalogPart | "UNASSIGNED">("UNASSIGNED");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [lastCode, setLastCode] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");

  const activeCategory = ADMIN_CATEGORIES.find((c) => c.key === category)!;
  const hasSizeTiers = categoryHasSizeTiers(category);
  const hasCatalogParts = categoryHasCatalogParts(category);
  const onUnassignedView =
    (hasSizeTiers && sizeTierFilter === "UNASSIGNED") ||
    (hasCatalogParts && catalogPartFilter === "UNASSIGNED");

  useEffect(() => {
    setSelectedIds(new Set());
    setSizeTierFilter("UNASSIGNED");
    setCatalogPartFilter("UNASSIGNED");
  }, [category]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [sizeTierFilter, catalogPartFilter]);

  const categoryDesigns = useMemo(() => {
    return designs
      .filter((d) => d.category === category && d.isCatalog)
      .sort((a, b) => {
        if (a.catalogNumber && b.catalogNumber) return a.catalogNumber.localeCompare(b.catalogNumber);
        return b.createdAt > a.createdAt ? 1 : -1;
      });
  }, [designs, category]);

  const visibleDesigns = useMemo(() => {
    if (hasSizeTiers) {
      if (sizeTierFilter === "UNASSIGNED") {
        return categoryDesigns.filter((d) => !d.sizeTier);
      }
      return categoryDesigns.filter((d) => d.sizeTier === sizeTierFilter);
    }
    if (hasCatalogParts) {
      if (catalogPartFilter === "UNASSIGNED") {
        return categoryDesigns.filter((d) => !d.catalogPart);
      }
      return categoryDesigns.filter((d) => d.catalogPart === catalogPartFilter);
    }
    return categoryDesigns;
  }, [categoryDesigns, hasSizeTiers, hasCatalogParts, sizeTierFilter, catalogPartFilter]);

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelectedIds(new Set(visibleDesigns.map((d) => d.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function uploadOne(file: File) {
    const fd = new FormData();
    fd.set("category", category);
    fd.set("designImage0", file);
    const { res, data } = await fetchApi("/api/admin/designs", { method: "POST", body: fd });
    if (!res.ok) throw new Error(String(data.error ?? "Upload failed"));
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
      }
      if (last) setLastCode(last);
      if (hasSizeTiers) setSizeTierFilter("UNASSIGNED");
      if (hasCatalogParts) setCatalogPartFilter("UNASSIGNED");
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
      if (body.sizeTier) setSizeTierFilter(body.sizeTier);
      if (body.catalogPart) setCatalogPartFilter(body.catalogPart);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assign failed");
    } finally {
      setPending(false);
      setUploadProgress("");
    }
  }

  async function compressFilesInBatches(files: File[], batchSize = 12): Promise<File[]> {
    const compressed: File[] = [];
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      setUploadProgress(`Compressing ${Math.min(i + batch.length, files.length)}/${files.length}`);
      const batchCompressed = await Promise.all(batch.map((f) => compressImageFile(f)));
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
          <button
            key={c.key}
            type="button"
            onClick={() => {
              setCategory(c.key);
              setError("");
              setLastCode("");
            }}
            className={`min-h-[4rem] rounded-2xl p-2.5 text-center text-xs font-semibold shadow-md transition active:scale-[0.98] sm:min-h-[4.5rem] sm:p-3 sm:text-sm ${
              c.color
            } ${category === c.key ? "category-tab-active" : "opacity-90 hover:opacity-100"}`}
          >
            <span className="block leading-tight">{t(locale, c.labelKey)}</span>
          </button>
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
            active={sizeTierFilter === "UNASSIGNED" ? undefined : sizeTierFilter}
            onPick={setSizeTierFilter}
            showUnassigned
            unassignedActive={sizeTierFilter === "UNASSIGNED"}
            onPickUnassigned={() => setSizeTierFilter("UNASSIGNED")}
          />
        )}

        {hasCatalogParts && (
          <CatalogPartButtons
            locale={locale}
            category={category}
            active={catalogPartFilter === "UNASSIGNED" ? undefined : catalogPartFilter}
            onPick={setCatalogPartFilter}
            showUnassigned
            unassignedActive={catalogPartFilter === "UNASSIGNED"}
            onPickUnassigned={() => setCatalogPartFilter("UNASSIGNED")}
          />
        )}

        {onUnassignedView && visibleDesigns.length > 0 && (
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

          {visibleDesigns.map((d) => (
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
