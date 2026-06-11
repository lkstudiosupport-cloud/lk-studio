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
import { ChevronDown, FolderClosed } from "lucide-react";

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
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map = {} as Record<string, number>;
    for (const c of CATEGORIES) {
      map[c.key] = designs.filter((d) => d.category === c.key).length;
    }
    return map;
  }, [designs]);

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
      <h1 className="page-title">{t(locale, "designs")}</h1>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => {
              setCategory(c.key);
              setOpenFolder(c.key);
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

      <form onSubmit={onSubmit} encType="multipart/form-data" className="card-premium space-y-4 p-5">
        <h2 className="font-bold text-brand-green">
          {t(locale, "uploadDesign")} — {t(locale, CATEGORIES.find((c) => c.key === category)!.labelKey)}
        </h2>
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
            required
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

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-green">
          {t(locale, "yourDesigns")}
        </h2>
        <div className="space-y-2">
          {CATEGORIES.map((c) => {
            const items = designs.filter((d) => d.category === c.key);
            const isOpen = openFolder === c.key;
            return (
              <details
                key={c.key}
                open={isOpen}
                className="group overflow-hidden rounded-xl border border-brand-green/15 bg-white shadow-sm"
              >
                <summary
                  className={`flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden ${c.color}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const next = isOpen ? null : c.key;
                    setOpenFolder(next);
                    if (next) setCategory(c.key);
                  }}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <FolderClosed className="h-4 w-4 shrink-0" />
                    <span className="truncate">{t(locale, c.labelKey)}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{items.length}</span>
                    <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                  </span>
                </summary>
                <div className="border-t border-brand-green/10 p-3">
                  {items.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {items.map((d) => (
                        <ShopDesignItem key={d.id} design={d} locale={locale} />
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-sm text-zinc-500">{t(locale, "noDesignsInCategory")}</p>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}
