"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Design } from "@prisma/client";
import type { Locale } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/categories";
import { MAX_DESIGN_IMAGES } from "@/lib/limits";
import { DesignImageUpload } from "@/components/DesignImageUpload";
import { ShopDesignItem } from "@/components/ShopDesignItem";
import { ImagePlus } from "lucide-react";

export function ShopDesignsPanel({
  locale,
  designs,
}: {
  locale: Locale;
  designs: Design[];
}) {
  const router = useRouter();
  const [category, setCategory] = useState(CATEGORIES[0].key);
  const [title, setTitle] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [pending, setPending] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState("");

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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (imageFiles.length === 0) {
      setError(t(locale, "designPhotoRequired"));
      return;
    }
    if (imageFiles.length > MAX_DESIGN_IMAGES) {
      setError(t(locale, "designMaxPhotosExceeded"));
      return;
    }
    setPending(true);
    const fd = new FormData(e.currentTarget);
    fd.set("category", category);
    fd.set("title", title);
    imageFiles.forEach((f, i) => fd.set(`designImage${i}`, f));
    try {
      const res = await fetch("/api/shop/designs", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || t(locale, "designUploadFailed"));
        return;
      }
      (e.target as HTMLFormElement).reset();
      setTitle("");
      setImageFiles([]);
      router.refresh();
    } catch {
      setError(t(locale, "designUploadFailed"));
    } finally {
      setPending(false);
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
            onClick={() => setCategory(c.key)}
            className={`min-h-[4.5rem] rounded-2xl p-3 text-center text-sm font-semibold shadow-md transition active:scale-[0.98] ${
              c.color
            } ${category === c.key ? "ring-4 ring-brand-gold ring-offset-2" : "opacity-90 hover:opacity-100"}`}
          >
            <span className="block leading-tight">{t(locale, c.labelKey)}</span>
            <span className="mt-1 block text-xs opacity-90">{counts[c.key] ?? 0}</span>
          </button>
        ))}
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-brand-green">
            {t(locale, activeCategory.labelKey)}
          </h2>
          <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-brand-green">
            {categoryDesigns.length} {t(locale, "collectionItems")}
          </span>
        </div>

        <form onSubmit={onSubmit} encType="multipart/form-data" className="card-premium space-y-4 p-5">
          <h3 className="flex items-center gap-2 font-bold text-brand-green">
            <ImagePlus className="h-5 w-5 shrink-0" />
            {t(locale, "uploadDesign")}
          </h3>
          <input type="hidden" name="category" value={category} />
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-brand-green">{t(locale, "designPhoto")}</span>
            <DesignImageUpload
              locale={locale}
              files={imageFiles}
              onFilesChange={setImageFiles}
              onCompressingChange={setCompressing}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-brand-green">{t(locale, "designName")}</span>
            <input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t(locale, "designNamePlaceholder")}
              className="input-premium w-full"
            />
          </label>
          {compressing && (
            <p className="text-center text-sm text-brand-green">{t(locale, "compressingPhotos")}</p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={pending || compressing} className="btn-primary w-full py-3">
            {pending ? "..." : compressing ? t(locale, "compressingPhotos") : t(locale, "saveDesign")}
          </button>
        </form>

        {categoryDesigns.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categoryDesigns.map((d) => (
              <ShopDesignItem key={d.id} design={d} locale={locale} />
            ))}
          </div>
        ) : (
          <p className="card-premium py-10 text-center text-sm text-zinc-500">
            {t(locale, "noDesignsInCategory")}
          </p>
        )}
      </section>
    </div>
  );
}
