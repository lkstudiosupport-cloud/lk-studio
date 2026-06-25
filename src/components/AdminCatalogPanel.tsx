"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Design, ServiceCategory } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/categories";
import { CATALOG_CATEGORIES } from "@/lib/design-access";
import { MAX_CATALOG_BULK_UPLOAD } from "@/lib/limits";
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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [lastCode, setLastCode] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");

  const counts = useMemo(() => {
    const map = {} as Record<string, number>;
    for (const c of ADMIN_CATEGORIES) {
      map[c.key] = designs.filter((d) => d.category === c.key && d.isCatalog).length;
    }
    return map;
  }, [designs]);

  const activeCategory = ADMIN_CATEGORIES.find((c) => c.key === category)!;
  const hasSizeTiers = categoryHasSizeTiers(category);
  const hasCatalogParts = categoryHasCatalogParts(category);

  const categoryDesigns = useMemo(() => {
    return designs
      .filter((d) => d.category === category && d.isCatalog)
      .sort((a, b) => {
        if (a.catalogNumber && b.catalogNumber) return a.catalogNumber.localeCompare(b.catalogNumber);
        return b.createdAt > a.createdAt ? 1 : -1;
      });
  }, [designs, category]);

  const tierCounts = useMemo(() => {
    const counts = { SMALL: 0, MEDIUM: 0, BIG: 0 } as Record<DesignSizeTier, number>;
    let unassigned = 0;
    for (const d of categoryDesigns) {
      if (!d.sizeTier) unassigned++;
      else counts[d.sizeTier]++;
    }
    return { ...counts, unassigned };
  }, [categoryDesigns]);

  const partCounts = useMemo(() => {
    const counts = { MAIN: 0, HAND_SLEEVES: 0 } as Record<CatalogPart, number>;
    let unassigned = 0;
    for (const d of categoryDesigns) {
      if (!d.catalogPart) unassigned++;
      else counts[d.catalogPart]++;
    }
    return { ...counts, unassigned };
  }, [categoryDesigns]);

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

  async function uploadOne(file: File) {
    const fd = new FormData();
    fd.set("category", category);
    fd.set("designImage0", file);
    const { res, data } = await fetchApi("/api/admin/designs", { method: "POST", body: fd });
    if (!res.ok) throw new Error(String(data.error ?? "Upload failed"));
    return String(data.catalogNumber ?? "");
  }

  async function uploadFiles(raw: FileList | null) {
    if (!raw?.length) return;
    setError("");
    setLastCode("");
    setUploadProgress("");
    setPending(true);
    try {
      const picked = Array.from(raw).slice(0, MAX_CATALOG_BULK_UPLOAD);
      let last = "";
      for (let i = 0; i < picked.length; i++) {
        setUploadProgress(`${i + 1}/${picked.length}`);
        const compressed = await compressImageFile(picked[i]!);
        last = await uploadOne(compressed);
      }
      if (last) setLastCode(last);
      router.refresh();
    } catch (e) {
      setError(formatFetchError(e, "Upload failed"));
    } finally {
      setPending(false);
      setUploadProgress("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

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
              setSizeTierFilter("UNASSIGNED");
              setCatalogPartFilter("UNASSIGNED");
              setError("");
              setLastCode("");
            }}
            className={`min-h-[4rem] rounded-2xl p-2.5 text-center text-xs font-semibold shadow-md transition active:scale-[0.98] sm:min-h-[4.5rem] sm:p-3 sm:text-sm ${
              c.color
            } ${category === c.key ? "category-tab-active" : "opacity-90 hover:opacity-100"}`}
          >
            <span className="block leading-tight">{t(locale, c.labelKey)}</span>
            <span className="mt-1 block text-xs opacity-90">{counts[c.key] ?? 0}</span>
          </button>
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-brand-green">{t(locale, activeCategory.labelKey)}</h2>
          <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-brand-green">
            {visibleDesigns.length} designs
          </span>
        </div>

        <p className="text-sm text-zinc-600">
          Tap + and select many images from your computer — one design code per photo.
          {hasSizeTiers && (
            <>
              {" "}
              {t(locale, "adminCatalogSizeTierHint")}
            </>
          )}
          {hasCatalogParts && (
            <>
              {" "}
              {t(locale, "adminCatalogPartHint")}
            </>
          )}
        </p>

        {hasSizeTiers && (
          <SizeTierButtons
            locale={locale}
            active={sizeTierFilter === "UNASSIGNED" ? undefined : sizeTierFilter}
            onPick={setSizeTierFilter}
            counts={{
              SMALL: tierCounts.SMALL,
              MEDIUM: tierCounts.MEDIUM,
              BIG: tierCounts.BIG,
            }}
            showUnassigned
            unassignedCount={tierCounts.unassigned}
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
            counts={{
              MAIN: partCounts.MAIN,
              HAND_SLEEVES: partCounts.HAND_SLEEVES,
            }}
            showUnassigned
            unassignedCount={partCounts.unassigned}
            unassignedActive={catalogPartFilter === "UNASSIGNED"}
            onPickUnassigned={() => setCatalogPartFilter("UNASSIGNED")}
          />
        )}

        {uploadProgress && (
          <p className="text-sm font-medium text-brand-green">Uploading {uploadProgress}…</p>
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
            <AdminDesignItem key={d.id} design={d} locale={locale} />
          ))}
        </div>
      </section>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => void uploadFiles(e.target.files)}
      />
    </div>
  );
}
